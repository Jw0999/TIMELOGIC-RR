FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 curl && \
    rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download ultra-fast ONNX models directly during Docker build
RUN mkdir -p models && \
    curl -fsSL -o models/face_detection_yunet.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx && \
    curl -fsSL -o models/face_recognition_sface.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx

COPY app.py .

RUN chown -R 1000:1000 /app
USER user

EXPOSE 7860

CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT:-7860} -w 1 --threads 4 --timeout 60 app:app"]
