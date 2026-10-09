import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Camera,
  Building2,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

import { getCurrentUser, uploadImage, resetPassword } from "../services/auth";
import { getStudentProfile } from "../services/student";
import { updateUser, getAllUsers } from "../services/admin";
import { getImageUrl } from "../services/api";

import Loader from "../components/Loader";

export default function Profile() {
  const localUser = getCurrentUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_no: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Password reset fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const isStudent = localUser?.role?.includes("student");
      let data = null;

      if (isStudent) {
        data = await getStudentProfile().catch(() => null);
      }

      if (!data) {
        const all = await getAllUsers().catch(() => []);
        data = all.find((u) => u._id === localUser?.sub || u.email === localUser?.email);
      }

      if (data) {
        setProfile(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone_no: data.phone_no || "",
        });
      } else {
        setProfile(localUser);
      }
    } catch (err) {
      toast.error("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let image_url = profile?.image;

      if (selectedFile) {
        const up = await uploadImage(selectedFile);
        image_url = up.image_url;
      }

      const userId = profile?._id || localUser?.sub;
      if (userId) {
        await updateUser(userId, {
          first_name: formData.first_name,
          last_name: formData.last_name || null,
          phone_no: formData.phone_no || null,
          image: image_url,
        });
        toast.success("Profile records updated successfully");
        fetchProfile();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error("Passwords do not match or are empty");
      return;
    }
    try {
      setPassLoading(true);
      const email = profile?.email || localUser?.email;
      await resetPassword(email, newPassword);
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update password");
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return <Loader text="Loading your university ID profile..." />;
  }

  const avatar = previewUrl || getImageUrl(profile?.image);
  const roles = Array.isArray(profile?.role)
    ? profile.role
    : [profile?.role || "User"];

  return (
    <div className="space-y-5">
      {/* Official University ID Presentation Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md shadow-indigo-600/20">
              {profile?.first_name ? profile.first_name[0] : "U"}
            </div>
          )}

          <label className="absolute -bottom-1.5 -right-1.5 p-2 bg-slate-900 text-white rounded-xl cursor-pointer hover:bg-slate-800 shadow-md transition">
            <Camera size={14} />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        <div className="text-center sm:text-left flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {profile?.first_name} {profile?.last_name || ""}
            </h2>
            {roles.map((r, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase border border-indigo-200"
              >
                {r}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1">
            <Mail size={13} className="text-slate-400" /> {profile?.email}
          </p>
          <p className="text-xs text-slate-400 font-mono">
            Institution ID: #{profile?._id || localUser?.sub}
          </p>
        </div>
      </div>

      {/* Forms Grid: Equal Height Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Details */}
        <div className="h-full bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User size={16} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Personal Identification
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone_no}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_no: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-xs"
                >
                  {saving ? "Updating..." : "Save Personal Details"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="h-full bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <KeyRound size={16} className="text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Credential Security
              </h3>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-purple-600"
                />
              </div>

              <div className="pt-7">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-xs"
                >
                  {passLoading ? "Updating..." : "Update Security Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
