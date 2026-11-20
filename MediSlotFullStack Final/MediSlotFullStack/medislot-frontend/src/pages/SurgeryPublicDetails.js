import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { API_BASE } from "../api";
import { useAuth } from "../AuthContext";
  

function SurgeryPublicDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [surgery, setSurgery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    axios
      .get(`${API_BASE}/public/surgeries/${id}`)
      .then((response) => {
        if (!ignore) setSurgery(response.data);
      })
      .catch(() => {
        if (!ignore) setNotFound(true);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container py-4">
        <Spinner animation="border" size="sm" /> Loading surgery
      </div>
    );
  }

  if (notFound || !surgery) {
    return (
      <div className="container py-4">
        <h1>Surgery not found</h1>
        <p>This surgery does not exist or is not open for bookings yet.</p>
        <Link to="/surgeries">Back to all surgeries</Link>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <Link to="/surgeries" className="back-link">
        Back to all surgeries
      </Link>
      <h1 className="mt-2">{surgery.name}</h1>
      <p className="text-muted">
        {surgery.address}, {surgery.town}. {surgery.phoneNumber}
      </p>
      {surgery.description && <p className="detail-text">{surgery.description}</p>}

      <div className="detail-columns">
        <section>
          <h2>Doctors</h2>
          {surgery.doctors.length === 0 ? (
            <p className="text-muted">This surgery has not added its doctors yet.</p>
          ) : (
            <ul className="plain-list">
              {surgery.doctors.map((doctor) => (
                <li key={doctor.id}>
                  <span className="fw-semibold">{doctor.fullName}</span>
                  {doctor.speciality && <span className="text-muted"> ({doctor.speciality})</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>Appointment types</h2>
          {surgery.appointmentTypes.length === 0 ? (
            <p className="text-muted">This surgery has not added its appointment types yet.</p>
          ) : (
            <ul className="plain-list">
              {surgery.appointmentTypes.map((type) => (
                <li key={type.id}>
                  <span className="fw-semibold">{type.name}</span>
                  <span className="text-muted"> ({type.durationMinutes} min)</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

            {surgery.doctors.length === 0 || surgery.appointmentTypes.length === 0 ? (
        <p className="text-muted mt-4">
          This surgery is still setting up online booking. Please phone {surgery.phoneNumber}.
        </p>
      ) : user && !user.roles.includes("Patient") ? (
        <p className="text-muted mt-4">Booking is available to patient accounts.</p>
      ) : (
        <Link to={`/surgeries/${surgery.id}/book`} className="btn btn-brand mt-4">
          {user ? "Book an appointment" : "Log in to book"}
        </Link>
      )}
    </div>
  );
}

export default SurgeryPublicDetails;