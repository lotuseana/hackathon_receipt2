import React, { useState, useRef, useEffect } from 'react';

function CameraCapture({ onCapture }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    setError(null);
    setCapturedImage(null);
    setCameraActive(true);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!cameraActive) return;
    let isMounted = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (isMounted && videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
      } catch (err) {
        setError('Could not access camera: ' + err.message);
        setCameraActive(false);
      }
    })();
    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (blob) {
        setCapturedImage(URL.createObjectURL(blob));
        const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
        if (onCapture) onCapture(file);
      }
    }, 'image/jpeg');
    stopCamera();
  };

  return (
    <div className="camera-capture">
      {!cameraActive && !capturedImage && (
        <button onClick={startCamera} className="camera-button">Take a Picture</button>
      )}
      {cameraActive && (
        <div className="camera-view">
          <video ref={videoRef} autoPlay playsInline />
          <div className="camera-controls">
            <button onClick={capturePhoto}>Capture</button>
            <button onClick={stopCamera} className="cancel">Cancel</button>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
      {capturedImage && !cameraActive && (
        <div className="captured-image-view">
          <p>Using captured image. To retake, re-open the camera.</p>
        </div>
      )}
      {error && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
}

export default CameraCapture; 