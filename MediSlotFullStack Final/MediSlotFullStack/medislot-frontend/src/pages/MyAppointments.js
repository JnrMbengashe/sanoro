import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Badge, Button, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_BASE } from "../api";

function formatWhen(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const clock = (value) => value.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
  return {
    day: start.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    time: `${clock(start)} to ${clock(end)}`,
  };
}

const statusStyle = {
  Booked: "success",
  Cancelled: "secondary",
  Completed: "info",
  NoShow: "warning",
};

function AppointmentCard({ appointment, onCancel }) {
  const when = formatWhen(appointment.startTime, appointment.endTime);

  return (
    <article className="appointment-card">
      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
        <div>
          <h3 className="h5 mb-1">{when.day}</h3>
          <p className="mb-2 fw-semibold">{when.time}</p>
        </div>
        <Badge bg={statusStyle[appointment.status] ?? "secondary"}>
          {appointment.status === "NoShow" ? "Missed" : appointment.status}
        </Badge>
      </div>
      <p className="mb-1">
        {appointment.appointmentType} with {appointment.doctorName}
      </p>
      <p className="text-muted mb-2">
        {appointment.surgeryName}, {appointment.surgeryAddress}, {appointment.surgeryTown}. {appointment.surgeryPhone}
      </p>
      {appointment.canCancel && (
        <Button size="sm" variant="outline-danger" onClick={() => onCancel(appointment)}>
          Cancel appointment
        </Button>
      )}
    </article>
  );
}

function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toCancel, setToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/appointments/mine`);
      setAppointments(response.data);
    } catch {
      toast.error("Could not load your appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await axios.post(`${API_BASE}/appointments/${toCancel.id}/cancel`);
      toast.success("Your appointment has been cancelled.");
      setToCancel(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Could not cancel the appointment.");
    } finally {
      setCancelling(false);
    }
  };

  const now = new Date();
  const upcoming = appointments
    .filter((item) => item.status === "Booked" && new Date(item.startTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const earlier = appointments.filter((item) => !upcoming.includes(item));

  return (
    <div className="container py-4">
      <div className="page-head">
        <div>
          <h1>My appointments</h1>
          <p className="text-muted mb-0">Your bookings across all surgeries.</p>
        </div>
        <Link to="/surgeries" className="btn btn-brand">
          Book an appointment
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">
          <Spinner animation="border" size="sm" /> Loading
        </div>
      ) : (
        <>
          <h2 className="h4 mt-2">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="empty-state">
              <p className="mb-2">You have no upcoming appointments.</p>
              <Link to="/surgeries">Find a surgery</Link>
            </div>
          ) : (
            upcoming.map((item) => <AppointmentCard key={item.id} appointment={item} onCancel={setToCancel} />)
          )}

          {earlier.length > 0 && (
            <>
              <h2 className="h4 mt-4">Earlier and cancelled</h2>
              {earlier.map((item) => (
                <AppointmentCard key={item.id} appointment={item} onCancel={setToCancel} />
              ))}
            </>
          )}
        </>
      )}

      <Modal show={toCancel !== null} onHide={() => setToCancel(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {toCancel && (
            <>
              Cancel your {toCancel.appointmentType} with {toCancel.doctorName} on{" "}
              {formatWhen(toCancel.startTime, toCancel.endTime).day}? The time will become free for other patients.
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setToCancel(null)}>
            Keep appointment
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling" : "Cancel appointment"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default MyAppointments;