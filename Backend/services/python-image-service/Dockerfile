# Python Image Service Dockerfile
FROM python:3.9-slim

ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

# System libs cho TensorFlow + Pillow + OpenCV
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgtk-3-0 \
    libjpeg-dev \
    zlib1g \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file (cùng cấp Dockerfile)
COPY requirements.txt .

# Cài Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source trong thư mục python-image-service
COPY . .

# Tạo user thường
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD sh -c 'wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT:-8080}/health" || exit 1'

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
