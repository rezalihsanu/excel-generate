import io
import openpyxl
import pandas as pd
import pytest
from app.services.excel_service import excel_service

def create_sample_workbook_bytes() -> bytes:
    wb = openpyxl.Workbook()
    # Sheet 1
    ws1 = wb.active
    ws1.title = "Sales"
    ws1.append(["Category", "Revenue", "Units", "DuplicateCol", "DuplicateCol"])
    ws1.append(["Electronics", 12000, 15, "A", "X"])
    ws1.append(["Furniture", 8500, 8, "B", "Y"])
    ws1.append(["Office", 3200, 25, "C", "Z"])
    ws1.append(["Electronics", 9800, 11, "D", "W"])

    # Sheet 2
    ws2 = wb.create_sheet(title="Inventory")
    ws2.append(["Item", "Stock"])
    ws2.append(["Laptop", 50])
    ws2.append(["Chair", 120])

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()

def test_inspect_workbook():
    content = create_sample_workbook_bytes()
    sheets = excel_service.inspect_workbook(content, "test_file.xlsx")
    assert sheets == ["Sales", "Inventory"]

def test_load_sheet_dataframe():
    content = create_sample_workbook_bytes()
    df = excel_service.load_sheet_dataframe(content, "test_file.xlsx", "Sales")
    assert len(df) == 4
    # Check deduplicated headers
    assert "DuplicateCol" in df.columns
    assert "DuplicateCol_1" in df.columns
    assert "Category" in df.columns
    assert "Revenue" in df.columns

def test_paginated_preview():
    content = create_sample_workbook_bytes()
    df = excel_service.load_sheet_dataframe(content, "test_file.xlsx", "Sales")
    data, total_rows, total_pages = excel_service.get_paginated_preview(df, page=1, page_size=2)
    assert total_rows == 4
    assert total_pages == 2
    assert len(data) == 2
    assert data[0]["Category"] == "Electronics"
