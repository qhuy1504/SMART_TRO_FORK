# Dockerfile cho Chatbot (FastAPI)
FROM python:3.9-slim

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

# Cài system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code chatbot service
COPY . .

# Tạo user thường
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start FastAPI app
CMD ["sh", "-c", "uvicorn gradio_server:app --host 0.0.0.0 --port ${PORT:-8080}"]
