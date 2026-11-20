import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.some((role) => user.roles.includes(role))) {
    return (
      <div className="container py-4">
        <h1>You do not have access to this page</h1>
        <p>This page is for a different type of account.</p>
        <Link to="/">Go to the home page</Link>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;