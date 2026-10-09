import { useState, useEffect } from "react";
import {
  QrCode,
  Clock,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  X,
  BookOpen,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { getImageUrl } from "../services/api";

export default function QRProjectorModal({
  isOpen,
  onClose,
  activeQR,
  course,
  onRegenerate,
  attendanceCount = 0,
}) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!activeQR?.expires_at) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expire = new Date(activeQR.expires_at).getTime();
      const diff = Math.max(0, Math.floor((expire - now) / 1000));
      setTimeLeft(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQR]);

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Session Token copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimer = (seconds) => {
    if (seconds === null) return "--:--";
    if (seconds <= 0) return "SESSION EXPIRED";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const downloadQR = () => {
    if (!activeQR?.image) return;
    const link = document.createElement("a");
    link.href = getImageUrl(activeQR.image);
    link.download = `QR_Attendance_${course?.course_code || "CLASS"}_${new Date().toISOString().split("T")[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code downloaded successfully");
  };

  if (!isOpen || !activeQR) return null;

  const isExpired = timeLeft !== null && timeLeft <= 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md transition-all ${
        isFullscreen ? "p-0" : ""
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-800 text-white shadow-2xl flex flex-col justify-between overflow-hidden transition-all ${
          isFullscreen
            ? "w-screen h-screen rounded-none"
            : "w-full max-w-2xl rounded-3xl max-h-[92vh]"
        }`}
      >
        {/* Top University Branding Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black text-sm">
              <QrCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold tracking-tight uppercase">
                  Apex University Smartboard Projector
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles size={10} /> Live Session
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Classroom Digital Attendance Broadcaster
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title={isFullscreen ? "Exit Fullscreen" : "Smartboard Fullscreen Mode"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={() => {
                if (isFullscreen && document.exitFullscreen) {
                  document.exitFullscreen().catch(() => {});
                  setIsFullscreen(false);
                }
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Course Info Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <BookOpen size={14} />
              <span>
                {course?.course_name || course?.name || "Academic Course"}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-200 font-mono text-[11px]">
                {course?.course_code || course?.code || "COURSE"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <ShieldCheck size={13} /> Verified Session
            </span>
          </div>
        </div>

        {/* Center Content: QR Code & Countdown Timer */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-5 overflow-y-auto">
          {/* Main QR Display with Ambient Glow */}
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-500 rounded-3xl blur-lg opacity-40 group-hover:opacity-70 transition duration-1000" />
            <div className="relative p-5 bg-white rounded-2xl shadow-2xl border-4 border-slate-800">
              {activeQR.image ? (
                <img
                  src={getImageUrl(activeQR.image)}
                  alt="Live Attendance QR"
                  className={`${
                    isFullscreen ? "w-80 h-80" : "w-64 h-64"
                  } object-contain rounded-xl transition-all`}
                />
              ) : (
                <div
                  className={`${
                    isFullscreen ? "w-80 h-80" : "w-64 h-64"
                  } flex items-center justify-center bg-slate-100 text-slate-800 font-mono text-xs`}
                >
                  {activeQR.qr_id}
                </div>
              )}

              {/* Expired Overlay */}
              {isExpired && (
                <div className="absolute inset-0 bg-slate-950/90 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-rose-400 font-extrabold text-sm mb-1 uppercase tracking-wider">
                    QR Token Expired
                  </span>
                  <p className="text-[11px] text-slate-400 mb-3">
                    The 25-minute check-in window for this session has ended.
                  </p>
                  {onRegenerate && (
                    <button
                      onClick={onRegenerate}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                    >
                      <RefreshCw size={13} /> Re-launch Token
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Real-time Countdown Timer Pill */}
          <div
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-mono font-bold text-sm shadow-lg border transition-all ${
              isExpired
                ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                : timeLeft !== null && timeLeft < 300
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse"
                : "bg-purple-500/20 text-purple-300 border-purple-500/30"
            }`}
          >
            <Clock size={16} />
            <span>Time Left: {formatTimer(timeLeft)}</span>
          </div>

          {/* Manual Token String Box */}
          <div className="w-full max-w-md bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Session Token (For manual check-in):
              </span>
              <button
                onClick={() => copyToClipboard(activeQR.qr_id)}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy Token"}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-white bg-slate-900 p-2.5 rounded-xl border border-slate-800 break-all select-all font-semibold">
              {activeQR.qr_id}
            </div>
          </div>
        </div>

        {/* Projector Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400">
            Students scan using <strong className="text-white">Apex Portal Camera</strong> or paste the session token.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadQR}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Download size={14} /> Download PNG
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <RefreshCw size={14} /> Refresh Token
              </button>
            )}

            <button
              onClick={() => {
                if (isFullscreen && document.exitFullscreen) {
                  document.exitFullscreen().catch(() => {});
                  setIsFullscreen(false);
                }
                onClose();
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
