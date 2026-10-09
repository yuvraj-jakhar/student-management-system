import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, RefreshCw, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" (back) or "user" (front)
  const [scannedResult, setScannedResult] = useState(null);
  const qrReaderRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setCameraError(null);
      return;
    }

    // Give DOM a frame to render the container
    const timer = setTimeout(() => {
      startCamera(facingMode);
    }, 200);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode) => {
    setCameraError(null);
    setCameraActive(false);

    try {
      if (qrReaderRef.current) {
        try {
          await qrReaderRef.current.stop();
        } catch (e) {
          // ignore if already stopped
        }
      }

      const readerId = "qr-reader-container";
      const container = document.getElementById(readerId);
      if (!container) return;

      const html5QrCode = new Html5Qrcode(readerId);
      qrReaderRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: mode },
        config,
        (decodedText) => {
          handleDetected(decodedText);
        },
        (errorMessage) => {
          // scanning frames without QR - expected, do nothing
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.warn("Camera start error:", err);
      setCameraError(
        "Camera access denied or unavailable. Please grant camera permissions or upload an image file."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (qrReaderRef.current) {
      try {
        if (qrReaderRef.current.isScanning) {
          await qrReaderRef.current.stop();
        }
        qrReaderRef.current.clear();
      } catch (e) {
        // ignore
      }
      qrReaderRef.current = null;
    }
    setCameraActive(false);
  };

  const handleDetected = async (token) => {
    // Play light beep audio if supported
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // AudioContext may be blocked by browser policy
    }

    setScannedResult(token);
    await stopCamera();
    onScanSuccess(token);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-file-processor");
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      handleDetected(decodedText);
    } catch (err) {
      setCameraError("Could not read a valid QR code from this image. Please try another image.");
    }
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Real-Time QR Scanner</h3>
              <p className="text-[10px] text-slate-400">Aim camera at classroom projector screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-5 bg-slate-950 relative flex flex-col items-center justify-center min-h-[320px]">
          {/* Target Container for html5-qrcode */}
          <div
            id="qr-reader-container"
            className="w-full max-w-[280px] h-[280px] rounded-2xl overflow-hidden bg-black flex items-center justify-center relative shadow-inner"
          />

          {/* Hidden processor for file scan */}
          <div id="qr-file-processor" className="hidden" />

          {/* Futuristic Laser Overlay when camera is active */}
          {cameraActive && !scannedResult && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[240px] h-[240px] border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                {/* 4 Corner Markers */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br" />

                {/* Animated Horizontal Laser Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#10B981] animate-bounce mt-24" />
              </div>
            </div>
          )}

          {/* Scanned Success Confirmation */}
          {scannedResult && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-center p-6 space-y-2 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="text-base font-bold text-white">QR Code Detected!</h4>
              <p className="text-xs text-slate-300 font-mono break-all max-w-xs bg-slate-800 p-2 rounded-lg">
                {scannedResult}
              </p>
              <span className="text-[11px] text-emerald-400 font-medium">
                Recording your attendance...
              </span>
            </div>
          )}

          {/* Camera Error / Permission Denied */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <p className="text-xs text-rose-300 max-w-xs">{cameraError}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Retry Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Upload size={14} /> Upload Image
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCamera}
              disabled={!cameraActive}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition shadow-2xs"
              title="Flip between front and rear cameras"
            >
              <RefreshCw size={13} /> Flip Camera
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
              title="Upload photo of QR code"
            >
              <Upload size={13} /> Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
