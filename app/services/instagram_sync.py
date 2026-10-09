import os
import re
from datetime import datetime
from typing import Optional
import httpx
from app.database import events_collection, log_audit_event
from app.core.logger import logger


def extract_instagram_shortcode(url: str) -> Optional[str]:
    """
    Extracts the unique post shortcode from an Instagram URL.
    Examples:
      https://www.instagram.com/p/C4bZ_12345/ -> C4bZ_12345
      https://www.instagram.com/reel/C8XYZabc/ -> C8XYZabc
    """
    if not url:
        return None
    match = re.search(r'instagram\.com/(?:p|reel)/([A-Za-z0-9_-]+)', url)
    return match.group(1) if match else None


async def import_manual_instagram_post(
    post_url: str,
    title: str,
    description: str,
    category: str = "Campus Life",
    banner_url: Optional[str] = None,
    venue: Optional[str] = None,
    start_date: Optional[datetime] = None,
    organizer: str = "RIET Official (@riet_official)",
    is_date_unverified: bool = True,
    is_venue_unverified: bool = True,
    admin_email: str = "admin@gmail.com"
) -> dict:
    """
    Imports a verified Instagram post submitted by an authorized administrator.
    Enforces duplicate detection using post URL and shortcode.
    """
    clean_url = post_url.strip()
    shortcode = extract_instagram_shortcode(clean_url)

    source_id = f"ig_{shortcode}" if shortcode else f"ig_manual_{abs(hash(clean_url))}"

    # Duplicate detection check
    existing = await events_collection.find_one({
        "$or": [
            {"source_url": clean_url},
            {"source_id": source_id}
        ]
    })

    if existing:
        return {
            "success": False,
            "error": "This Instagram post has already been imported into the ERP.",
            "existing_event_id": str(existing["_id"]),
            "is_duplicate": True
        }

    doc = {
        "title": title.strip(),
        "description": description.strip(),
        "category": category or "Campus Life",
        "banner_url": banner_url,
        "source_url": clean_url,
        "source_id": source_id,
        "source": "instagram",
        "source_badge": "RIET Official Instagram",
        "is_external": True,
        "venue": venue or "RIET Campus, Jaipur",
        "organizer": organizer or "RIET Official (@riet_official)",
        "start_date": start_date or datetime.utcnow(),
        "end_date": start_date or datetime.utcnow(),
        "registration_deadline": None,
        "is_date_unverified": is_date_unverified,
        "is_venue_unverified": is_venue_unverified,
        "is_registration_open": False,
        "capacity": 0,
        "registered_count": 0,
        "review_status": "approved", # Direct publish by admin
        "created_at": datetime.utcnow(),
        "last_checked_at": datetime.utcnow()
    }

    result = await events_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await log_audit_event(
        user_id="admin",
        user_email=admin_email,
        action="MANUAL_INSTAGRAM_EVENT_IMPORT",
        resource_type="events",
        resource_id=doc["_id"],
        details={"source_url": clean_url, "title": title}
    )

    return {
        "success": True,
        "event": doc,
        "is_duplicate": False,
        "message": "Instagram post imported and published to campus events."
    }


async def check_instagram_api_status() -> dict:
    """
    Checks if Instagram Graph API environment configuration is available.
    Adheres strictly to the requirement:
    'Integrate Instagram using the official Instagram API when the account owner has granted the required permissions.
     Do not scrape login-protected content or bypass Instagram restrictions.'
    """
    token = os.environ.get("INSTAGRAM_ACCESS_TOKEN")
    account_id = os.environ.get("INSTAGRAM_ACCOUNT_ID")

    if not token or not account_id:
        return {
            "api_configured": False,
            "message": "Instagram Graph API is not currently configured. Official Meta App credentials (INSTAGRAM_ACCESS_TOKEN & INSTAGRAM_ACCOUNT_ID) required. Use the manual authorized post import workflow.",
            "official_handle": "@riet_official",
            "profile_url": "https://www.instagram.com/riet_official/"
        }

    try:
        url = f"https://graph.instagram.com/v18.0/{account_id}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token={token}&limit=10"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "api_configured": True,
                    "media_count": len(data.get("data", [])),
                    "items": data.get("data", [])
                }
            else:
                return {
                    "api_configured": False,
                    "error": f"Instagram Graph API returned HTTP {resp.status_code}: {resp.text}"
                }
    except Exception as e:
        return {
            "api_configured": False,
            "error": str(e)
        }
