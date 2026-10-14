import sys
import re
import urllib.parse
import pymongo
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def clean_uri(raw_uri: str) -> str:
    match = re.match(r'^(mongodb(?:\+srv)?://)([^:]+):(.*)@([^/?]+)(.*)$', raw_uri)
    if match:
        prefix, user, pwd, host, rest = match.groups()
        user_enc = urllib.parse.quote_plus(urllib.parse.unquote_plus(user))
        pwd_enc = urllib.parse.quote_plus(urllib.parse.unquote_plus(pwd))
        if not rest.startswith("/student_management"):
            if rest.startswith("/"):
                rest = "/student_management" + rest[1:]
            else:
                rest = "/student_management" + rest
        return f"{prefix}{user_enc}:{pwd_enc}@{host}{rest}"
    return raw_uri


def migrate(raw_uri: str):
    atlas_uri = clean_uri(raw_uri)
    if not atlas_uri or not atlas_uri.startswith("mongodb"):
        print("[!] Error: Invalid MongoDB Atlas URI.")
        return

    print("=====================================================")
    print("[*] RIET JAIPUR ERP - CLOUD DATABASE MIGRATION TOOL")
    print("=====================================================")
    print("Connecting to Local MongoDB (localhost:27017)...")
    local_client = pymongo.MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
    local_db = local_client["student_management"]

    print("Connecting to MongoDB Atlas Cloud Cluster...")
    atlas_client = pymongo.MongoClient(atlas_uri, serverSelectionTimeoutMS=10000)
    atlas_db = atlas_client["student_management"]

    # Test Atlas connection
    atlas_client.admin.command('ping')
    print("[+] Successfully connected and authenticated to MongoDB Atlas Cloud!")

    collections = [
        "users",
        "courses",
        "attendance",
        "marks",
        "notices",
        "events",
        "event_registrations",
        "library_books",
        "library_issues",
        "notifications",
        "course_proposals",
        "audit_logs"
    ]

    total_migrated = 0
    for col_name in collections:
        local_col = local_db[col_name]
        atlas_col = atlas_db[col_name]

        docs = list(local_col.find({}))
        if docs:
            atlas_col.delete_many({})
            atlas_col.insert_many(docs)
            print(f"  [+] Migrated {len(docs)} documents into collection: '{col_name}'")
            total_migrated += len(docs)
        else:
            print(f"  [-] Collection '{col_name}' is empty (skipped).")

    print("=====================================================")
    print(f"[+] MIGRATION COMPLETE! Total {total_migrated} documents migrated to Cloud.")
    print("Your MongoDB Atlas database is now fully populated with all RIET Jaipur data.")
    print(f"\n[+] Production MONGO_URL to use in Render:")
    print(f"    {atlas_uri}")
    print("=====================================================")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_to_atlas.py <ATLAS_CONNECTION_STRING>")
    else:
        migrate(sys.argv[1])
