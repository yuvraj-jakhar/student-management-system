import asyncio
from datetime import datetime, timedelta
from app.database import (
    users_collection,
    library_books_collection,
    library_issues_collection,
    events_collection,
    notifications_collection
)
from app.auth import hash_password

async def seed_erp_modules():
    print("Seeding ERP Modules (Librarian, Library Books, Events, Notifications)...")

    # 1. Librarian Account
    librarian = await users_collection.find_one({"email": "librarian@gmail.com"})
    if not librarian:
        await users_collection.insert_one({
            "first_name": "Dr. Anita",
            "last_name": "Rao",
            "email": "librarian@gmail.com",
            "password": hash_password("123456"),
            "role": ["librarian"],
            "phone_no": "+919876543299",
            "designation": "Chief University Librarian",
            "department": "Central Library",
            "is_active": True,
            "created_at": datetime.utcnow()
        })
        print("Librarian account created: librarian@gmail.com / 123456")
    else:
        print("Librarian account already exists.")

    # 2. Library Books
    sample_books = [
        {
            "title": "Introduction to Algorithms (CLRS)",
            "author": "Thomas H. Cormen, Charles E. Leiserson",
            "isbn": "9780262033848",
            "category": "Computer Science",
            "publisher": "MIT Press",
            "edition": "3rd Edition",
            "total_copies": 12,
            "available_copies": 11,
            "shelf_location": "Rack CS-04",
            "description": "Comprehensive reference textbook on algorithms and data structures.",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "title": "Database System Concepts",
            "author": "Abraham Silberschatz, Henry F. Korth",
            "isbn": "9780073523323",
            "category": "Computer Science",
            "publisher": "McGraw-Hill",
            "edition": "7th Edition",
            "total_copies": 10,
            "available_copies": 10,
            "shelf_location": "Rack CS-02",
            "description": "Foundational text covering relational databases, transactions, and SQL.",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "title": "Operating System Concepts",
            "author": "Abraham Silberschatz, Peter B. Galvin",
            "isbn": "9781119800361",
            "category": "Computer Science",
            "publisher": "Wiley",
            "edition": "10th Edition",
            "total_copies": 8,
            "available_copies": 8,
            "shelf_location": "Rack CS-03",
            "description": "Core concepts of process management, virtualization, and concurrency.",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "title": "Computer Networking: A Top-Down Approach",
            "author": "James Kurose, Keith Ross",
            "isbn": "9780133594140",
            "category": "Computer Science",
            "publisher": "Pearson",
            "edition": "7th Edition",
            "total_copies": 10,
            "available_copies": 10,
            "shelf_location": "Rack CS-06",
            "description": "Networking principles layered from application down to physical media.",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "title": "Artificial Intelligence: A Modern Approach",
            "author": "Stuart Russell, Peter Norvig",
            "isbn": "9780134610993",
            "category": "Artificial Intelligence",
            "publisher": "Pearson",
            "edition": "4th Edition",
            "total_copies": 6,
            "available_copies": 6,
            "shelf_location": "Rack AI-01",
            "description": "Standard university text for artificial intelligence, search, and ML foundations.",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "title": "Digital Design and Computer Architecture",
            "author": "David Harris, Sarah Harris",
            "isbn": "9780123944245",
            "category": "Electronics & Hardware",
            "publisher": "Morgan Kaufmann",
            "edition": "2nd Edition",
            "total_copies": 8,
            "available_copies": 8,
            "shelf_location": "Rack EC-01",
            "description": "Digital logic, CPU datapath, and assembly language programming.",
            "is_active": True,
            "created_at": datetime.utcnow()
        },
        {
            "title": "Clean Code: A Handbook of Agile Software Craftsmanship",
            "author": "Robert C. Martin",
            "isbn": "9780132350884",
            "category": "Software Engineering",
            "publisher": "Prentice Hall",
            "edition": "1st Edition",
            "total_copies": 5,
            "available_copies": 5,
            "shelf_location": "Rack SE-02",
            "description": "Best practices for writing readable, maintainable, production software.",
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    ]

    for b in sample_books:
        existing = await library_books_collection.find_one({"isbn": b["isbn"]})
        if not existing:
            await library_books_collection.insert_one(b)
    print("Library book catalogue seeded successfully.")

    # 3. Campus Events
    now = datetime.utcnow()
    sample_events = [
        {
            "title": "Smart India Hackathon (SIH 2026) Campus Qualifier",
            "description": "Annual 36-hour non-stop collegiate hackathon solving real-world challenges in AI, IoT, and Cloud Computing with cash prizes up to ₹1,00,000.",
            "category": "Hackathon",
            "venue": "Campus Innovation Center, Block-C",
            "start_date": now + timedelta(days=7),
            "end_date": now + timedelta(days=9),
            "registration_deadline": now + timedelta(days=5),
            "capacity": 80,
            "registered_count": 18,
            "organizer": "Department of Computer Science & Engineering",
            "status": "published",
            "created_at": now
        },
        {
            "title": "National Seminar on Generative AI & Quantum Computing",
            "description": "Keynote addresses and interactive workshop sessions by leading scientists from DRDO and Google Research.",
            "category": "Seminar",
            "venue": "Dr. APJ Abdul Kalam Auditorium",
            "start_date": now + timedelta(days=12),
            "end_date": now + timedelta(days=12, hours=6),
            "registration_deadline": now + timedelta(days=10),
            "capacity": 250,
            "registered_count": 64,
            "organizer": "Dean Academics & Research",
            "status": "published",
            "created_at": now
        },
        {
            "title": "Annual Inter-Departmental Sports Meet 2026",
            "description": "Cricket, Football, Badminton, Chess, and Athletics championships. Register your team and represent your branch.",
            "category": "Sports",
            "venue": "University Sports Complex & Grounds",
            "start_date": now + timedelta(days=20),
            "end_date": now + timedelta(days=23),
            "registration_deadline": now + timedelta(days=16),
            "capacity": 300,
            "registered_count": 42,
            "organizer": "Physical Education & Athletics Council",
            "status": "published",
            "created_at": now
        },
        {
            "title": "Campus Placement Drive: Top Tier Tech Companies",
            "description": "On-campus recruitment and pre-placement talks for final and pre-final year B.Tech students. Mandatory formal attire.",
            "category": "Placement",
            "venue": "Training & Placement Cell, Block-A",
            "start_date": now + timedelta(days=15),
            "end_date": now + timedelta(days=16),
            "registration_deadline": now + timedelta(days=11),
            "capacity": 150,
            "registered_count": 89,
            "organizer": "Training & Placement Cell",
            "status": "published",
            "created_at": now
        }
    ]

    for ev in sample_events:
        existing = await events_collection.find_one({"title": ev["title"]})
        if not existing:
            await events_collection.insert_one(ev)
    print("Campus events seeded successfully.")

    # 4. Seed sample notifications
    sample_notifications = [
        {
            "target_role": "all",
            "title": "Campus ERP 2.0 Upgrade Deployed",
            "message": "The University Enterprise ERP has been upgraded with automated Library circulation, Events module, and Student bulk registration.",
            "category": "alert",
            "created_at": now,
            "is_read": False
        },
        {
            "target_role": "student",
            "title": "Registrations Open for SIH 2026 Campus Qualifier",
            "message": "Register your team for the 36-hour hackathon before the registration deadline.",
            "category": "event",
            "link": "/events",
            "created_at": now - timedelta(hours=2),
            "is_read": False
        },
        {
            "target_role": "student",
            "title": "Central Library Book Issue Reminder",
            "message": "Please ensure to return or renew any issued library books within the 14-day circulation period to avoid overdue fines.",
            "category": "library",
            "link": "/library",
            "created_at": now - timedelta(hours=5),
            "is_read": False
        }
    ]

    for n in sample_notifications:
        existing = await notifications_collection.find_one({"title": n["title"]})
        if not existing:
            await notifications_collection.insert_one(n)
    print("Notifications seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_erp_modules())
