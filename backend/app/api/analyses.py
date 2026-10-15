import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.config import settings
from app.core.security import AuthenticatedUser, get_current_user
from app.core.supabase import supabase
from app.schemas.analyses import (
    AnalysisCreateRequest,
    AnalysisResponse,
    ComputeChartRequest,
    ComputeChartResponse,
)
from app.services.analytics_service import analytics_service
from app.services.chart_recommender import chart_recommender
from app.services.excel_service import excel_service

router = APIRouter(prefix="/analyses", tags=["Analyses"])

@router.post("", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def create_analysis(
    req: AnalysisCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    # Verify file ownership
    files = await supabase.select(
        "uploaded_files",
        params={
            "id": f"eq.{req.file_id}",
            "user_id": f"eq.{current_user.id}"
        }
    )
    if not files:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

    file_record = files[0]
    
    # Download file content
    content = await supabase.download_file(
        bucket=settings.SUPABASE_STORAGE_BUCKET_EXCEL,
        path=file_record["storage_path"]
    )

    df = excel_service.load_sheet_dataframe(content, file_record["original_filename"], req.sheet_name)
    analysis_results = analytics_service.analyze_dataframe(df)
    
    # Recommendations
    recommendations = chart_recommender.recommend(analysis_results["columns_metadata"])
    recs_serialized = [r.model_dump() for r in recommendations]

    analysis_id = str(uuid.uuid4())
    record = {
        "id": analysis_id,
        "file_id": req.file_id,
        "user_id": current_user.id,
        "sheet_name": req.sheet_name,
        "row_count": analysis_results["row_count"],
        "column_count": analysis_results["column_count"],
        "columns_metadata": analysis_results["columns_metadata"],
        "quality_summary": analysis_results["quality_summary"],
        "statistical_summary": analysis_results["statistical_summary"],
        "recommendations": recs_serialized,
    }

    try:
        inserted = await supabase.insert("analyses", record)
        return AnalysisResponse(**inserted)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist analysis record: {str(e)}"
        )

@router.get("", response_model=List[AnalysisResponse])
async def list_analyses(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    items = await supabase.select(
        "analyses",
        params={
            "user_id": f"eq.{current_user.id}",
            "order": "created_at.desc"
        }
    )
    return [AnalysisResponse(**a) for a in items]

@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    items = await supabase.select(
        "analyses",
        params={
            "id": f"eq.{analysis_id}",
            "user_id": f"eq.{current_user.id}"
        }
    )
    if not items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    return AnalysisResponse(**items[0])

@router.post("/{analysis_id}/compute-chart", response_model=ComputeChartResponse)
async def compute_chart(
    analysis_id: str,
    req: ComputeChartRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    # Fetch analysis
    items = await supabase.select(
        "analyses",
        params={
            "id": f"eq.{analysis_id}",
            "user_id": f"eq.{current_user.id}"
        }
    )
    if not items:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    analysis_record = items[0]

    # Fetch file
    files = await supabase.select(
        "uploaded_files",
        params={"id": f"eq.{analysis_record['file_id']}"}
    )
    if not files:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Underlying file not found")
    file_record = files[0]

    content = await supabase.download_file(
        bucket=settings.SUPABASE_STORAGE_BUCKET_EXCEL,
        path=file_record["storage_path"]
    )
    df = excel_service.load_sheet_dataframe(content, file_record["original_filename"], analysis_record["sheet_name"])

    try:
        chart_result = analytics_service.compute_chart(df, req)
        return chart_result
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Chart computation failed: {str(e)}")
