// AdminDepartmentProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const AdminDepartmentProtectedRoute = ({ allowedDepartments = [], children }) => {
  const adminEmail = sessionStorage.getItem("admin_email");       // email from login
  const adminDepartment = sessionStorage.getItem("admin_department"); // department from login

  if (!adminEmail) return <Navigate to="/login" replace />;

  // Super admin sees everything
  if (adminEmail === "orilla.maaltheabalcos@gmail.com") return children;

  // Regular admin: only allow pages they are allowed to access
  if (!allowedDepartments.includes(adminDepartment)) return <Navigate to="/admin/dashboard" replace />;

  return children;
};

export default AdminDepartmentProtectedRoute;
