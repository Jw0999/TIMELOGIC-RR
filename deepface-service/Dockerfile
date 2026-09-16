FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download ultra-fast ONNX models directly during Docker build
RUN mkdir -p models && \
    curl -fsSL -o models/face_detection_yunet.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx && \
    curl -fsSL -o models/face_recognition_sface.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx

COPY app.py .

ENV PYTHONUNBUFFERED=1 OMP_NUM_THREADS=1
EXPOSE 5001

CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT:-5001} -w 1 --threads 2 --timeout 60 app:app"]
