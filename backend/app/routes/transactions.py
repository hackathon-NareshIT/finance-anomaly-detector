from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models_db import User, ScanHistory
from app.routes.auth import get_current_user, get_admin_user
from app.services.anomaly import analyze
from app.services.explainer import enrich_with_reasons

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    filename_lower = file.filename.lower()

    if not (filename_lower.endswith(".csv") or filename_lower.endswith(".pdf")):
        raise HTTPException(status_code=400, detail="Only CSV or PDF files are accepted.")

    content = file.file.read()

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    file_ext = "pdf" if filename_lower.endswith(".pdf") else "csv"

    try:
        result = analyze(content, file_extension=file_ext)
        result = enrich_with_reasons(result)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    scan = ScanHistory(
        user_id=current_user.id,
        filename=file.filename,
        total_transactions=result["total_transactions"],
        anomaly_count=result["anomaly_count"],
        results=result,
    )

    db.add(scan)
    db.commit()

    return result