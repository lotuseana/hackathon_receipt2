import React, { useState, useRef, useEffect } from 'react';

function CameraCapture({ onCapture }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera and set cameraActive
  const startCamera = async () => {
    setError(null);
    setCapturedImage(null);
    setCameraActive(true);
  };

  // Stop camera and cleanup
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Handle stream assignment and cleanup
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
    <div style={{ marginBottom: '20px' }}>
      {!cameraActive && (
        <button onClick={startCamera} style={{ marginBottom: '10px' }}>Take a Picture</button>
      )}
      {cameraActive && (
        <div style={{ marginBottom: '10px' }}>
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }} />
          <br />
          <button onClick={capturePhoto} style={{ marginRight: '10px' }}>Capture</button>
          <button onClick={stopCamera}>Cancel</button>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
      {capturedImage && (
        <div style={{ marginBottom: '10px' }}>
          <p>Captured Image:</p>
          <img src={capturedImage} alt="Captured" style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }} />
        </div>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>
      )}
    </div>
  );
}

export default CameraCapture; 