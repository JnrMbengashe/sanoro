import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_BASE } from "../../api";

function toInputDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function WalkInBooking({ show, onHide, doctors, types, defaultDate, onBooked }) {
  const [typeId, setTypeId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [slots, setSlots] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Start fresh every time the window opens
  useEffect(() => {
    if (show) {
      setTypeId("");
      setDoctorId("");
      setDate(defaultDate);
      setSlots(null);
      setTime("");
      setGuestName("");
      setGuestPhone("");
      setError("");
    }
  }, [show, defaultDate]);

  useEffect(() => {
    setTime("");
    setSlots(null);
    if (!show || !typeId || !doctorId || !date) return undefined;

    let ignore = false;
    setSlotsLoading(true);
    axios
      .get(`${API_BASE}/admin/appointments/availability`, {
        params: { doctorId, appointmentTypeId: typeId, date },
      })
      .then((response) => {
        if (!ignore) setSlots(response.data);
      })
      .catch(() => {
        if (!ignore) {
          setSlots([]);
          toast.error("Could not load the free times.");
        }
      })
      .finally(() => {
        if (!ignore) setSlotsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [show, typeId, doctorId, date, refresh]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!guestName.trim()) {
      setError("Enter the person's name.");
      return;
    }
    if (guestPhone.trim() && !/^[0-9+()\s-]{7,20}$/.test(guestPhone.trim())) {
      setError("Enter a phone number with 7 to 20 digits, or leave it empty.");
      return;
    }
    if (!time) {
      setError("Choose a time.");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_BASE}/admin/appointments`, {
        doctorId: Number(doctorId),
        appointmentTypeId: Number(typeId),
        date,
        time,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || null,
      });
      toast.success("Booking added.");
      onBooked();
      onHide();
    } catch (err) {
      setError(err.response?.data?.message ?? "Could not add the booking. Try again.");
      setRefresh((count) => count + 1);
    } finally {
      setSaving(false);
    }
  };

  const missingSetup = doctors.length === 0 || types.length === 0;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Header closeButton>
          <Modal.Title>Walk-in or phone booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {missingSetup ? (
            <p className="mb-0">Add at least one doctor and one appointment type first, then you can book here.</p>
          ) : (
            <>
              <Form.Group className="mb-3" controlId="wiType">
                <Form.Label>Appointment type</Form.Label>
                <Form.Select value={typeId} onChange={(event) => setTypeId(event.target.value)}>
                  <option value="">Choose a type</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.durationMinutes} min)
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="wiDoctor">
                <Form.Label>Doctor</Form.Label>
                <Form.Select value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
                  <option value="">Choose a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3" controlId="wiDate">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  min={toInputDate(new Date())}
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Form.Group>

              {typeId && doctorId && date && (
                <div className="mb-3">
                  <div className="form-label">Free times</div>
                  {slotsLoading || slots === null ? (
                    <Spinner animation="border" size="sm" />
                  ) : slots.length === 0 ? (
                    <p className="text-muted mb-0">No free times on this day. Try another day or doctor.</p>
                  ) : (
                    <div className="slot-grid" role="group" aria-label="Free times">
                      {slots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          className={`slot-button${time === slot ? " selected" : ""}`}
                          aria-pressed={time === slot}
                          onClick={() => setTime(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Form.Group className="mb-3" controlId="wiName">
                <Form.Label>Person's name</Form.Label>
                <Form.Control value={guestName} onChange={(event) => setGuestName(event.target.value)} maxLength={100} />
              </Form.Group>

              <Form.Group className="mb-3" controlId="wiPhone">
                <Form.Label>Phone number (optional)</Form.Label>
                <Form.Control value={guestPhone} onChange={(event) => setGuestPhone(event.target.value)} maxLength={20} />
              </Form.Group>

              {error && (
                <div className="alert alert-danger mb-0" role="alert">
                  {error}
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>
            Cancel
          </Button>
          {!missingSetup && (
            <Button type="submit" className="btn-brand" disabled={saving}>
              {saving ? "Saving" : "Add booking"}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default WalkInBooking;