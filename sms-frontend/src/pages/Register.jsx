import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, Building2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { uploadImage } from "../services/auth";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "student",
    phone_no: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      let image_url = null;
      if (selectedFile) {
        try {
          const uploadRes = await uploadImage(selectedFile);
          image_url = uploadRes.image_url;
        } catch {
          console.warn("Image upload failed, proceeding without image");
        }
      }

      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name || null,
        email: formData.email,
        password: formData.password,
        role: [formData.role],
        phone_no: formData.phone_no || null,
        image: image_url,
      };

      await api.post("/register", payload).catch(async () => {
        return await api.post("/admin/users", payload);
      });

      toast.success("Account created successfully! You can now log in.");
      navigate("/");
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Registration failed. Note: Admin authorization may be required."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-radial from-slate-900 via-indigo-950 to-slate-950 p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 p-6 text-white text-center">
          <div className="inline-flex bg-white/10 p-3 rounded-2xl backdrop-blur-xs border border-white/20 mb-2">
            <Building2 size={28} />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight leading-snug">
            Rajasthan Institute of Engineering & Technology
          </h1>
          <p className="text-xs text-indigo-100 mt-1 font-semibold tracking-wide">
            RIET Jaipur • Student & Faculty Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50">
                <User className="text-slate-400" size={15} />
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="First name"
                  className="w-full py-2 px-2 text-xs outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Last Name
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50">
                <User className="text-slate-400" size={15} />
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full py-2 px-2 text-xs outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Institutional Email *
            </label>
            <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50">
              <Mail className="text-slate-400" size={15} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="name@university.edu"
                className="w-full py-2 px-2 text-xs outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full py-2 px-3 border border-slate-200 rounded-xl text-xs outline-hidden bg-white focus:border-indigo-600 font-semibold text-slate-700"
              >
                <option value="student">🎓 Student</option>
                <option value="teacher">📚 Faculty Member</option>
                <option value="admin">👑 Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50">
                <Phone className="text-slate-400" size={15} />
                <input
                  type="tel"
                  name="phone_no"
                  value={formData.phone_no}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full py-2 px-2 text-xs outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50">
                <Lock className="text-slate-400" size={15} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full py-2 px-2 text-xs outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <div className="flex items-center border border-slate-200 rounded-xl px-3 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-50">
                <Lock className="text-slate-400" size={15} />
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full py-2 px-2 text-xs outline-hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Profile Photo (Optional)
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-bold text-xs shadow-md shadow-indigo-600/20 transition disabled:opacity-50 mt-4"
          >
            {loading ? "Creating Profile..." : "Complete Profile Registration"}
          </button>

          <div className="pt-2 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/" className="font-bold text-indigo-600 hover:text-indigo-700">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
