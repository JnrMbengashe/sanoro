import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { API_BASE } from "../api";

function SurgeryDashboard() {
  const [surgery, setSurgery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${API_BASE}/MySurgery`)
      .then((response) => {
        if (!ignore) setSurgery(response.data);
      })
      .catch(() => {
        if (!ignore) setFailed(true);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="container py-4">
        <Spinner animation="border" size="sm" /> Loading your surgery
      </div>
    );
  }

  if (failed || !surgery) {
    return (
      <div className="container py-4">
        <h1>My surgery</h1>
        <p>We could not load your surgery. Check that the API is running and try again.</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1>{surgery.name}</h1>
      <p className="text-muted">
        {surgery.address}, {surgery.town}. {surgery.phoneNumber}
      </p>

      {surgery.isApproved ? (
        <div className="alert alert-success" role="status">
          Your surgery is live. Patients can find it on Sanoro.{" "}
          <Link to={`/surgeries/${surgery.id}`}>See how patients see it</Link>
        </div>
      ) : (
        <div className="alert alert-warning" role="status">
          Your surgery is waiting for approval. Patients cannot see it until we have reviewed your details. We may
          phone the number you gave.
        </div>
      )}

      {surgery.description && <p className="detail-text">{surgery.description}</p>}
      <p>
        <Link to="/admin/appointments" className="btn btn-brand">
          See today's appointments
        </Link>
      </p>
           <div className="detail-columns">
        <section>
          <h2>Doctors</h2>
          <p>{surgery.doctorCount} added</p>
          <Link to="/admin/doctors" className="btn btn-brand btn-sm">
            Manage doctors and hours
          </Link>
        </section>
        <section>
          <h2>Appointment types</h2>
          <p>{surgery.appointmentTypeCount} added</p>
          <Link to="/admin/appointment-types" className="btn btn-brand btn-sm">
            Manage appointment types
          </Link>
        </section>
      </div>
    </div>
  );
}

export default SurgeryDashboard;