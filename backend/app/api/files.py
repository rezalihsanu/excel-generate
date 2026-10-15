import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from app.core.config import settings
from app.core.security import AuthenticatedUser, get_current_user
from app.core.supabase import supabase
from app.schemas.files import FilePreviewResponse, FileUploadResponse
from app.services.excel_service import excel_service

router = APIRouter(prefix="/files", tags=["Files"])

@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    content = await file.read()
    excel_service.validate_file(file, content)
    
    filename = file.filename or "spreadsheet.xlsx"
    ext = filename.lower().split(".")[-1] if "." in filename else "xlsx"
    mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if ext == "xlsx" else "application/vnd.ms-excel"
    
    # Extract sheet names
    sheet_names = excel_service.inspect_workbook(content, filename)
    if not sheet_names:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded Excel file contains no worksheets."
        )

    file_id = str(uuid.uuid4())
    storage_path = f"{current_user.id}/{file_id}.{ext}"
    
    # Upload to Supabase Storage
    try:
        await supabase.upload_file(
            bucket=settings.SUPABASE_STORAGE_BUCKET_EXCEL,
            path=storage_path,
            content=content,
            content_type=mime_type
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to store file in storage repository: {str(e)}"
        )

    # Insert into database
    record = {
        "id": file_id,
        "user_id": current_user.id,
        "original_filename": filename,
        "storage_path": storage_path,
        "file_size_bytes": len(content),
        "mime_type": mime_type,
        "sheet_names": sheet_names,
        "total_sheets": len(sheet_names),
        "status": "uploaded"
    }
    
    try:
        inserted = await supabase.insert("uploaded_files", record)
        return FileUploadResponse(**inserted)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file metadata: {str(e)}"
        )

@router.get("", response_model=List[FileUploadResponse])
async def list_files(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    files = await supabase.select(
        "uploaded_files",
        params={
            "user_id": f"eq.{current_user.id}",
            "order": "created_at.desc"
        }
    )
    return [FileUploadResponse(**f) for f in files]

@router.get("/{file_id}", response_model=FileUploadResponse)
async def get_file(
    file_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    files = await supabase.select(
        "uploaded_files",
        params={
            "id": f"eq.{file_id}",
            "user_id": f"eq.{current_user.id}"
        }
    )
    if not files:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    return FileUploadResponse(**files[0])

@router.get("/{file_id}/preview", response_model=FilePreviewResponse)
async def preview_file(
    file_id: str,
    sheet_name: Optional[str] = Query(None, description="Sheet to inspect"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Rows per page"),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    # Check ownership
    files = await supabase.select(
        "uploaded_files",
        params={
            "id": f"eq.{file_id}",
            "user_id": f"eq.{current_user.id}"
        }
    )
    if not files:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    
    file_record = files[0]
    sheet_names = file_record.get("sheet_names", [])
    target_sheet = sheet_name if sheet_name in sheet_names else (sheet_names[0] if sheet_names else "Sheet1")

    # Download from storage
    content = await supabase.download_file(
        bucket=settings.SUPABASE_STORAGE_BUCKET_EXCEL,
        path=file_record["storage_path"]
    )
    
    df = excel_service.load_sheet_dataframe(content, file_record["original_filename"], target_sheet)
    data, total_rows, total_pages = excel_service.get_paginated_preview(df, page=page, page_size=page_size)
    
    return FilePreviewResponse(
        file_id=file_id,
        sheet_name=target_sheet,
        page=page,
        page_size=page_size,
        total_rows=total_rows,
        total_columns=len(df.columns),
        total_pages=total_pages,
        columns=list(df.columns),
        data=data
    )

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    files = await supabase.select(
        "uploaded_files",
        params={
            "id": f"eq.{file_id}",
            "user_id": f"eq.{current_user.id}"
        }
    )
    if not files:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    
    # Delete from database (cascades to analyses, charts, reports)
    await supabase.delete("uploaded_files", params={"id": f"eq.{file_id}"})
    return None
