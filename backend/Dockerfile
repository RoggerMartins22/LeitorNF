FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

CMD ["sh", "-c", "python scripts/seed_200.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]