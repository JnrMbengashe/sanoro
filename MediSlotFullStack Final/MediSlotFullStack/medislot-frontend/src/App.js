import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { AuthProvider, roleHome, roleLabel, useAuth } from "./AuthContext";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminAppointmentTypes from "./pages/admin/AdminAppointmentTypes";
import ProtectedRoute from "./ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RegisterSurgery from "./pages/RegisterSurgery";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SurgeryList from "./pages/SurgeryList";
import SurgeryPublicDetails from "./pages/SurgeryPublicDetails";
import SurgeryDashboard from "./pages/SurgeryDashboard";
import PendingSurgeries from "./pages/PendingSurgeries";
import ManageSurgeries from "./pages/ManageSurgeries";
import BookAppointment from "./pages/BookAppointment";
import MyAppointments from "./pages/MyAppointments";
import AdminAppointments from "./pages/admin/AdminAppointments";
import PlatformLayout from "./pages/platform/PlatformLayout";
import PlatformOverview from "./pages/platform/PlatformOverview";
import PlatformUsers from "./pages/platform/PlatformUsers";


function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <div className="container d-flex align-items-center justify-content-between flex-wrap gap-2">
        <Link to="/" className="brand">
          Sanoro
        </Link>
        <nav className="site-nav">
          <NavLink to="/surgeries">Find a surgery</NavLink>
          {user ? (
            <>
              {user.roles.includes("PlatformAdmin") ? (
                <NavLink to="/platform">Dashboard</NavLink>
              ) : (
                <NavLink to={roleHome(user.roles)}>{roleLabel(user.roles)}</NavLink>
              )}
              <span className="site-user">{user.fullName}</span>
              <button type="button" className="nav-button" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/register-surgery">For surgeries</NavLink>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register" className="nav-cta">
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function ComingSoon({ title, text }) {
  const { user } = useAuth();
  return (
    <div className="container py-4">
      <h1>{title}</h1>
      <p>Welcome, {user.fullName}.</p>
      <p className="text-muted">{text}</p>
    </div>
  );
}

function NotFound() {
  return (
    <div className="container py-4">
      <h1>Page not found</h1>
      <Link to="/">Go to the home page</Link>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />

        <main>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/surgeries" element={<SurgeryList />} />
            <Route path="/surgeries/:id" element={<SurgeryPublicDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-surgery" element={<RegisterSurgery />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />

                        <Route
              path="/surgeries/:id/book"
              element={
                <ProtectedRoute roles={["Patient"]}>
                  <BookAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient"
              element={
                <ProtectedRoute roles={["Patient"]}>
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
                        <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["SurgeryAdmin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SurgeryDashboard />} />
              <Route path="doctors" element={<AdminDoctors />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="appointment-types" element={<AdminAppointmentTypes />} />
            </Route>
            <Route
              path="/platform"
              element={
                <ProtectedRoute roles={["PlatformAdmin"]}>
                  <PlatformLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PlatformOverview />} />
              <Route path="approvals" element={<PendingSurgeries />} />
              <Route path="surgeries" element={<ManageSurgeries />} />
              <Route path="users" element={<PlatformUsers />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

                <footer className="site-footer">
          <div className="container footer-grid">
            <div>
              <div className="footer-brand">Sanoro</div>
              <p className="mb-0">Ixesha lakho. Impilo yethu.</p>
            </div>
            <div>
              <div className="footer-heading">Patients</div>
              <ul className="footer-links">
                <li>
                  <Link to="/surgeries">Find a surgery</Link>
                </li>
                <li>
                  <Link to="/register">Create an account</Link>
                </li>
                <li>
                  <Link to="/login">Log in</Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="footer-heading">Surgeries</div>
              <ul className="footer-links">
                <li>
                  <Link to="/register-surgery">Register your surgery</Link>
                </li>
                <li>
                  <Link to="/login">Surgery log in</Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="footer-heading">About</div>
              <ul className="footer-links">
                <li>
                  <Link to="/privacy">Privacy policy</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="container footer-copy">&copy; {new Date().getFullYear()} Sanoro. All rights reserved.</div>
        </footer>

        <ToastContainer position="top-right" autoClose={3000} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;