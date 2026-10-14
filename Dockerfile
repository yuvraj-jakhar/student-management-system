FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Ensure uploads directory is created
RUN mkdir -p /app/uploads

# Copy backend code, static assets, and startup script
COPY app/ ./app/
COPY uploads/ ./uploads/
COPY start.py .

# Expose default port
EXPOSE 8000

# Start FastAPI application using robust start.py
ENV PORT=8000
CMD ["python", "start.py"]
