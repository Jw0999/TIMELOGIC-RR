import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface FaceCaptureProps {
  onCapture: (base64: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export default function FaceCapture({ onCapture, onError, disabled }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [preview, setPreview] = useState('');
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch((err) => {
        const msg = 'Camera access denied. Please allow camera permissions in your browser.';
        setCameraError(msg);
        onError?.(msg);
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const maxWidth = 480;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.75);
    setPreview(base64);
    setCaptured(true);
    onCapture(base64);
  }

  function retake() {
    setCaptured(false);
    setPreview('');
    onCapture('');
  }

  if (cameraError) {
    return (
      <div className="face-cam-error">
        <AlertCircle size={24} className="text-amber-500" />
        <p>{cameraError}</p>
      </div>
    );
  }

  return (
    <div className="face-cam-container">
      {!captured ? (
        <div className="face-cam-viewport">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="face-cam-video"
          />
          {ready ? (
            <>
              <div className="face-cam-guide">
                <div className="face-cam-oval"></div>
                <span className="face-cam-hint">Position face within the frame</span>
              </div>
              <button
                type="button"
                className="face-cam-btn primary"
                onClick={capture}
                disabled={disabled}
              >
                <Camera size={16} />
                <span>Snap Face Photo</span>
              </button>
            </>
          ) : (
            <div className="face-cam-loading">
              <RefreshCw size={20} className="spin text-blue-400" />
              <span>Initializing camera…</span>
            </div>
          )}
        </div>
      ) : (
        <div className="face-cam-preview-box">
          <div className="face-cam-preview-img-wrap">
            <img src={preview} alt="Captured face" className="face-cam-preview-img" />
            <div className="face-cam-success-tag">
              <CheckCircle2 size={14} />
              <span>Face Captured</span>
            </div>
          </div>
          <div className="face-cam-actions">
            <button
              type="button"
              className="face-cam-btn secondary"
              onClick={retake}
              disabled={disabled}
            >
              <RefreshCw size={14} />
              <span>Retake Photo</span>
            </button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} hidden />
    </div>
  );
}
