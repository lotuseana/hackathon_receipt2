import React, { useState, useRef, useEffect } from 'react';

function CameraCapture({ onCapture, onCancel }) {
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (onCancel) onCancel();
  };

  // Automatically start camera when component mounts
  useEffect(() => {
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
        if (onCancel) onCancel();
      }
    })();
    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [onCancel]);

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
        const file = new File([blob], 'captured.jpg', { type: 'image/jpeg' });
        if (onCapture) onCapture(file);
      }
    }, 'image/jpeg');
    stopCamera();
  };

  return (
    <div className="camera-view">
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }} />
      <div className="camera-actions">
        <button onClick={capturePhoto}>Capture</button>
        <button onClick={stopCamera} className="secondary">Cancel</button>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {error && (
        <div className="error-message" style={{ marginTop: '10px' }}>{error}</div>
      )}
    </div>
  );
}

export default CameraCapture; 