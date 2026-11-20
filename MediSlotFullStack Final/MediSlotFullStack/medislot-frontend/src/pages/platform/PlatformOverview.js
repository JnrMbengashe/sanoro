import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { API_BASE } from "../../api";

function StatCard({ number, label }) {
  return (
    <div className="overview-card">
      <div className="overview-number">{number}</div>
      <div className="overview-label">{label}</div>
    </div>
  );
}

function PlatformOverview() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${API_BASE}/platform/overview`)
      .then((response) => {
        if (!ignore) setData(response.data);
      })
      .catch(() => {
        if (!ignore) setFailed(true);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (failed) {
    return (
      <div className="container py-4">
        <h1>Dashboard</h1>
        <p>We could not load the overview. Check that the API is running and try again.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container py-4">
        <Spinner animation="border" size="sm" /> Loading
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1>Dashboard</h1>
      <p className="text-muted">How Sanoro is doing right now.</p>

      {data.surgeriesPending > 0 && (
        <div className="alert alert-warning" role="status">
          {data.surgeriesPending} {data.surgeriesPending === 1 ? "surgery is" : "surgeries are"} waiting for your approval.{" "}
          <Link to="/platform/approvals">Review them</Link>
        </div>
      )}

      <h2 className="h5 mt-4">Surgeries and people</h2>
      <div className="overview-grid">
        <StatCard number={data.surgeriesApproved} label="Surgeries live" />
        <StatCard number={data.surgeriesPending} label="Surgeries waiting for approval" />
        <StatCard number={data.surgeryAdmins} label="Surgery accounts" />
        <StatCard number={data.patients} label="Patient accounts" />
      </div>

      <h2 className="h5 mt-4">Bookings</h2>
      <div className="overview-grid">
        <StatCard number={data.appointmentsToday} label="Appointments today" />
        <StatCard number={data.appointmentsNext7Days} label="Booked for the next 7 days" />
        <StatCard number={data.bookingsLast7Days} label="Bookings made in the last 7 days" />
        <StatCard number={data.cancellationsLast7Days} label="Cancellations in the last 7 days" />
      </div>
    </div>
  );
}

export default PlatformOverview;