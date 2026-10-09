import io
import csv
import re
from typing import List, Tuple, Dict, Any, Set
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

EMAIL_REGEX = re.compile(r"^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$")

SAMPLE_DATA = [
    {
        "first_name": "Aman",
        "last_name": "Verma",
        "email": "aman.verma.erp@campus.edu",
        "enrollment_no": "2024BTCS091",
        "department": "Computer Science & Engineering",
        "branch": "CSE",
        "semester": 3,
        "academic_session": "2023-2027",
        "phone_no": "+919876543210",
        "dob": "2004-05-12",
        "guardian_name": "Rajesh Verma",
        "guardian_phone": "+919876543211",
        "address": "B-42 Civil Lines, Jaipur, Rajasthan"
    },
    {
        "first_name": "Priya",
        "last_name": "Singh",
        "email": "priya.singh.erp@campus.edu",
        "enrollment_no": "2024BTEC092",
        "department": "Electronics & Communication Engineering",
        "branch": "ECE",
        "semester": 3,
        "academic_session": "2023-2027",
        "phone_no": "+919876543212",
        "dob": "2004-08-22",
        "guardian_name": "Mahesh Singh",
        "guardian_phone": "+919876543213",
        "address": "Flat 102 Green Heights, New Delhi"
    },
    {
        "first_name": "Rohan",
        "last_name": "Gupta",
        "email": "rohan.gupta.erp@campus.edu",
        "enrollment_no": "2024BTME093",
        "department": "Mechanical Engineering",
        "branch": "ME",
        "semester": 1,
        "academic_session": "2024-2028",
        "phone_no": "+919876543214",
        "dob": "2005-02-18",
        "guardian_name": "Alok Gupta",
        "guardian_phone": "+919876543215",
        "address": "12 Sector 14, Gurugram, Haryana"
    }
]

COLUMNS = [
    "first_name",
    "last_name",
    "email",
    "enrollment_no",
    "department",
    "branch",
    "semester",
    "academic_session",
    "phone_no",
    "dob",
    "guardian_name",
    "guardian_phone",
    "address"
]


def generate_template(format_type: str = "csv") -> Tuple[bytes, str, str]:
    """
    Generates downloadable CSV or XLSX template with instructions and sample rows.
    """
    if format_type.lower() == "xlsx":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Student Import Template"

        # Headers
        ws.append(COLUMNS)
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        thin_border = Border(
            left=Side(style='thin', color='D1D5DB'),
            right=Side(style='thin', color='D1D5DB'),
            top=Side(style='thin', color='D1D5DB'),
            bottom=Side(style='thin', color='D1D5DB')
        )

        for col_num in range(1, len(COLUMNS) + 1):
            cell = ws.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border

        # Sample rows
        for item in SAMPLE_DATA:
            row_data = [item.get(col, "") for col in COLUMNS]
            ws.append(row_data)

        # Style data cells
        for row in ws.iter_rows(min_row=2, max_row=len(SAMPLE_DATA) + 1, min_col=1, max_col=len(COLUMNS)):
            for cell in row:
                cell.border = thin_border
                cell.font = Font(name="Calibri", size=10)

        # Column widths
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return (
            output.getvalue(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "student_import_template.xlsx"
        )
    else:
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=COLUMNS)
        writer.writeheader()
        for item in SAMPLE_DATA:
            writer.writerow(item)
        csv_bytes = output.getvalue().encode("utf-8-sig")
        return (
            csv_bytes,
            "text/csv; charset=utf-8",
            "student_import_template.csv"
        )


def _read_rows_from_bytes(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """
    Extracts raw rows from CSV or XLSX.
    """
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    raw_rows = []

    if ext == "xlsx":
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
        ws = wb.active
        headers = []
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                headers = [str(cell).strip().lower().replace(" ", "_") if cell is not None else "" for cell in row]
                continue
            if not any(row):
                continue
            row_dict = {}
            for col_idx, val in enumerate(row):
                if col_idx < len(headers) and headers[col_idx]:
                    row_dict[headers[col_idx]] = str(val).strip() if val is not None else ""
            raw_rows.append(row_dict)
    else:
        text = file_bytes.decode("utf-8-sig", errors="replace")
        stream = io.StringIO(text)
        # Attempt sniff delimiter
        sample = text[:2048]
        delimiter = ","
        if ";" in sample and sample.count(";") > sample.count(","):
            delimiter = ";"
        elif "\t" in sample and sample.count("\t") > sample.count(","):
            delimiter = "\t"

        reader = csv.DictReader(stream, delimiter=delimiter)
        for row in reader:
            clean_row = {}
            for k, v in row.items():
                if k is not None:
                    clean_row[k.strip().lower().replace(" ", "_")] = (v or "").strip()
            if any(clean_row.values()):
                raw_rows.append(clean_row)

    return raw_rows


def parse_and_validate_student_rows(
    file_bytes: bytes,
    filename: str,
    existing_emails: Set[str],
    existing_enrollments: Set[str]
) -> Dict[str, Any]:
    """
    Parses and validates rows row-by-row.
    Returns preview summary with status, row errors, and normalized records.
    """
    try:
        raw_rows = _read_rows_from_bytes(file_bytes, filename)
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to parse file: {str(e)}",
            "total_rows": 0,
            "valid_rows": 0,
            "invalid_rows": 0,
            "rows": []
        }

    seen_emails_in_file = set()
    seen_enrollments_in_file = set()

    processed_rows = []
    valid_count = 0
    invalid_count = 0

    for idx, raw in enumerate(raw_rows, start=2): # 1-indexed, starting after header
        errors = []
        first_name = raw.get("first_name", "")
        last_name = raw.get("last_name", "")
        email = raw.get("email", "").lower()
        enrollment_no = raw.get("enrollment_no", "").upper()
        department = raw.get("department", "Engineering")
        branch = raw.get("branch", "CSE")
        academic_session = raw.get("academic_session", "2024-2028")
        phone_no = raw.get("phone_no", "")
        dob = raw.get("dob", "")
        guardian_name = raw.get("guardian_name", "")
        guardian_phone = raw.get("guardian_phone", "")
        address = raw.get("address", "")

        # Validation 1: First name
        if not first_name:
            errors.append("First name is required")

        # Validation 2: Email format
        if not email:
            errors.append("Institutional email is required")
        elif not EMAIL_REGEX.match(email):
            errors.append(f"Invalid email format: '{email}'")
        elif email in seen_emails_in_file:
            errors.append(f"Duplicate email in upload file: '{email}'")
        elif email in existing_emails:
            errors.append(f"Email already exists in system database: '{email}'")
        else:
            seen_emails_in_file.add(email)

        # Validation 3: Enrollment number
        if enrollment_no:
            if enrollment_no in seen_enrollments_in_file:
                errors.append(f"Duplicate enrollment no in upload file: '{enrollment_no}'")
            elif enrollment_no in existing_enrollments:
                errors.append(f"Enrollment no already exists in system database: '{enrollment_no}'")
            else:
                seen_enrollments_in_file.add(enrollment_no)

        # Validation 4: Semester
        raw_sem = raw.get("semester", "")
        semester = 1
        if raw_sem:
            try:
                semester = int(float(raw_sem))
                if not (1 <= semester <= 8):
                    errors.append(f"Semester must be between 1 and 8 (received '{raw_sem}')")
            except ValueError:
                errors.append(f"Semester must be a numeric digit (received '{raw_sem}')")

        is_valid = len(errors) == 0
        if is_valid:
            valid_count += 1
        else:
            invalid_count += 1

        normalized_data = {
            "first_name": first_name,
            "last_name": last_name or None,
            "email": email,
            "enrollment_no": enrollment_no or None,
            "department": department,
            "branch": branch,
            "semester": semester,
            "academic_session": academic_session,
            "phone_no": phone_no or None,
            "dob": dob or None,
            "guardian_name": guardian_name or None,
            "guardian_phone": guardian_phone or None,
            "address": address or None
        }

        processed_rows.append({
            "row_index": idx,
            "is_valid": is_valid,
            "errors": errors,
            "data": normalized_data
        })

    return {
        "success": True,
        "total_rows": len(raw_rows),
        "valid_rows": valid_count,
        "invalid_rows": invalid_count,
        "rows": processed_rows
    }
