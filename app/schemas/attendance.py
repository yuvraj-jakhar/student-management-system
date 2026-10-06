from pydantic import BaseModel


class QRAttendance(BaseModel):
    course_id: str


class AttendanceCreate(BaseModel):
    student_id: str
    course_id: str
    status: str = "Present"


class AttendanceResponse(BaseModel):
    student_id: str
    course_id: str
    status: str
    
class ScanQR(BaseModel):
    qr_id: str