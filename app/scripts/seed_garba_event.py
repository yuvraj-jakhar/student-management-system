import os
import pymongo
from datetime import datetime, timezone
from PIL import Image, ImageDraw, ImageFont

# 1. Generate Beautiful Festive Banner Image
def create_garba_banner(output_path: str):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    width, height = 1200, 630
    img = Image.new("RGB", (width, height), color=(30, 8, 45))
    draw = ImageDraw.Draw(img)

    # Festive Radial/Linear Glow
    for y in range(height):
        ratio = y / height
        r = int(60 * (1 - ratio) + 120 * ratio * 0.8)
        g = int(10 * (1 - ratio) + 20 * ratio)
        b = int(70 * (1 - ratio) + 60 * ratio * 0.9)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Decorative Festive Borders
    draw.rectangle([20, 20, width - 20, height - 20], outline=(255, 215, 0), width=4)
    draw.rectangle([30, 30, width - 30, height - 30], outline=(255, 165, 0), width=2)

    # Decorative Diya / Mandala Sparkles
    for x in range(60, width - 50, 80):
        draw.ellipse([x - 6, 40, x + 6, 52], fill=(255, 215, 0))
        draw.ellipse([x - 6, height - 52, x + 6, height - 40], fill=(255, 215, 0))

    try:
        font_sub = ImageFont.truetype("arial.ttf", 26)
        font_h1 = ImageFont.truetype("arialbd.ttf", 58)
        font_h2 = ImageFont.truetype("arialbd.ttf", 38)
        font_meta = ImageFont.truetype("arial.ttf", 24)
        font_badges = ImageFont.truetype("arialbd.ttf", 22)
    except Exception:
        font_sub = ImageFont.load_default()
        font_h1 = font_sub
        font_h2 = font_sub
        font_meta = font_sub
        font_badges = font_sub

    # Header Institution
    draw.text((width // 2, 80), "RAJASTHAN INSTITUTE OF ENGINEERING & TECHNOLOGY, JAIPUR", font=font_sub, fill=(255, 225, 130), anchor="mm")
    draw.text((width // 2, 120), "Presented by Sapiens Group of Institutes", font=font_meta, fill=(240, 200, 255), anchor="mm")

    # Main Title Badge
    draw.rounded_rectangle([width // 2 - 400, 160, width // 2 + 400, 260], radius=20, fill=(180, 20, 70), outline=(255, 215, 0), width=3)
    draw.text((width // 2, 210), "JALSA MAHOTSAV 2026", font=font_h1, fill=(255, 255, 255), anchor="mm")

    # Subtitle
    draw.text((width // 2, 290), "GARBA & DANDIYA RAAS NIGHT", font=font_h2, fill=(255, 215, 0), anchor="mm")

    # Features Banner
    features = "★ Non-Stop Live Music & DJ ★ Celebrity Night ★ Best Dressed & Dance Contests ★ Food Stalls ★"
    draw.text((width // 2, 345), features, font=font_badges, fill=(255, 240, 180), anchor="mm")

    # Event Details Cards
    card1_box = [100, 390, 560, 520]
    draw.rounded_rectangle(card1_box, radius=15, fill=(45, 15, 65), outline=(255, 215, 0), width=2)
    draw.text((120, 415), "📅 DATE: Friday, 16th October 2026", font=font_meta, fill=(255, 255, 255))
    draw.text((120, 455), "⏰ TIME: 6:00 PM Onwards", font=font_meta, fill=(255, 215, 0))
    draw.text((120, 485), "👗 DRESS CODE: Traditional Festive Attire", font=font_meta, fill=(220, 220, 255))

    card2_box = [640, 390, 1100, 520]
    draw.rounded_rectangle(card2_box, radius=15, fill=(45, 15, 65), outline=(255, 215, 0), width=2)
    draw.text((660, 415), "📍 VENUE: RIET College Campus Ground", font=font_meta, fill=(255, 255, 255))
    draw.text((660, 445), "   Ajmer Road, Bhankrota, Jaipur", font=font_meta, fill=(200, 200, 230))
    draw.text((660, 480), "📞 PASSES: +91-9257111215 / 9257111214", font=font_meta, fill=(255, 215, 0))

    # Footer note
    draw.text((width // 2, 570), "Instagram: @riet_official • Register entry passes via Student ERP Portal", font=font_sub, fill=(255, 220, 100), anchor="mm")

    img.save(output_path, "PNG")
    print(f"✓ Festival banner created at: {output_path}")


def seed_database():
    client = pymongo.MongoClient("mongodb://localhost:27017")
    db = client["student_management"]
    events_col = db["events"]
    notices_col = db["notices"]
    notifications_col = db["notifications"]
    audit_col = db["audit_logs"]

    # 1. Insert/Update Event
    start_dt = datetime(2026, 10, 16, 18, 0, 0)
    end_dt = datetime(2026, 10, 16, 23, 30, 0)
    deadline_dt = datetime(2026, 10, 16, 17, 0, 0)

    event_filter = {"title": {"$regex": "Jalsa Mahotsav.*Garba", "$options": "i"}}
    event_doc = {
        "title": "Jalsa Mahotsav 2026 - गरबा (Garba & Dandiya Raas Night)",
        "description": (
            "Rajasthan Institute of Engineering & Technology (RIET), Jaipur in association with Sapiens Group of Institutes "
            "proudly presents 'Jalsa Mahotsav 2026 - गरबा'. Get ready for an electrifying festive evening featuring non-stop live music, "
            "traditional Garba & Dandiya Raas, celebrity guest night, exciting dance & best traditional attire competitions with prizes, "
            "fun carnival games, and delicious festive food stalls. Students & staff are encouraged to wear traditional festive attire "
            "(Chaniya Choli / Kurta Pyjama). Passes available on the ERP portal or contact +91-9257111215 / +91-9257111214."
        ),
        "category": "Cultural",
        "venue": "RIET College Campus Ground, Ajmer Road, Bhankrota, Jaipur",
        "start_date": start_dt,
        "end_date": end_dt,
        "registration_deadline": deadline_dt,
        "capacity": 1500,
        "registered_count": 218,
        "is_registration_open": True,
        "is_external": False,
        "source": "instagram",
        "source_badge": "Official @riet_official Announcement",
        "source_url": "https://www.instagram.com/p/riet_jalsa_garba_2026/",
        "organizer": "Cultural Committee & Student Council, RIET Jaipur",
        "banner_url": "/uploads/riet_jalsa_garba_2026.png",
        "is_date_unverified": False,
        "is_venue_unverified": False,
        "review_status": "approved",
        "status": "upcoming",
        "contact_numbers": ["+91-9257111215", "+91-9257111214"],
        "presented_by": "Sapiens Group of Institutes",
        "created_at": datetime.utcnow(),
        "last_checked_at": datetime.utcnow()
    }

    events_col.delete_many(event_filter)
    res_ev = events_col.insert_one(event_doc)
    print(f"✓ Garba Event seeded successfully! ID: {res_ev.inserted_id}")

    # 2. Insert/Update Pinned Notice
    notice_filter = {"title": {"$regex": "Jalsa Mahotsav.*Garba", "$options": "i"}}
    notice_doc = {
        "title": "RIET Jalsa Mahotsav 2026 - Garba & Dandiya Night on 16th October",
        "content": (
            "The Cultural Committee and Student Activity Council of Rajasthan Institute of Engineering & Technology (RIET), Jaipur "
            "are thrilled to announce 'Jalsa Mahotsav 2026 - गरबा' presented in collaboration with Sapiens Group of Institutes "
            "on Friday, 16th October 2026 from 6:00 PM onwards at the RIET Main Campus Ground. Highlights include Non-stop Live DJ & Folk Band, "
            "Celebrity Night, Dandiya Raas, Best Dressed & Best Dancer Contests, Food & Games Stalls. Free Entry Passes for RIET students "
            "can be claimed via the Campus Events tab in the Student ERP Portal. For queries & guest passes, contact: +91-9257111215 / +91-9257111214."
        ),
        "category": "Event",
        "priority": "Urgent",
        "target_audience": "All",
        "department": "Cultural Committee & Student Council",
        "author_name": "Dr. Ananya Sen",
        "author_role": "Dean Student Welfare & Cultural Head",
        "is_pinned": True,
        "created_at": datetime.utcnow()
    }
    notices_col.delete_many(notice_filter)
    res_not = notices_col.insert_one(notice_doc)
    print(f"✓ Pinned Notice seeded successfully! ID: {res_not.inserted_id}")

    # 3. Broadcast Notification to all Users
    notif_doc = {
        "title": "🎉 Jalsa Mahotsav 2026 - Garba Night on 16th Oct!",
        "message": (
            "RIET Official Instagram announced Jalsa Mahotsav 2026 - गरबा on Friday 16th October from 6:00 PM onwards. "
            "Claim your student pass now from the Events tab!"
        ),
        "category": "Event",
        "target_role": "all",
        "user_id": None,
        "link": "/events",
        "is_read": False,
        "created_at": datetime.utcnow()
    }
    notifications_col.insert_one(notif_doc)
    print("✓ Broadcast notification sent to all students and staff.")

    # 4. Audit Log
    audit_col.insert_one({
        "user_id": "system",
        "user_email": "admin@college.com",
        "action": "INSTAGRAM_EVENT_SYNC_GARBA",
        "resource_type": "events",
        "resource_id": str(res_ev.inserted_id),
        "details": {
            "title": "Jalsa Mahotsav 2026 - Garba & Dandiya Night",
            "date": "2026-10-16 18:00",
            "source": "@riet_official"
        },
        "timestamp": datetime.utcnow()
    })
    print("✓ Audit log recorded.")


if __name__ == "__main__":
    banner_file = os.path.abspath(os.path.join("uploads", "riet_jalsa_garba_2026.png"))
    create_garba_banner(banner_file)
    seed_database()
    print("\n🎉 ALL GARBA EVENT UPDATES APPLIED SUCCESSFULLY!")
