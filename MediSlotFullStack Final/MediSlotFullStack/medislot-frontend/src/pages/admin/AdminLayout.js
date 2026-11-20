import { NavLink, Outlet } from "react-router-dom";

function AdminLayout() {
  return (
    <>
      <div className="subnav">
        <div className="container">
          <NavLink to="/admin" end>
            Overview
          </NavLink>
          <NavLink to="/admin/appointments">Appointments</NavLink>
          <NavLink to="/admin/doctors">Doctors and hours</NavLink>
          <NavLink to="/admin/appointment-types">Appointment types</NavLink>
        </div>
      </div>
      <Outlet />
    </>
  );
}

export default AdminLayout;