import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout & Route Protection
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Courses from "./pages/Courses";
import Attendance from "./pages/Attendance";
import Marks from "./pages/Marks";
import Profile from "./pages/Profile";
import Notices from "./pages/Notices";
import Library from "./pages/Library";
import Events from "./pages/Events";

function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications styling */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "14px",
            background: "#1e293b",
            color: "#fff",
            fontSize: "13px",
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected App Routes inside Main Shell */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/students"
            element={
              <ProtectedRoute allowedRoles={["admin", "can_create_student"]}>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Teachers />
              </ProtectedRoute>
            }
          />
          <Route path="/courses" element={<Courses />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/marks" element={<Marks />} />
          <Route path="/library" element={<Library />} />
          <Route path="/events" element={<Events />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Catch all wildcard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;