import io
import math
from typing import Any, Dict, List, Tuple
import openpyxl
import pandas as pd
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

class ExcelService:
    @staticmethod
    def validate_file(file: UploadFile, content: bytes) -> None:
        # Check size
        if len(content) > settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
            )

        filename = file.filename or ""
        ext = filename.lower().split(".")[-1] if "." in filename else ""
        if ext not in ["xlsx", "xls"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file format. Please upload an Excel file (.xlsx or .xls)."
            )

        # Check signature (magic bytes)
        # XLSX = PK\x03\x04 (zip archive)
        # XLS = \xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1 (OLE CF)
        is_xlsx = content.startswith(b"PK\x03\x04")
        is_xls = content.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")

        if not (is_xlsx or is_xls):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file signature. The file is not a valid Excel spreadsheet."
            )

    @staticmethod
    def inspect_workbook(content: bytes, filename: str) -> List[str]:
        """Returns list of sheet names from workbook content."""
        ext = filename.lower().split(".")[-1] if "." in filename else "xlsx"
        try:
            if ext == "xlsx" or content.startswith(b"PK\x03\x04"):
                wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
                sheet_names = wb.sheetnames
                wb.close()
                return sheet_names
            else:
                # XLS legacy
                xls = pd.ExcelFile(io.BytesIO(content), engine="xlrd")
                return xls.sheet_names
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to inspect Excel workbook structure: {str(e)}"
            )

    @staticmethod
    def load_sheet_dataframe(content: bytes, filename: str, sheet_name: str) -> pd.DataFrame:
        """Loads a specific sheet into a sanitized Pandas DataFrame."""
        ext = filename.lower().split(".")[-1] if "." in filename else "xlsx"
        try:
            engine = "openpyxl" if (ext == "xlsx" or content.startswith(b"PK\x03\x04")) else "xlrd"
            df = pd.read_excel(
                io.BytesIO(content),
                sheet_name=sheet_name,
                engine=engine
            )
            
            # Clean dataframe
            # 1. Drop completely empty rows and columns
            df.dropna(how="all", inplace=True)
            df.dropna(how="all", axis=1, inplace=True)
            
            if df.empty:
                return pd.DataFrame()

            # 2. Sanitize and deduplicate column headers
            clean_cols = []
            seen_cols: Dict[str, int] = {}
            for i, col in enumerate(df.columns):
                col_name = str(col).strip() if (col is not None and not pd.isna(col)) else f"Column_{i+1}"
                if col_name.startswith("Unnamed:"):
                    col_name = f"Column_{i+1}"
                # If pandas already added .1 or .2, normalize base name
                base_name = col_name.split(".")[0] if "." in col_name and col_name.split(".")[-1].isdigit() else col_name
                if base_name in seen_cols:
                    seen_cols[base_name] += 1
                    col_name = f"{base_name}_{seen_cols[base_name]}"
                else:
                    seen_cols[base_name] = 0
                    col_name = base_name
                clean_cols.append(col_name)

            df.columns = clean_cols
            return df
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to load worksheet '{sheet_name}': {str(e)}"
            )

    @staticmethod
    def sanitize_for_json(val: Any) -> Any:
        if pd.isna(val) or val is None:
            return None
        if isinstance(val, (int, float)):
            if math.isnan(val) or math.isinf(val):
                return None
            return val
        if isinstance(val, (pd.Timestamp, pd.Timedelta)):
            return str(val)
        return str(val)

    @classmethod
    def get_paginated_preview(
        cls,
        df: pd.DataFrame,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Dict[str, Any]], int, int]:
        total_rows = len(df)
        total_pages = max(1, math.ceil(total_rows / page_size))
        
        # Ensure page is within bounds
        current_page = max(1, min(page, total_pages))
        start_idx = (current_page - 1) * page_size
        end_idx = min(start_idx + page_size, total_rows)
        
        slice_df = df.iloc[start_idx:end_idx]
        
        records = []
        for _, row in slice_df.iterrows():
            record = {}
            for col in df.columns:
                record[col] = cls.sanitize_for_json(row[col])
            records.append(record)
            
        return records, total_rows, total_pages

excel_service = ExcelService()
