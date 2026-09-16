from flask import Flask, request, jsonify
from deepface import DeepFace
import traceback

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

        result = DeepFace.verify(
            img1_path=data['img1'],
            img2_path=data['img2'],
            model_name=data.get('model_name', 'Facenet512'),
            detector_backend=data.get('detector_backend', 'opencv'),
            distance_metric=data.get('distance_metric', 'cosine'),
            anti_spoofing=data.get('anti_spoofing', True),
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
            enforce_detection=True,
            align=True,
            anti_spoofing=False,
        )
        if len(faces) != 1:
            return jsonify({'valid': False, 'error': 'Enrollment image must contain exactly one face.'}), 400
        return jsonify({'valid': True})
    except ValueError as e:
        return jsonify({'valid': False, 'error': str(e)}), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({'valid': False, 'error': str(e)}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
