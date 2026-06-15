import React, { useRef, useEffect, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

export default function FaceAuthModal({ isOpen, onClose, onCapture, title = "Face Identification Scan" }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => stopWebcam();
  }, [isOpen]);

  const startWebcam = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 400, height: 300, facingMode: "user" } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Webcam access denied. Check system permissions or verify no other app is using the camera.");
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !stream) return;
    setLoading(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 300;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const base64Image = canvas.toDataURL('image/jpeg');
      
      // Stop stream immediately
      stopWebcam();
      
      // Call parent handler
      onCapture(base64Image);
    } catch (err) {
      setError("Failed to capture webcam snapshot.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#161D30] border border-[#222F4D] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative text-slate-100 p-6">
        
        {/* Title bar */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#222F4D]">
          <h3 className="font-extrabold text-md flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary-400" />
            <span>{title}</span>
          </h3>
          <button 
            onClick={() => { stopWebcam(); onClose(); }}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video feed */}
        <div className="relative bg-[#0B0F19] rounded-xl overflow-hidden aspect-[4/3] border border-[#222F4D] flex items-center justify-center">
          {error ? (
            <p className="text-xs text-rose-400 p-4 text-center">{error}</p>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]"
            />
          )}
          
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
              <p className="text-xs text-slate-300 uppercase font-black tracking-widest">Verifying Face...</p>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-400 mt-3 text-center leading-normal">
          Center your face in the camera frame and ensure good room lighting before initiating evaluation.
        </p>

        {/* Action Row */}
        <div className="mt-5 flex gap-3 justify-end border-t border-[#222F4D] pt-4">
          <button 
            type="button" 
            onClick={() => { stopWebcam(); onClose(); }}
            className="px-4 py-2 bg-[#222F4D] hover:bg-[#1D2A47] text-slate-200 font-medium rounded-lg text-xs active:scale-95 transition-all cursor-pointer"
          >
            Cancel
          </button>
          {!error && (
            <button 
              type="button" 
              onClick={captureFrame}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg text-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-primary-600/20"
            >
              <Camera className="h-4 w-4" />
              <span>Capture and Scan</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
