import io
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from app.core.config import settings
from app.core.security import AuthenticatedUser, get_current_user
from app.core.supabase import supabase
from app.schemas.reports import ReportCreateRequest, ReportResponse
from app.services.excel_service import excel_service
from app.services.analytics_service import analytics_service
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    req: ReportCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    # Verify analysis ownership
    analyses = await supabase.select(
        "analyses",
        params={
            "id": f"eq.{req.analysis_id}",
            "user_id": f"eq.{current_user.id}"
        }
    )
    if not analyses:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    analysis_record = analyses[0]

    # Pre-populate chart data if not provided in request
    files = await supabase.select(
        "uploaded_files",
        params={"id": f"eq.{analysis_record['file_id']}"}
    )
    if not files:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source file not found")
    file_record = files[0]

    content = await supabase.download_file(
        bucket=settings.SUPABASE_STORAGE_BUCKET_EXCEL,
        path=file_record["storage_path"]
    )
    df = excel_service.load_sheet_dataframe(content, file_record["original_filename"], analysis_record["sheet_name"])

    processed_charts = []
    for chart_item in req.selected_charts:
        ch_dict = chart_item.model_dump()
        if not ch_dict.get("chart_data") or len(ch_dict["chart_data"]) == 0:
            from app.schemas.analyses import ComputeChartRequest
            chart_comp = analytics_service.compute_chart(
                df,
                ComputeChartRequest(
                    chart_type=ch_dict["chart_type"],
                    x_axis=ch_dict["x_axis"],
                    y_axis=ch_dict.get("y_axis"),
                    aggregation=ch_dict.get("aggregation") or "sum",
                    top_n=10
                )
            )
            ch_dict["chart_data"] = chart_comp.chart_data
        processed_charts.append(ch_dict)

    report_id = str(uuid.uuid4())
    storage_path = f"{current_user.id}/{report_id}.pdf"

    # Generate PDF in memory
    pdf_buffer = io.BytesIO()
    report_meta = {
        "title": req.title,
        "executive_summary": req.executive_summary,
        "selected_charts": processed_charts,
        "key_findings": req.key_findings or [],
    }
    
    try:
        report_service.generate_pdf_report(report_meta, analysis_record, pdf_buffer)
        pdf_bytes = pdf_buffer.getvalue()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ReportLab PDF compilation failed: {str(e)}"
        )

    # Upload to Supabase Storage
    try:
        await supabase.upload_file(
            bucket=settings.SUPABASE_STORAGE_BUCKET_PDF,
            path=storage_path,
            content=pdf_bytes,
            content_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist PDF in storage: {str(e)}"
        )

    # Persist report metadata in DB
    record = {
        "id": report_id,
        "analysis_id": req.analysis_id,
        "user_id": current_user.id,
        "title": req.title,
        "description": req.description,
        "selected_charts": processed_charts,
        "executive_summary": req.executive_summary,
        "key_findings": req.key_findings or [],
        "storage_path": storage_path,
        "file_size_bytes": len(pdf_bytes),
        "status": "completed"
    }

    inserted = await supabase.insert("reports", record)
    res_obj = ReportResponse(**inserted)
    res_obj.download_url = f"/api/reports/{report_id}/download"
    return res_obj

@router.get("", response_model=List[ReportResponse])
async def list_reports(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    items = await supabase.select(
        "reports",
        params={
            "user_id": f"eq.{current_user.id}",
            "order": "created_at.desc"
        }
    )
    result = []
    for r in items:
        obj = ReportResponse(**r)
        obj.download_url = f"/api/reports/{obj.id}/download"
        result.append(obj)
    return result

@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    items = await supabase.select(
        "reports",
        params={
            "id": f"eq.{report_id}",
            "user_id": f"eq.{current_user.id}"
        }
    )
    if not items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    obj = ReportResponse(**items[0])
    obj.download_url = f"/api/reports/{report_id}/download"
    return obj

@router.get("/{report_id}/download")
async def download_report(
    report_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    items = await supabase.select(
        "reports",
        params={
            "id": f"eq.{report_id}",
            "user_id": f"eq.{current_user.id}"
        }
    )
    if not items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    
    report_record = items[0]
    pdf_bytes = await supabase.download_file(
        bucket=settings.SUPABASE_STORAGE_BUCKET_PDF,
        path=report_record["storage_path"]
    )

    clean_filename = f"{report_record.get('title', 'report').replace(' ', '_')}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{clean_filename}"'
        }
    )
