import os
import traceback

# Force CPU inference and limit memory to stay well within Render Free tier (512MB RAM)
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_NUM_INTRAOP_THREADS'] = '1'

from flask import Flask, request, jsonify
from deepface import DeepFace

app = Flask(__name__)


def image_value(data, key):
    value = data.get(key) if data else None
    if not isinstance(value, str) or not value:
        raise ValueError(f'{key} is required')
    return value


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


@app.route('/verify', methods=['POST'])
def verify():
    try:
        data = request.get_json()
        if not data or 'img1' not in data or 'img2' not in data:
            return jsonify({'error': 'img1 and img2 are required'}), 400

        anti_spoofing = bool(data.get('anti_spoofing', False))

        result = DeepFace.verify(
            img1_path=data['img1'],
            img2_path=data['img2'],
            model_name=data.get('model_name', 'Facenet512'),
            detector_backend=data.get('detector_backend', 'opencv'),
            distance_metric=data.get('distance_metric', 'cosine'),
            enforce_detection=False,
            anti_spoofing=anti_spoofing,
        )

        return jsonify({
            'verified': bool(result['verified']),
            'distance': round(float(result['distance']), 4),
            'threshold': float(result['threshold']),
            'is_real': result.get('is_real'),
        })
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/validate', methods=['POST'])
def validate():
    try:
        data = request.get_json()
        image = image_value(data, 'image')
        faces = DeepFace.extract_faces(
            img_path=image,
            detector_backend='opencv',
            enforce_detection=False,
            align=True,
            anti_spoofing=False,
        )
        # Filter confident detections
        confident_faces = [f for f in faces if f.get('confidence', 0) >= 0.45]
        if not confident_faces:
            # If no face reached 0.45 confidence, check if any face was detected at all
            if faces and faces[0].get('confidence', 0) >= 0.25:
                confident_faces = [faces[0]]
            else:
                return jsonify({'valid': False, 'error': 'No face detected. Please ensure your face is clearly visible in the camera frame.'}), 400

        if len(confident_faces) > 1:
            return jsonify({'valid': False, 'error': 'Multiple faces detected. Only one person should be in front of the camera.'}), 400

        return jsonify({'valid': True})
    except ValueError as e:
        return jsonify({'valid': False, 'error': str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({'valid': False, 'error': str(e)}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
