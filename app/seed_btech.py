import asyncio
from datetime import datetime, timedelta
from app.database import (
    users_collection,
    courses_collection,
    notices_collection,
    attendance_collection,
    marks_collection
)
from app.auth import hash_password

async def seed_all():
    print("🚀 Starting B.Tech Enterprise Seeding...")

    # 1. Seed Faculty Members (Teachers)
    teachers_data = [
        {
            "first_name": "Dr. Ramesh",
            "last_name": "Sharma",
            "email": "dr.sharma@gmail.com",
            "password": hash_password("123456"),
            "role": ["teacher"],
            "department": "Computer Science & Engineering",
            "phone_no": "9876543210"
        },
        {
            "first_name": "Prof. Priya",
            "last_name": "Singh",
            "email": "priya.singh@gmail.com",
            "password": hash_password("123456"),
            "role": ["teacher"],
            "department": "Information Technology",
            "phone_no": "9876543211"
        },
        {
            "first_name": "Prof. Vikram",
            "last_name": "Verma",
            "email": "vikram.verma@gmail.com",
            "password": hash_password("123456"),
            "role": ["teacher"],
            "department": "Computer Science & Engineering",
            "phone_no": "9876543212"
        },
        {
            "first_name": "Dr. Ananya",
            "last_name": "Sen",
            "email": "ananya.sen@gmail.com",
            "password": hash_password("123456"),
            "role": ["teacher"],
            "department": "AI & Machine Learning",
            "phone_no": "9876543213"
        },
        {
            "first_name": "Prof. Rajesh",
            "last_name": "Patel",
            "email": "rajesh.patel@gmail.com",
            "password": hash_password("123456"),
            "role": ["teacher"],
            "department": "Computer Science & Engineering",
            "phone_no": "9876543214"
        },
        {
            "first_name": "Prof. Neha",
            "last_name": "Gupta",
            "email": "neha.gupta@gmail.com",
            "password": hash_password("123456"),
            "role": ["teacher"],
            "department": "Software Engineering",
            "phone_no": "9876543215"
        },
        {
            "first_name": "Prof. Amit",
            "last_name": "Kumar",
            "email": "teacher@gmail.com",
            "password": hash_password("123456"),
            "role": ["teacher"],
            "department": "Computer Science & Engineering",
            "phone_no": "9876543216"
        }
    ]

    teacher_map = {}
    for t in teachers_data:
        existing = await users_collection.find_one({"email": t["email"]})
        if existing:
            teacher_map[t["email"]] = str(existing["_id"])
            await users_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {"department": t["department"], "first_name": t["first_name"], "last_name": t["last_name"]}}
            )
        else:
            res = await users_collection.insert_one(t)
            teacher_map[t["email"]] = str(res.inserted_id)

    print(f"✅ Faculty members verified: {len(teacher_map)}")

    # 2. Seed B.Tech Students
    students_data = [
        {"first_name": "Rahul", "last_name": "Sharma", "email": "rahul@gmail.com", "roll_no": "21BCSE100", "dept": "CSE", "year": "4th Year"},
        {"first_name": "Aman", "last_name": "Verma", "email": "aman.verma@gmail.com", "roll_no": "21BCSE101", "dept": "CSE", "year": "4th Year"},
        {"first_name": "Sneha", "last_name": "Patel", "email": "sneha.patel@gmail.com", "roll_no": "21BCSE102", "dept": "CSE", "year": "4th Year"},
        {"first_name": "Rohit", "last_name": "Kumar", "email": "rohit.kumar@gmail.com", "roll_no": "22BIT201", "dept": "IT", "year": "3rd Year"},
        {"first_name": "Pooja", "last_name": "Sharma", "email": "pooja.sharma@gmail.com", "roll_no": "22BAIML101", "dept": "AI-ML", "year": "3rd Year"},
        {"first_name": "Arjun", "last_name": "Singh", "email": "arjun.singh@gmail.com", "roll_no": "21BCSE105", "dept": "CSE", "year": "4th Year"},
        {"first_name": "Riya", "last_name": "Mehta", "email": "riya.mehta@gmail.com", "roll_no": "23BCSE301", "dept": "CSE", "year": "2nd Year"},
        {"first_name": "Kartik", "last_name": "Jain", "email": "kartik.jain@gmail.com", "roll_no": "22BECE101", "dept": "ECE", "year": "3rd Year"},
        {"first_name": "Ananya", "last_name": "Roy", "email": "ananya.roy@gmail.com", "roll_no": "21BIT104", "dept": "IT", "year": "4th Year"},
        {"first_name": "Vikas", "last_name": "Yadav", "email": "vikas.yadav@gmail.com", "roll_no": "22BCSE112", "dept": "CSE", "year": "3rd Year"},
        {"first_name": "Tanvi", "last_name": "Sharma", "email": "tanvi.sharma@gmail.com", "roll_no": "23BAIML202", "dept": "AI-ML", "year": "2nd Year"},
        {"first_name": "Manish", "last_name": "Joshi", "email": "manish.joshi@gmail.com", "roll_no": "24BCSE401", "dept": "CSE", "year": "1st Year"},
        {"first_name": "Deepika", "last_name": "Nair", "email": "deepika.nair@gmail.com", "roll_no": "24BCSE402", "dept": "CSE", "year": "1st Year"},
        {"first_name": "Aditya", "last_name": "Rawat", "email": "aditya.rawat@gmail.com", "roll_no": "23BIT305", "dept": "IT", "year": "2nd Year"},
        {"first_name": "Simran", "last_name": "Kaur", "email": "simran.kaur@gmail.com", "roll_no": "22BCSE118", "dept": "CSE", "year": "3rd Year"},
        {"first_name": "Mohit", "last_name": "Aggarwal", "email": "mohit.aggarwal@gmail.com", "roll_no": "21BCSE120", "dept": "CSE", "year": "4th Year"}
    ]

    student_ids = []
    for s in students_data:
        existing = await users_collection.find_one({"email": s["email"]})
        if existing:
            sid = str(existing["_id"])
            student_ids.append(sid)
            await users_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "department": s["dept"],
                    "roll_no": s["roll_no"],
                    "year": s["year"],
                    "first_name": s["first_name"],
                    "last_name": s["last_name"]
                }}
            )
        else:
            doc = {
                "first_name": s["first_name"],
                "last_name": s["last_name"],
                "email": s["email"],
                "password": hash_password("123456"),
                "role": ["student"],
                "department": s["dept"],
                "roll_no": s["roll_no"],
                "year": s["year"],
                "phone_no": "9998887776"
            }
            res = await users_collection.insert_one(doc)
            student_ids.append(str(res.inserted_id))

    print(f"✅ B.Tech Students seeded: {len(student_ids)}")

    # 3. Seed Complete B.Tech Curriculum Courses
    btech_courses = [
        {
            "course_code": "CS201",
            "course_name": "Data Structures & Algorithms",
            "credits": 4,
            "department": "Computer Science & Engineering",
            "teacher_email": "dr.sharma@gmail.com",
            "description": "Arrays, Linked Lists, Stacks, Queues, Binary Trees, Graphs, Sorting and Dynamic Programming."
        },
        {
            "course_code": "CS202",
            "course_name": "Object-Oriented Programming (Java/C++)",
            "credits": 4,
            "department": "Computer Science & Engineering",
            "teacher_email": "neha.gupta@gmail.com",
            "description": "Classes, Inheritance, Polymorphism, Abstraction, Multithreading, and Design Patterns."
        },
        {
            "course_code": "CS301",
            "course_name": "Operating Systems & Kernel Internals",
            "credits": 4,
            "department": "Computer Science & Engineering",
            "teacher_email": "rajesh.patel@gmail.com",
            "description": "Process Synchronization, CPU Scheduling, Deadlocks, Virtual Memory, and Linux Kernel Architecture."
        },
        {
            "course_code": "CS302",
            "course_name": "Database Management Systems (DBMS)",
            "credits": 4,
            "department": "Information Technology",
            "teacher_email": "priya.singh@gmail.com",
            "description": "Relational Algebra, SQL, Normalization, ACID Transactions, Concurrency Control, and NoSQL."
        },
        {
            "course_code": "CS303",
            "course_name": "Computer Networks & Protocols",
            "credits": 4,
            "department": "Computer Science & Engineering",
            "teacher_email": "vikram.verma@gmail.com",
            "description": "OSI 7-Layer Model, TCP/IP, IP Routing, Congestion Control, DNS, HTTP/3, and Network Security."
        },
        {
            "course_code": "CS304",
            "course_name": "Software Engineering & Agile Methodologies",
            "credits": 3,
            "department": "Software Engineering",
            "teacher_email": "neha.gupta@gmail.com",
            "description": "SDLC, Scrum, UML Modeling, Automated Testing, CI/CD pipelines, and Software Quality Assurance."
        },
        {
            "course_code": "CS305",
            "course_name": "Web Technologies & Full-Stack Development",
            "credits": 4,
            "department": "Computer Science & Engineering",
            "teacher_email": "teacher@gmail.com",
            "description": "Modern JavaScript (ES6+), React 19, FastAPI REST APIs, Tailwind CSS, and MongoDB integration."
        },
        {
            "course_code": "AI301",
            "course_name": "Artificial Intelligence & Expert Systems",
            "credits": 4,
            "department": "AI & Machine Learning",
            "teacher_email": "ananya.sen@gmail.com",
            "description": "Heuristic Search, A* Algorithm, Game Playing, Knowledge Representation, and Natural Language Processing."
        },
        {
            "course_code": "AI302",
            "course_name": "Machine Learning & Neural Networks",
            "credits": 4,
            "department": "AI & Machine Learning",
            "teacher_email": "ananya.sen@gmail.com",
            "description": "Supervised Learning, Regression, Classification, Support Vector Machines, CNNs, and Deep Learning."
        },
        {
            "course_code": "CS401",
            "course_name": "Cloud Computing & DevOps Architecture",
            "credits": 4,
            "department": "Computer Science & Engineering",
            "teacher_email": "rajesh.patel@gmail.com",
            "description": "AWS/GCP Virtualization, Docker Containers, Kubernetes Orchestration, and Microservices architecture."
        },
        {
            "course_code": "CS402",
            "course_name": "Information & Cyber Security",
            "credits": 3,
            "department": "Computer Science & Engineering",
            "teacher_email": "vikram.verma@gmail.com",
            "description": "Symmetric/Asymmetric Cryptography, RSA, AES, Digital Signatures, Firewalls, and Ethical Hacking."
        },
        {
            "course_code": "CS403",
            "course_name": "Internet of Things (IoT) & Embedded Systems",
            "credits": 3,
            "department": "Electronics & Communication",
            "teacher_email": "vikram.verma@gmail.com",
            "description": "Microcontrollers (Arduino/ESP32), Sensor Interfacing, MQTT Protocol, and Edge Computing."
        },
        {
            "course_code": "CS404",
            "course_name": "Big Data Analytics & Distributed Systems",
            "credits": 4,
            "department": "Information Technology",
            "teacher_email": "priya.singh@gmail.com",
            "description": "Apache Hadoop, MapReduce, Apache Spark, Data Streaming, and Real-time Analytics Pipelines."
        },
        {
            "course_code": "CS101",
            "course_name": "Problem Solving & C Programming",
            "credits": 4,
            "department": "Computer Science & Engineering",
            "teacher_email": "teacher@gmail.com",
            "description": "Algorithmic thinking, Flowcharts, C Syntax, Pointers, Memory Allocation, and File Handling."
        },
        {
            "course_code": "MA101",
            "course_name": "Engineering Mathematics & Discrete Calculus",
            "credits": 4,
            "department": "Basic Sciences & Humanities",
            "teacher_email": "dr.sharma@gmail.com",
            "description": "Linear Algebra, Eigenvalues, Multivariate Calculus, Graph Theory, and Combinatorics."
        }
    ]

    for c in btech_courses:
        tid = teacher_map.get(c["teacher_email"], list(teacher_map.values())[0])
        # Enroll subset of students
        enrolled_students = student_ids[:10]  # First 10 students enrolled in each course

        existing_course = await courses_collection.find_one({"course_code": c["course_code"]})
        if existing_course:
            await courses_collection.update_one(
                {"_id": existing_course["_id"]},
                {"$set": {
                    "course_name": c["course_name"],
                    "name": c["course_name"],
                    "credits": c["credits"],
                    "department": c["department"],
                    "teacher_id": tid,
                    "student_ids": list(set(existing_course.get("student_ids", []) + enrolled_students)),
                    "description": c["description"]
                }}
            )
        else:
            doc = {
                "course_code": c["course_code"],
                "code": c["course_code"],
                "course_name": c["course_name"],
                "name": c["course_name"],
                "credits": c["credits"],
                "department": c["department"],
                "teacher_id": tid,
                "student_ids": enrolled_students,
                "description": c["description"],
                "created_at": datetime.utcnow()
            }
            await courses_collection.insert_one(doc)

    print(f"✅ B.Tech Courses seeded & updated: {len(btech_courses)}")

    # 4. Seed University Official Notices
    notices_data = [
        {
            "title": "Mid-Term Examination Schedule - Autumn 2026 for B.Tech All Branches",
            "content": "The Controller of Examinations announces that Mid-Term Examinations for B.Tech 2nd, 3rd, and 4th-year students will commence from 24th October 2026. Detailed seating arrangement and hall tickets will be issued via the student portal next Monday. All students must bring physical ID cards and maintain 75% attendance criteria.",
            "category": "Exam",
            "priority": "Urgent",
            "target_audience": "Students",
            "department": "Office of Examination Controller",
            "author_name": "Prof. R. K. Mukherjee",
            "author_role": "Controller of Examinations",
            "is_pinned": True,
            "created_at": datetime.utcnow() - timedelta(hours=2)
        },
        {
            "title": "75% Mandatory Attendance Compliance Warning for Semester End Exams",
            "content": "As per University Academic Regulations, students having aggregate attendance below 75% in any registered subject will NOT be permitted to sit for the final semester examinations. Students with shortage between 65%-75% on certified medical grounds must submit verified hospital certificates to their respective HoD before 18th October.",
            "category": "Academic",
            "priority": "High",
            "target_audience": "Students",
            "department": "Dean of Academic Affairs",
            "author_name": "Dr. Ananya Sen",
            "author_role": "Dean Academic Affairs",
            "is_pinned": True,
            "created_at": datetime.utcnow() - timedelta(hours=6)
        },
        {
            "title": "Annual National Hackathon 'RIETHack 2026' Registrations Open",
            "content": "Rajasthan Institute of Engineering & Technology (RIET), Jaipur is proud to announce 'RIETHack 2026', a 36-hour national flagship hackathon on Generative AI, Web3, and Smart Campus Solutions with prize pool of ₹5,00,000. Registration is open for teams of 3-4 members across all B.Tech branches. Winners will also receive fast-tracked summer internship interviews with sponsor tech companies.",
            "category": "Event",
            "priority": "Normal",
            "target_audience": "All",
            "department": "Department of CSE & Student Innovation Cell",
            "author_name": "Dr. Ramesh Sharma",
            "author_role": "HoD CSE & Faculty Advisor",
            "is_pinned": False,
            "created_at": datetime.utcnow() - timedelta(days=1)
        },
        {
            "title": "Campus Placement Drive: Top Tier Tech Companies Visiting Next Month",
            "content": "The Training & Placement Cell invites all final-year and pre-final year B.Tech students (CSE, IT, AI-ML, ECE) to register for upcoming recruitment drives by Microsoft, Google Cloud, Infosys, and TCS. Orientation session on technical interview rounds and coding assessments will be conducted in the University Auditorium this Friday at 3:00 PM.",
            "category": "Placement",
            "priority": "High",
            "target_audience": "Students",
            "department": "Training & Placement Cell",
            "author_name": "Prof. Vikram Verma",
            "author_role": "Head - Training & Placement",
            "is_pinned": False,
            "created_at": datetime.utcnow() - timedelta(days=2)
        },
        {
            "title": "Autumn Festival & National Holiday: Campus Closed on 15th October",
            "content": "The university campus, administrative offices, and central library will remain closed on Thursday, 15th October on account of the state public holiday. Regular lectures and lab sessions will resume on Friday as per the published academic timetable.",
            "category": "Holiday",
            "priority": "Normal",
            "target_audience": "All",
            "department": "Office of the Registrar",
            "author_name": "Office of the Registrar",
            "author_role": "University Administration",
            "is_pinned": False,
            "created_at": datetime.utcnow() - timedelta(days=3)
        },
        {
            "title": "B.Tech Final Year Major Project Synopsis Submission Deadline",
            "content": "All final year B.Tech students are hereby notified that the submission of Major Project Synopsis and guide allotment approval forms must be completed by 20th October. Synopses must include problem statement, architecture diagrams, proposed tech stack, and milestone deliverables.",
            "category": "Academic",
            "priority": "Normal",
            "target_audience": "Students",
            "department": "Department of Computer Science & Engineering",
            "author_name": "Dr. Ramesh Sharma",
            "author_role": "HoD Computer Science",
            "is_pinned": False,
            "created_at": datetime.utcnow() - timedelta(days=4)
        }
    ]

    # Clear old notices and insert fresh university notices
    await notices_collection.delete_many({})
    await notices_collection.insert_many(notices_data)
    print(f"✅ University Notices seeded: {len(notices_data)}")

    print("🎉 All B.Tech Curriculum, Faculty, Students, and Official Notices successfully populated!")

if __name__ == "__main__":
    asyncio.run(seed_all())
