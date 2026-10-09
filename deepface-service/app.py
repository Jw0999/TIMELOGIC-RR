import os
import cv2
import base64
import numpy as np
import traceback
from flask import Flask, request, jsonify

app = Flask(__name__)

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

YUNET_PATH = os.path.join(MODELS_DIR, 'face_detection_yunet.onnx')
SFACE_PATH = os.path.join(MODELS_DIR, 'face_recognition_sface.onnx')

# Initialize OpenCV DNN models
detector = cv2.FaceDetectorYN.create(YUNET_PATH, '', (320, 320), score_threshold=0.6, nms_threshold=0.3)
recognizer = cv2.FaceRecognizerSF.create(SFACE_PATH, '')

# Haar cascade backup
HAAR_PATH = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
haar_cascade = cv2.CascadeClassifier(HAAR_PATH) if os.path.exists(HAAR_PATH) else None

# SFace cosine similarity threshold: >= 0.363 is considered the same person
COSINE_THRESHOLD = 0.363

INTERNAL_SERVICE_SECRET = os.environ.get('INTERNAL_SERVICE_SECRET', '')

@app.before_request
def require_internal_secret():
    if request.path == '/health':
        return None
    if INTERNAL_SERVICE_SECRET:
        auth_header = request.headers.get('X-Internal-Secret')
        if not auth_header or auth_header != INTERNAL_SERVICE_SECRET:
            return jsonify({'error': 'Unauthorized service access'}), 401
    return None


def decode_image(img_input):
    """Decode base64 data URI, raw base64, or file path to OpenCV BGR numpy array."""
    if not img_input or not isinstance(img_input, str):
        raise ValueError("Image input must be a valid string")

    # If it's a file path
    if os.path.exists(img_input):
        img = cv2.imread(img_input)
        if img is not None:
            return img

    # If it's a data URI or base64 string
    b64_str = img_input
    if ',' in b64_str:
        b64_str = b64_str.split(',', 1)[1]

    try:
        raw_bytes = base64.b64decode(b64_str)
        np_arr = np.frombuffer(raw_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image buffer")
        return img
    except Exception as e:
        raise ValueError(f"Invalid image encoding: {str(e)}")


def detect_faces(img):
    """Detect all faces in image using YuNet with Haar fallback."""
    h, w, _ = img.shape
    detector.setInputSize((w, h))
    _, faces = detector.detect(img)

    if faces is not None and len(faces) > 0:
        return faces

    # Fallback to Haar Cascade
    if haar_cascade is not None:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h_faces = haar_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(30, 30))
        if len(h_faces) > 0:
            constructed = []
            for (x, y, fw, fh) in h_faces:
                # Construct synthetic landmarks for SFace alignCrop
                row = np.array([
                    x, y, fw, fh,
                    x + fw * 0.3, y + fh * 0.35,  # Right eye
                    x + fw * 0.7, y + fh * 0.35,  # Left eye
                    x + fw * 0.5, y + fh * 0.55,  # Nose tip
                    x + fw * 0.35, y + fh * 0.75, # Right mouth
                    x + fw * 0.65, y + fh * 0.75, # Left mouth
                    0.95                          # Score
                ], dtype=np.float32)
                constructed.append(row)
            return np.array(constructed)

    return None


def face_center(face):
    return float(face[0] + (face[2] / 2.0)), float(face[1] + (face[3] / 2.0))


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'engine': 'opencv_sface_ultra_fast'})


@app.route('/verify', methods=['POST'])
def verify():
    """Verify live capture against stored photo."""
    try:
        data = request.get_json(force=True, silent=True)
        if not data or 'img1' not in data or 'img2' not in data:
            return jsonify({'error': 'img1 and img2 are required'}), 400

        img1 = decode_image(data['img1'])
        img2 = decode_image(data['img2'])

        faces1 = detect_faces(img1)
        faces2 = detect_faces(img2)

        # If live image has no face detected
        if faces1 is None or len(faces1) == 0:
            return jsonify({
                'verified': False,
                'distance': 1.0,
                'threshold': round(1.0 - COSINE_THRESHOLD, 3),
                'error': 'No face detected in live camera capture. Please face the camera directly.',
                'is_real': True
            }), 200

        # If stored photo has no face detected, crop center
        if faces2 is None or len(faces2) == 0:
            h, w, _ = img2.shape
            synthetic = np.array([[
                w * 0.1, h * 0.1, w * 0.8, h * 0.8,
                w * 0.35, h * 0.35, w * 0.65, h * 0.35,
                w * 0.5, h * 0.55, w * 0.35, h * 0.75, w * 0.65, h * 0.75, 0.9
            ]], dtype=np.float32)
            faces2 = synthetic

        crop1 = recognizer.alignCrop(img1, faces1[0])
        crop2 = recognizer.alignCrop(img2, faces2[0])

        feat1 = recognizer.feature(crop1)
        feat2 = recognizer.feature(crop2)

        cosine_score = float(recognizer.match(feat1, feat2, cv2.FaceRecognizerSF_FR_COSINE))
        verified = bool(cosine_score >= COSINE_THRESHOLD)
        distance = round(max(0.0, 1.0 - cosine_score), 4)

        return jsonify({
            'verified': verified,
            'distance': distance,
            'threshold': round(1.0 - COSINE_THRESHOLD, 3),
            'similarity': round(cosine_score, 4),
            'is_real': True
        })

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f"Face verification engine error: {str(e)}"}), 500


@app.route('/liveness', methods=['POST'])
def liveness():
    """Validate a short active movement sequence before identity matching."""
    try:
        data = request.get_json(force=True, silent=True) or {}
        frames = data.get('frames')
        if not isinstance(frames, list) or len(frames) < 3 or len(frames) > 5:
            return jsonify({'verified': False, 'error': 'At least three liveness frames are required.'}), 400

        centers = []
        areas = []
        face_crops = []
        for frame in frames:
            image = decode_image(frame)
            faces = detect_faces(image)
            if faces is None or len(faces) == 0:
                continue
            # When multiple faces or background poster features are detected, select the largest (foreground) face
            if len(faces) > 1:
                faces = sorted(faces, key=lambda f: float(f[2] * f[3]), reverse=True)
            face = faces[0]
            centers.append(face_center(face))
            areas.append(float(face[2] * face[3]))
            x, y, width, height = [int(value) for value in face[:4]]
            padding_x = int(width * 0.15)
            padding_y = int(height * 0.15)
            left = max(0, x - padding_x)
            top = max(0, y - padding_y)
            right = min(image.shape[1], x + width + padding_x)
            bottom = min(image.shape[0], y + height + padding_y)
            crop = image[top:bottom, left:right]
            if crop.size > 0:
                face_crops.append(cv2.resize(cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY), (96, 96)))

        if len(centers) < 2 or len(face_crops) < 2:
            return jsonify({'verified': False, 'error': 'Keep your face clearly visible in front of the camera.'}), 200

        width = float(decode_image(frames[0]).shape[1])
        horizontal_motion = (max(point[0] for point in centers) - min(point[0] for point in centers)) / max(width, 1.0)
        area_min = min(areas)
        area_max = max(areas)
        stable_face = area_min > 0 and (area_max / area_min) <= 3.5
        appearance_motion = sum(
            float(np.mean(cv2.absdiff(face_crops[index], face_crops[index + 1]))) / 255.0
            for index in range(len(face_crops) - 1)
        )
        verified = bool(stable_face and (horizontal_motion >= 0.012 or appearance_motion >= 0.015))
        return jsonify({
            'verified': verified,
            'is_real': verified,
            'method': 'active-motion',
            'confidence': round(min(1.0, max(horizontal_motion / 0.08, appearance_motion / 0.08)), 3),
            'frame_count': len(frames),
            'error': None if verified else 'Move your head slightly left or right while the camera is active.',
        })
    except ValueError as e:
        return jsonify({'verified': False, 'error': str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({'verified': False, 'error': f"Liveness engine error: {str(e)}"}), 500


@app.route('/validate', methods=['POST'])
def validate():
    """Validate enrollment image: must contain exactly one clear face."""
    try:
        data = request.get_json(force=True, silent=True)
        img_val = data.get('image') if data else None
        if not img_val:
            return jsonify({'valid': False, 'error': 'image is required'}), 400

        img = decode_image(img_val)
        faces = detect_faces(img)

        if faces is None or len(faces) == 0:
            return jsonify({
                'valid': False,
                'error': 'No face detected. Please ensure your face is clearly visible in the camera frame.'
            }), 400

        if len(faces) > 1:
            return jsonify({
                'valid': False,
                'error': 'Multiple faces detected. Only one person should be in front of the camera.'
            }), 400

        return jsonify({'valid': True})

    except ValueError as e:
        return jsonify({'valid': False, 'error': str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({'valid': False, 'error': str(e)}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
