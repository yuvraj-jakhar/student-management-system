import subprocess
import re
import time
import os
import threading
from datetime import datetime
import urllib.request
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

CLOUDFLARED_BIN = os.path.abspath("cloudflared.exe")
LOCAL_PORT = 5173
PROJECT_DIR = os.path.abspath(".")
DESKTOP_DIR = os.path.expanduser("~/OneDrive/Desktop")
if not os.path.exists(DESKTOP_DIR):
    DESKTOP_DIR = os.path.expanduser("~/Desktop")

def write_live_info(url):
    content = f"""=====================================================
* RAJASTHAN INSTITUTE OF ENGINEERING & TECHNOLOGY (RIET JAIPUR)
  ENTERPRISE COLLEGE ERP - LIVE ONLINE PORTAL
=====================================================
* Current Live Link (Mobile / Any Browser):
  {url}

* Same Wi-Fi Link (Direct Access):
  http://10.210.215.222:5173

* Verified Demo Login Accounts (Password for all: 123456):
  - Administrator : admin@gmail.com
  - Faculty/Teacher: teacher@gmail.com
  - Student       : rahul@gmail.com
  - Librarian     : librarian@gmail.com

* Last Auto-Refreshed: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
=====================================================
"""
    try:
        with open(os.path.join(PROJECT_DIR, "LIVE_URL.txt"), "w", encoding="utf-8") as f:
            f.write(content)
    except Exception:
        pass

    try:
        with open(os.path.join(DESKTOP_DIR, "RIET_ERP_LIVE_LINK.txt"), "w", encoding="utf-8") as f:
            f.write(content)
    except Exception:
        pass


def keepalive_worker(url_holder):
    """Pings the health endpoint every 30s to keep Cloudflare edge session alive and warm."""
    while True:
        time.sleep(30)
        url = url_holder.get("url")
        if url:
            try:
                req = urllib.request.Request(
                    f"{url}/health",
                    headers={"User-Agent": "RIET-ERP-Keepalive/1.0"}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    pass
            except Exception:
                pass


def run_supervisor():
    url_holder = {"url": None}
    threading.Thread(target=keepalive_worker, args=(url_holder,), daemon=True).start()

    while True:
        print("[Supervisor] Starting Cloudflare Edge Tunnel...", flush=True)
        cmd = [CLOUDFLARED_BIN, "tunnel", "--url", f"http://localhost:{LOCAL_PORT}"]
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding="utf-8",
                errors="replace"
            )

            seen_url = False
            for line in proc.stdout:
                line_str = line.strip()
                if line_str:
                    print(f"[Cloudflare] {line_str}", flush=True)

                if not seen_url:
                    match = re.search(r"https://[a-zA-Z0-9\-]+\.trycloudflare\.com", line_str)
                    if match:
                        active_url = match.group(0)
                        seen_url = True
                        url_holder["url"] = active_url
                        print(f"\n==========================================", flush=True)
                        print(f"[+] ACTIVE CLOUDFLARE URL: {active_url}", flush=True)
                        print(f"==========================================\n", flush=True)
                        write_live_info(active_url)

                if "Tunnel not found" in line_str or "unauthorized" in line_str.lower():
                    print("[Supervisor] Disconnection detected. Auto-restarting tunnel...", flush=True)
                    proc.kill()
                    break

            proc.wait()
        except Exception as e:
            print(f"[Supervisor] Exception: {e}", flush=True)

        print("[Supervisor] Tunnel disconnected. Reconnecting in 3 seconds...", flush=True)
        time.sleep(3)


if __name__ == "__main__":
    run_supervisor()
