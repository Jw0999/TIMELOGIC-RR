import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface FaceCaptureProps {
  onCapture: (base64: string, livenessFrames?: string[]) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  activeLiveness?: boolean;
  canStart?: boolean;
}

export default function FaceCapture({ onCapture, onError, disabled, activeLiveness = false, canStart = true }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [preview, setPreview] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [instruction, setInstruction] = useState('Position your face in the frame');
  const [capturing, setCapturing] = useState(false);
  const [started, setStarted] = useState(!activeLiveness);

  useEffect(() => {
    if (activeLiveness && !started) return undefined;
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
  }, [activeLiveness, started]);

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    const maxWidth = 480;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.75);
  }

  async function capture() {
    if (capturing) return;
    setCapturing(true);
    if (!activeLiveness) {
      const photo = captureFrame();
      if (photo) {
        setPreview(photo);
        setCaptured(true);
        onCapture(photo);
      }
      setCapturing(false);
      return;
    }

    setInstruction('Turn your head slightly left');
    await new Promise((resolve) => window.setTimeout(resolve, 1400));
    const first = captureFrame();
    if (!first) { setCapturing(false); return; }
    setInstruction('Now turn your head slightly right');
    await new Promise((resolve) => window.setTimeout(resolve, 1400));
    const second = captureFrame();
    if (!second) { setCapturing(false); return; }
    setInstruction('Face the camera normally');
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const third = captureFrame();
    if (!third) { setCapturing(false); return; }
    setPreview(third);
    setCaptured(true);
    setInstruction('Live verification complete');
    onCapture(third, [first, second, third]);
    setCapturing(false);
  }

  useEffect(() => {
    if (activeLiveness && started && ready && !captured && !capturing && !disabled) {
      void capture();
    }
  }, [activeLiveness, started, ready, captured, capturing, disabled]);

  function retake() {
    setCaptured(false);
    setPreview('');
    setInstruction('Position your face in the frame');
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
      {activeLiveness && !started ? (
        <div className="face-cam-start">
          <p className="face-cam-hint">Enter the employee password first, then start face verification.</p>
          <button
            type="button"
            className="face-cam-btn primary"
            onClick={() => setStarted(true)}
            disabled={disabled || !canStart}
          >
            <Camera size={16} />
            <span>Start Face Verification</span>
          </button>
        </div>
      ) : null}
      {!captured ? (
        <div className="face-cam-viewport" style={activeLiveness && !started ? { display: 'none' } : undefined}>
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
                <span className="face-cam-hint">{instruction}</span>
              </div>
              {activeLiveness ? (
                <div className="face-cam-live-status" aria-live="polite">
                  <span>{instruction}</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="face-cam-btn primary"
                  onClick={() => void capture()}
                  disabled={disabled || capturing}
                >
                  <Camera size={16} />
                  <span>Capture face photo</span>
                </button>
              )}
            </>
          ) : (
            <div className="face-cam-loading">
              <RefreshCw size={20} className="spin text-blue-400" />
              <span>Initializing camera…</span>
            </div>
          )}
        </div>
      ) : activeLiveness ? (
        <div className="face-cam-live-status success" aria-live="polite">
          <CheckCircle2 size={16} />
          <span>{instruction}</span>
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
