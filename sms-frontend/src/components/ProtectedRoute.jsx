import { Navigate } from "react-router-dom";
import { getCurrentUser, hasRole } from "../services/auth";
import { ShieldAlert } from "lucide-react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <ShieldAlert size={36} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          Your account role does not have authorization to view this section.
          Please contact your administrator if you believe this is in error.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
}
