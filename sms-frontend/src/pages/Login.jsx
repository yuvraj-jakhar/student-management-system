import { useState } from "react";
import { User, Lock, Eye, EyeOff, Building2, ArrowRight, ShieldCheck, KeyRound, HelpCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser, forgotPassword, resetPassword } from "../services/auth";
import Modal from "../components/Modal";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot / Reset Password state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      toast.success("Welcome back! Login successful");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please provide your email address");
      return;
    }
    try {
      setResetLoading(true);
      await forgotPassword(resetEmail);
      toast.success("Account verified. Please set your new password");
      setResetStep(2);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Email address not registered");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    try {
      setResetLoading(true);
      await resetPassword(resetEmail, newPassword);
      toast.success("Password reset successfully! Please sign in.");
      setForgotModalOpen(false);
      setResetStep(1);
      setPassword(newPassword);
      setEmail(resetEmail);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not reset password");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-radial from-slate-900 via-indigo-950 to-slate-950 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Institution Header Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 p-6 text-white text-center">
          <div className="inline-flex bg-white/10 p-3 rounded-2xl backdrop-blur-xs border border-white/20 mb-3 shadow-inner">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug">
            Rajasthan Institute of Engineering & Technology
          </h1>
          <p className="text-xs text-indigo-100 mt-1 font-semibold tracking-wide">
            RIET Jaipur • Enterprise Campus ERP
          </p>
        </div>

        <div className="p-6 sm:p-7">
          {/* Fast Switch Demo Pills */}
          <div className="mb-5 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <HelpCircle size={12} /> Test Roles Quick-Fill
              </span>
              <span className="text-[10px] font-mono text-slate-400">pwd: 123456</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@gmail.com", "123456")}
                className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 font-bold text-slate-700 transition text-center shadow-xs"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("teacher@gmail.com", "123456")}
                className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 hover:border-purple-500 hover:text-purple-600 font-bold text-slate-700 transition text-center shadow-xs"
              >
                📚 Faculty
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("rahul@gmail.com", "123456")}
                className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 font-bold text-slate-700 transition text-center shadow-xs"
              >
                🎓 Student
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50 transition">
                <User className="text-slate-400" size={16} />
                <input
                  type="email"
                  placeholder="user@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-2.5 px-2.5 text-xs outline-hidden text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetStep(1);
                    setForgotModalOpen(true);
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50 transition">
                <Lock className="text-slate-400" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-2.5 px-2.5 text-xs outline-hidden text-slate-800 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-bold text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50 mt-5"
            >
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need an account?</span>
            <Link
              to="/register"
              className="font-bold text-indigo-600 hover:text-indigo-700"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title={resetStep === 1 ? "Account Verification" : "Create New Password"}
      >
        {resetStep === 1 ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter your registered institutional email to locate your account:
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@university.edu"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {resetLoading ? "Verifying..." : "Verify Account"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter new password for <span className="font-bold">{resetEmail}</span>:
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetStep(1)}
                className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                {resetLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}