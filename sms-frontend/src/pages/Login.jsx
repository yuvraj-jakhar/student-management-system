import { useState } from "react";
import { User, Lock, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginUser } from "../services/auth";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const data = await loginUser(email, password);

      localStorage.setItem("token", data.access_token);

      toast.success("Login Successful");

      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-500 to-cyan-400 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">

        <div className="text-center">
          <div className="inline-flex bg-blue-600 p-4 rounded-full text-white">
            <GraduationCap size={40} />
          </div>

          <h1 className="text-3xl font-bold mt-4">
            Student Management System
          </h1>

          <p className="text-gray-500 mt-2">
            Sign in to continue
          </p>
        </div>

        <div className="mt-8">
          <label className="font-semibold">Email</label>

          <div className="flex items-center border rounded-xl mt-2 px-3">
            <User className="text-gray-400" size={20} />

            <input
              type="email"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 outline-none"
            />
          </div>
        </div>

        <div className="mt-5">
          <label className="font-semibold">Password</label>

          <div className="flex items-center border rounded-xl mt-2 px-3">
            <Lock className="text-gray-400" size={20} />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 outline-none"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 mt-8 font-semibold transition disabled:bg-gray-400"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          FastAPI • React • MongoDB • JWT
        </p>

      </div>
    </div>
  );
}

export default Login;