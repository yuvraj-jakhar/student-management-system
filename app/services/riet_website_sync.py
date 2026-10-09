import re
import html
from datetime import datetime
import httpx
from app.database import events_collection, log_audit_event
from app.core.logger import logger


def _categorize_event(title: str, desc: str) -> str:
    combined = (title + " " + desc).lower()
    if any(k in combined for k in ["hackathon", "hack", "coding", "ideathon"]):
        return "Hackathon"
    elif any(k in combined for k in ["webinar", "conference", "iccct", "seminar", "symposium"]):
        return "Seminar"
    elif any(k in combined for k in ["induction", "workshop", "fdp", "capacity development", "training"]):
        return "Workshop"
    elif any(k in combined for k in ["cricket", "sports", "riding", "polo", "athletics", "football"]):
        return "Sports"
    elif any(k in combined for k in ["placement", "recruit", "interview", "drive", "career"]):
        return "Placement"
    elif any(k in combined for k in ["fest", "cultural", "celebration", "annual day"]):
        return "Cultural"
    return "News & Updates"


def parse_riet_html(html_text: str) -> list[dict]:
    """
    Parses RIET official news & events page HTML without external dependencies.
    Extracts image, title, excerpt, and permalink.
    """
    items = []
    box_pattern = re.compile(r'<div\s+class=["\']latest-news-box["\']>(.*?)</div>\s*</div>', re.DOTALL | re.IGNORECASE)
    img_pattern = re.compile(r'<img[^>]+src=["\']([^"\']+)["\']', re.IGNORECASE)
    h3_pattern = re.compile(r'<h3>(.*?)</h3>', re.DOTALL | re.IGNORECASE)
    p_pattern = re.compile(r'<p>(.*?)</p>', re.DOTALL | re.IGNORECASE)
    link_pattern = re.compile(r'<a[^>]+href=["\']([^"\']+)["\'][^>]*class=["\']read-more["\']', re.IGNORECASE)

    for match in box_pattern.finditer(html_text):
        content = match.group(1)
        h3_match = h3_pattern.search(content)
        link_match = link_pattern.search(content)

        if not h3_match or not link_match:
            continue

        raw_title = re.sub(r'<[^<]+?>', '', h3_match.group(1))
        title = html.unescape(raw_title).strip()

        link = link_match.group(1).strip()

        img_match = img_pattern.search(content)
        img_url = img_match.group(1).strip() if img_match else None

        desc = ""
        p_match = p_pattern.search(content)
        if p_match:
            raw_p = re.sub(r'<[^<]+?>', '', p_match.group(1))
            desc = html.unescape(raw_p).strip()

        # Extract stable slug identifier from url
        slug_match = re.search(r'/news-events/([^/]+)/?', link)
        slug = slug_match.group(1) if slug_match else re.sub(r'[^a-zA-Z0-9]', '_', title[:40])
        source_id = f"riet_web_{slug.lower()}"

        items.append({
            "title": title,
            "description": desc or f"Official update from RIET Jaipur: {title}",
            "banner_url": img_url,
            "source_url": link,
            "source_id": source_id,
            "category": _categorize_event(title, desc),
            "venue": "RIET Campus, Bhankrota, Jaipur",
            "organizer": "Rajasthan Institute of Engineering & Technology",
            "source": "riet_website",
            "source_badge": "RIET Official Website",
            "is_external": True,
            "is_date_unverified": True,
            "is_venue_unverified": False,
            "is_registration_open": False,
            "capacity": 0,
            "registered_count": 0,
            "review_status": "approved", # Directly accessible to students
            "created_at": datetime.utcnow(),
            "last_checked_at": datetime.utcnow()
        })

    return items


async def sync_riet_official_website() -> dict:
    """
    Fetches official event updates from https://www.rietjaipur.ac.in/newsevents/
    Performs duplicate detection and saves newly discovered items.
    """
    target_url = "https://www.rietjaipur.ac.in/newsevents/"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RIET-ERP-Sync-Agent/2.0"
    }

    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            resp = await client.get(target_url, headers=headers)
            resp.raise_for_status()
            html_content = resp.text
    except Exception as e:
        logger.error(f"Error fetching RIET website events: {e}")
        # If network error, return error detail
        return {
            "success": False,
            "error": f"Failed to retrieve RIET website: {str(e)}",
            "imported_count": 0,
            "skipped_duplicates": 0,
            "total_found": 0
        }

    parsed_events = parse_riet_html(html_content)
    imported = 0
    skipped = 0

    for item in parsed_events:
        # Duplicate detection by source_url or source_id
        exists = await events_collection.find_one({
            "$or": [
                {"source_url": item["source_url"]},
                {"source_id": item["source_id"]}
            ]
        })

        if exists:
            # Update last_checked_at timestamp
            await events_collection.update_one(
                {"_id": exists["_id"]},
                {"$set": {"last_checked_at": datetime.utcnow()}}
            )
            skipped += 1
        else:
            await events_collection.insert_one(item)
            imported += 1

    await log_audit_event(
        user_id="system",
        user_email="system_sync@rietjaipur.ac.in",
        action="SYNC_RIET_WEBSITE_EVENTS",
        resource_type="events",
        resource_id="bulk_sync",
        details={
            "total_found": len(parsed_events),
            "imported_count": imported,
            "skipped_duplicates": skipped
        }
    )

    return {
        "success": True,
        "total_found": len(parsed_events),
        "imported_count": imported,
        "skipped_duplicates": skipped,
        "message": f"Successfully synced RIET website: {imported} new events imported, {skipped} existing skipped."
    }
