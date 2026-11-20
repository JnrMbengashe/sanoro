import { NavLink, Outlet } from "react-router-dom";

function PlatformLayout() {
  return (
    <>
      <div className="subnav">
        <div className="container">
          <NavLink to="/platform" end>
            Overview
          </NavLink>
          <NavLink to="/platform/approvals">Approvals</NavLink>
          <NavLink to="/platform/surgeries">Surgery records</NavLink>
          <NavLink to="/platform/users">Users</NavLink>
        </div>
      </div>
      <Outlet />
    </>
  );
}

export default PlatformLayout;