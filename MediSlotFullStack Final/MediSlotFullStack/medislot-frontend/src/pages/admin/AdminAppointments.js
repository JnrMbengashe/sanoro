import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Badge, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_BASE } from "../../api";
import WalkInBooking from "./WalkInBooking";

function toInputDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function longDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function clock(value) {
  return new Date(value).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", hour12: false });
}

const statusLabel = { Booked: "Booked", Completed: "Completed", NoShow: "Missed", Cancelled: "Cancelled" };
const statusStyle = { Booked: "success", Completed: "info", NoShow: "warning", Cancelled: "secondary" };

function AdminAppointments() {
  const [date, setDate] = useState(toInputDate(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [types, setTypes] = useState([]);
  const [doctorFilter, setDoctorFilter] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const [showWalkIn, setShowWalkIn] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/appointments`, { params: { date } });
      setAppointments(response.data);
    } catch {
      toast.error("Could not load the appointments.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([axios.get(`${API_BASE}/admin/doctors`), axios.get(`${API_BASE}/admin/appointment-types`)])
      .then(([doctorResponse, typeResponse]) => {
        setDoctors(doctorResponse.data);
        setTypes(typeResponse.data);
      })
      .catch(() => toast.error("Could not load your doctors and appointment types."));
  }, []);

  const shiftDay = (delta) => {
    const next = new Date(`${date}T00:00:00`);
    next.setDate(next.getDate() + delta);
    setDate(toInputDate(next));
  };

  const setStatus = async (appointment, status, successMessage) => {
    setBusyId(appointment.id);
    try {
      await axios.post(`${API_BASE}/admin/appointments/${appointment.id}/status`, { status });
      toast.success(successMessage);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Could not update the appointment.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmCancel = async () => {
    await setStatus(toCancel, "Cancelled", "Appointment cancelled.");
    setToCancel(null);
  };

  const shown = doctorFilter
    ? appointments.filter((item) => String(item.doctorId) === doctorFilter)
    : appointments;

  const count = (status) => shown.filter((item) => item.status === status).length;
  const now = new Date();

  return (
    <div className="container py-4">
      <div className="page-head">
        <div>
          <h1>Appointments</h1>
          <p className="text-muted mb-0">See who is coming in and manage each visit.</p>
        </div>
        <Button className="btn-brand" onClick={() => setShowWalkIn(true)}>
          Add walk-in or phone booking
        </Button>
      </div>

      <div className="day-nav">
        <Button variant="outline-secondary" onClick={() => shiftDay(-1)}>
          Previous day
        </Button>
        <Form.Control
          type="date"
          aria-label="Date"
          value={date}
          onChange={(event) => event.target.value && setDate(event.target.value)}
        />
        <Button variant="outline-secondary" onClick={() => shiftDay(1)}>
          Next day
        </Button>
        <Button variant="link" className="back-link" onClick={() => setDate(toInputDate(new Date()))}>
          Today
        </Button>
        <Form.Select
          aria-label="Filter by doctor"
          className="day-filter"
          value={doctorFilter}
          onChange={(event) => setDoctorFilter(event.target.value)}
        >
          <option value="">All doctors</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.fullName}
            </option>
          ))}
        </Form.Select>
      </div>

      <h2 className="day-title">{longDate(date)}</h2>

      <div className="day-stats">
        <div className="stat">
          <span className="stat-number">{count("Booked")}</span> booked
        </div>
        <div className="stat">
          <span className="stat-number">{count("Completed")}</span> completed
        </div>
        <div className="stat">
          <span className="stat-number">{count("NoShow")}</span> missed
        </div>
        <div className="stat">
          <span className="stat-number">{count("Cancelled")}</span> cancelled
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <Spinner animation="border" size="sm" /> Loading
        </div>
      ) : shown.length === 0 ? (
        <div className="empty-state">
          <p className="mb-2">No appointments on this day.</p>
          <Button variant="outline-secondary" onClick={() => setShowWalkIn(true)}>
            Add a booking
          </Button>
        </div>
      ) : (
        <div className="table-wrap">
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((item) => {
                const started = new Date(item.startTime) <= now;
                return (
                  <tr key={item.id}>
                    <td className="text-nowrap fw-semibold">
                      {clock(item.startTime)} to {clock(item.endTime)}
                    </td>
                    <td>
                      <div>{item.patientName}</div>
                      <div className="small text-muted">
                        {item.patientPhone ? <a href={`tel:${item.patientPhone}`}>{item.patientPhone}</a> : "No phone number"}
                        {item.isWalkIn && " (booked by the surgery)"}
                      </div>
                    </td>
                    <td>{item.doctorName}</td>
                    <td>{item.appointmentType}</td>
                    <td>
                      <Badge bg={statusStyle[item.status] ?? "secondary"}>{statusLabel[item.status] ?? item.status}</Badge>
                    </td>
                    <td className="text-end text-nowrap">
                      {item.status === "Booked" &&
                        (started ? (
                          <>
                            <Button
                              size="sm"
                              className="btn-brand me-2"
                              disabled={busyId === item.id}
                              onClick={() => setStatus(item, "Completed", "Marked as completed.")}
                            >
                              Completed
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              disabled={busyId === item.id}
                              onClick={() => setStatus(item, "NoShow", "Marked as missed.")}
                            >
                              Missed
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            disabled={busyId === item.id}
                            onClick={() => setToCancel(item)}
                          >
                            Cancel
                          </Button>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={toCancel !== null} onHide={() => setToCancel(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {toCancel && (
            <>
              <p>
                Cancel {toCancel.patientName}'s {toCancel.appointmentType} with {toCancel.doctorName} at{" "}
                {clock(toCancel.startTime)}?
              </p>
              <p className="text-muted mb-0">
                The patient will see it as cancelled in their account, but they are not messaged automatically yet. Please
                phone them to let them know.
              </p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setToCancel(null)}>
            Keep appointment
          </Button>
          <Button variant="danger" onClick={confirmCancel}>
            Cancel appointment
          </Button>
        </Modal.Footer>
      </Modal>

      <WalkInBooking
        show={showWalkIn}
        onHide={() => setShowWalkIn(false)}
        doctors={doctors}
        types={types}
        defaultDate={date}
        onBooked={load}
      />
    </div>
  );
}

export default AdminAppointments;