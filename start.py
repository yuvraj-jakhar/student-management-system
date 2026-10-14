import os
import sys

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Determine listening port
port = 8000
raw_port = os.environ.get("PORT", "8000")
try:
    port = int(raw_port)
except Exception:
    port = 8000

# Handle command-line arguments like --port 10000 or --port $PORT
for i, arg in enumerate(sys.argv):
    if arg in ("--port", "-p") and i + 1 < len(sys.argv):
        try:
            port = int(sys.argv[i + 1])
        except Exception:
            pass

print("==================================================", flush=True)
print(f"[*] Starting RIET Jaipur ERP on 0.0.0.0:{port}", flush=True)
print(f"[*] Python Version: {sys.version.split()[0]}", flush=True)
print("==================================================", flush=True)

try:
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, log_level="info")
except Exception as e:
    import traceback
    print("[!] FATAL ERROR DURING STARTUP:", flush=True)
    traceback.print_exc()
    sys.exit(1)
