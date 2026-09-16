FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout 600 -r requirements.txt
# DeepFace's current OpenCV wheel omits the Haar cascade data it expects.
RUN python -c "import cv2, urllib.request; urllib.request.urlretrieve('https://raw.githubusercontent.com/opencv/opencv/4.x/data/haarcascades/haarcascade_frontalface_default.xml', cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')" && \
    python -c "import cv2, os; assert os.path.exists(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')"

# Pre-download the Facenet512 model weights so container starts fast
RUN python -c "from deepface import DeepFace; DeepFace.build_model('Facenet512')"

COPY app.py .
ENV PYTHONUNBUFFERED=1 TF_CPP_MIN_LOG_LEVEL=2
EXPOSE 5001
CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT:-5001} -w 1 --threads 2 --timeout 120 app:app"]
