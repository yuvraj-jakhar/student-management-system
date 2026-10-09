import pytest
import pytest_asyncio
import io
import uuid
import httpx
from app.main import app
from app.services.student_import import generate_template

@pytest_asyncio.fixture
async def client():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def admin_token(client):
    res = await client.post("/token", data={"username": "admin@gmail.com", "password": "123456"})
    if res.status_code != 200:
        res = await client.post("/token", data={"username": "admin@gmail.com", "password": "password"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["access_token"]

@pytest_asyncio.fixture
async def librarian_token(client):
    res = await client.post("/token", data={"username": "librarian@gmail.com", "password": "123456"})
    assert res.status_code == 200, f"Librarian login failed: {res.text}"
    return res.json()["access_token"]

@pytest_asyncio.fixture
async def student_token(client):
    res = await client.post("/token", data={"username": "aman.verma@gmail.com", "password": "password"})
    if res.status_code != 200:
        res = await client.post("/token", data={"username": "aman.verma@gmail.com", "password": "123456"})
    if res.status_code != 200:
        res = await client.post("/token", data={"username": "rahul@gmail.com", "password": "password"})
    if res.status_code != 200:
        res = await client.post("/token", data={"username": "rahul@gmail.com", "password": "123456"})
    assert res.status_code == 200, f"Student login failed: {res.text}"
    return res.json()["access_token"]

@pytest_asyncio.fixture
async def teacher_token(client):
    res = await client.post("/token", data={"username": "dr.sharma@gmail.com", "password": "password"})
    if res.status_code != 200:
        res = await client.post("/token", data={"username": "dr.sharma@gmail.com", "password": "123456"})
    if res.status_code != 200:
        res = await client.post("/token", data={"username": "teacher@gmail.com", "password": "password"})
    if res.status_code != 200:
        res = await client.post("/token", data={"username": "teacher@gmail.com", "password": "123456"})
    assert res.status_code == 200, f"Teacher login failed: {res.text}"
    return res.json()["access_token"]


# ==========================================
# 1. AUTHENTICATION & ROLE TESTS
# ==========================================

@pytest.mark.asyncio
async def test_login_success(admin_token, librarian_token, student_token, teacher_token):
    assert admin_token is not None
    assert librarian_token is not None
    assert student_token is not None
    assert teacher_token is not None

@pytest.mark.asyncio
async def test_unauthorized_request(client):
    res = await client.get("/admin/users")
    assert res.status_code in [401, 403]

@pytest.mark.asyncio
async def test_student_forbidden_admin_access(client, student_token):
    res = await client.get("/admin/users", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403


# ==========================================
# 2. STUDENT BULK IMPORT & TEMPLATES
# ==========================================

@pytest.mark.asyncio
async def test_download_import_templates(client, admin_token):
    # CSV template
    res_csv = await client.get("/admin/students/import-template?format=csv", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "first_name" in res_csv.text

    # Excel template
    res_xlsx = await client.get("/admin/students/import-template?format=xlsx", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_xlsx.status_code == 200
    assert "spreadsheetml" in res_xlsx.headers["content-type"]

@pytest.mark.asyncio
async def test_import_preview(client, admin_token):
    csv_bytes, _, filename = generate_template("csv")
    files = {"file": (filename, io.BytesIO(csv_bytes), "text/csv")}
    res = await client.post("/admin/students/import-preview", headers={"Authorization": f"Bearer {admin_token}"}, files=files)
    assert res.status_code == 200
    data = res.json()
    assert "total_rows" in data
    assert data["total_rows"] >= 1


# ==========================================
# 3. LIBRARY MANAGEMENT MODULE
# ==========================================

@pytest.mark.asyncio
async def test_get_books_catalogue(client, student_token):
    res = await client.get("/library/books", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "books" in data
    assert len(data["books"]) > 0

@pytest.mark.asyncio
async def test_library_stats(client, student_token):
    res = await client.get("/library/stats", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    stats = res.json()
    assert "total_titles" in stats
    assert stats["total_titles"] >= 5

@pytest.mark.asyncio
async def test_librarian_circulation_access(client, librarian_token):
    res = await client.get("/library/issues", headers={"Authorization": f"Bearer {librarian_token}"})
    assert res.status_code == 200

@pytest.mark.asyncio
async def test_student_cannot_access_librarian_circulation(client, student_token):
    res = await client.get("/library/issues", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403


# ==========================================
# 4. CAMPUS EVENTS MODULE
# ==========================================

@pytest.mark.asyncio
async def test_browse_events(client, student_token):
    res = await client.get("/events", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    data = res.json()
    assert "events" in data
    assert len(data["events"]) >= 1

@pytest.mark.asyncio
async def test_student_event_registration_flow(client, student_token):
    # 1. Fetch available events
    res = await client.get("/events", headers={"Authorization": f"Bearer {student_token}"})
    events = res.json()["events"]
    assert len(events) > 0
    test_event = events[0]
    event_id = test_event["_id"]

    # 2. Register for event
    reg_res = await client.post(f"/events/{event_id}/register", headers={"Authorization": f"Bearer {student_token}"})
    assert reg_res.status_code in [200, 400]

    # 3. View my registrations
    my_regs = await client.get("/events/my-registrations", headers={"Authorization": f"Bearer {student_token}"})
    assert my_regs.status_code == 200

    # 4. Cancel registration
    cancel_res = await client.post(f"/events/{event_id}/cancel", headers={"Authorization": f"Bearer {student_token}"})
    assert cancel_res.status_code == 200


# ==========================================
# 5. COURSE PROPOSALS & FACULTY WORKFLOW
# ==========================================

@pytest.mark.asyncio
async def test_teacher_course_proposal_workflow(client, teacher_token, admin_token):
    unique_code = f"TEST{uuid.uuid4().hex[:4].upper()}"
    proposal_data = {
        "name": f"Advanced Neural Systems {unique_code}",
        "code": unique_code,
        "department": "Computer Science & Engineering",
        "semester": 4,
        "credits": 4,
        "description": "Exploration of transformers, diffusion models, and LLM architectures.",
        "syllabus": "Unit 1: Attention, Unit 2: Scaling laws"
    }

    # 1. Teacher submits proposal
    prop_res = await client.post("/teacher/courses/propose", headers={"Authorization": f"Bearer {teacher_token}"}, json=proposal_data)
    assert prop_res.status_code == 200
    proposal_id = prop_res.json()["id"]

    # 2. Teacher views proposals
    my_props = await client.get("/teacher/courses/proposals", headers={"Authorization": f"Bearer {teacher_token}"})
    assert my_props.status_code == 200
    assert any(p["_id"] == proposal_id for p in my_props.json())

    # 3. Admin reviews and approves proposal
    rev_res = await client.put(f"/admin/courses/proposals/{proposal_id}/review", headers={"Authorization": f"Bearer {admin_token}"}, json={"action": "approved", "remarks": "Approved by Academic Dean"})
    assert rev_res.status_code == 200
    assert rev_res.json()["course_id"] is not None


# ==========================================
# 6. UNIFIED NOTIFICATIONS TESTS
# ==========================================

@pytest.mark.asyncio
async def test_notifications_lifecycle(client, student_token):
    # Fetch notifications
    res = await client.get("/notifications", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # Fetch unread count
    cnt = await client.get("/notifications/unread-count", headers={"Authorization": f"Bearer {student_token}"})
    assert cnt.status_code == 200
    assert "unread_count" in cnt.json()

    # Mark all read
    mark_res = await client.put("/notifications/mark-all-read", headers={"Authorization": f"Bearer {student_token}"})
    assert mark_res.status_code == 200
