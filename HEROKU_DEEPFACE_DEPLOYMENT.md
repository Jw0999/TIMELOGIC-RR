# TimeLogic DeepFace Heroku Deployment Documentation

This document records the architecture, deployment procedure, security controls, and verification testing for the TimeLogic DeepFace Facial Verification microservice on Heroku.

---

## 1. Service Overview

- **Heroku App Name**: `timelogic-deepface`
- **Heroku Dyno URL**: `https://timelogic-deepface-74b4f1a80a95.herokuapp.com`
- **Git Remote**: `https://git.heroku.com/timelogic-deepface.git`
- **Stack**: Container (`heroku stack:set container`)
- **Base Image**: `python:3.11-slim`
- **Web Server**: Gunicorn (`gunicorn -b 0.0.0.0:$PORT -w 1 --threads 4 --timeout 60 app:app`)
- **CV / ML Engine**: OpenCV DNN FaceDetectorYN (YuNet) + FaceRecognizerSF (SFace)
- **Model Storage**: Pre-compiled ONNX models downloaded directly at container build time:
  - `face_detection_yunet.onnx` (YuNet 2023mar)
  - `face_recognition_sface.onnx` (SFace 2021dec)

---

## 2. Endpoints & API Contract

### `GET /health`
- **Access**: Public
- **Response**:
  ```json
  {
    "engine": "opencv_sface_ultra_fast",
    "status": "ok"
  }
  ```

### `POST /verify`
- **Access**: Internal (Requires header `X-Internal-Secret: <INTERNAL_SERVICE_SECRET>`)
- **Payload**:
  ```json
  {
    "img1": "data:image/jpeg;base64,...",
    "img2": "data:image/jpeg;base64,..."
  }
  ```
- **Response**:
  ```json
  {
    "verified": true,
    "distance": 0.125,
    "threshold": 0.637,
    "similarity": 0.875,
    "is_real": true
  }
  ```

### `POST /liveness`
- **Access**: Internal (Requires header `X-Internal-Secret: <INTERNAL_SERVICE_SECRET>`)
- **Payload**:
  ```json
  {
    "frames": [
      "data:image/jpeg;base64,...",
      "data:image/jpeg;base64,...",
      "data:image/jpeg;base64,..."
    ]
  }
  ```
- **Response**:
  ```json
  {
    "verified": true,
    "is_real": true,
    "method": "active-motion",
    "confidence": 0.92,
    "frame_count": 3
  }
  ```

---

## 3. Deployment Procedure Executed

1. **Authentication & App Creation**:
   ```bash
   heroku login
   heroku create timelogic-deepface
   heroku stack:set container -a timelogic-deepface
   ```

2. **Secure Environment Configuration**:
   ```bash
   heroku config:set \
     INTERNAL_SERVICE_SECRET="<MATCHING_RENDER_SECRET>" \
     PYTHONUNBUFFERED=1 \
     OMP_NUM_THREADS=1 \
     -a timelogic-deepface
   ```

3. **Branch Split & Container Build Push**:
   ```bash
   git subtree split --prefix deepface-service -b deepface-deploy
   git push https://git.heroku.com/timelogic-deepface.git deepface-deploy:main
   ```

4. **Dyno Process Scaled**:
   ```bash
   heroku ps -a timelogic-deepface
   # Output: web.1: up (Basic)
   ```

---

## 4. Security & Verification Tests

- **Health Probe Test**:
  - Request: `GET https://timelogic-deepface-74b4f1a80a95.herokuapp.com/health`
  - Result: `HTTP 200 OK` ➔ `{"engine":"opencv_sface_ultra_fast","status":"ok"}`
- **Unauthorized Request Test**:
  - Request: `POST https://timelogic-deepface-74b4f1a80a95.herokuapp.com/liveness` (no secret header)
  - Result: `HTTP 401 Unauthorized` ➔ `{"error":"Unauthorized service access"}`
- **Authorized Request Test**:
  - Request: `POST https://timelogic-deepface-74b4f1a80a95.herokuapp.com/liveness` with `X-Internal-Secret` header
  - Result: Passed gatekeeper validation with expected payload response.
