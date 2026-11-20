import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_BASE } from "../api";

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

function BookAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [surgery, setSurgery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [typeId, setTypeId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState(null); // null means "not loaded yet"
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [time, setTime] = useState("");
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  const today = new Date();
  const lastDay = new Date();
  lastDay.setDate(lastDay.getDate() + 60);
  const minDate = toInputDate(today);
  const maxDate = toInputDate(lastDay);

  useEffect(() => {
    let ignore = false;
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

  useEffect(() => {
    setTime("");
    setSlots(null);
    if (!typeId || !doctorId || !date) return undefined;

    let ignore = false;
    setSlotsLoading(true);
    axios
      .get(`${API_BASE}/public/availability`, {
        params: { doctorId, appointmentTypeId: typeId, date },
      })
      .then((response) => {
        if (!ignore) setSlots(response.data);
      })
      .catch(() => {
        if (!ignore) {
          setSlots([]);
          toast.error("Could not load the free times. Try again.");
        }
      })
      .finally(() => {
        if (!ignore) setSlotsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [typeId, doctorId, date, refresh]);

  const handleConfirm = async () => {
    setError("");
    setBooking(true);
    try {
      await axios.post(`${API_BASE}/appointments`, {
        doctorId: Number(doctorId),
        appointmentTypeId: Number(typeId),
        date,
        time,
      });
      toast.success("Your appointment is confirmed.");
      navigate("/patient");
    } catch (err) {
      setError(err.response?.data?.message ?? "We could not book that time. Please try again.");
      setRefresh((count) => count + 1);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <Spinner animation="border" size="sm" /> Loading
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

  const chosenType = surgery.appointmentTypes.find((type) => String(type.id) === typeId);
  const chosenDoctor = surgery.doctors.find((doctor) => String(doctor.id) === doctorId);

  return (
    <div className="container py-4">
      <div className="booking-card">
        <Link to={`/surgeries/${surgery.id}`} className="back-link">
          Back to {surgery.name}
        </Link>
        <h1 className="mt-2">Book an appointment</h1>
        <p className="text-muted">
          {surgery.name}, {surgery.address}, {surgery.town}
        </p>

        <h2 className="step-heading">1. What do you need?</h2>
        <Form.Select aria-label="Appointment type" value={typeId} onChange={(event) => setTypeId(event.target.value)}>
          <option value="">Choose an appointment type</option>
          {surgery.appointmentTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} ({type.durationMinutes} min)
            </option>
          ))}
        </Form.Select>

        <h2 className="step-heading">2. Which doctor?</h2>
        <Form.Select aria-label="Doctor" value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
          <option value="">Choose a doctor</option>
          {surgery.doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.fullName}
              {doctor.speciality ? ` (${doctor.speciality})` : ""}
            </option>
          ))}
        </Form.Select>

        <h2 className="step-heading">3. Which day?</h2>
        <Form.Control
          type="date"
          aria-label="Date"
          min={minDate}
          max={maxDate}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <Form.Text className="text-muted">You can book up to 60 days ahead.</Form.Text>

        {typeId && doctorId && date && (
          <>
            <h2 className="step-heading">4. Pick a time</h2>
            {slotsLoading || slots === null ? (
              <Spinner animation="border" size="sm" />
            ) : slots.length === 0 ? (
              <p className="text-muted mb-0">
                There are no free times on {longDate(date)}. Try another day or another doctor.
              </p>
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
          </>
        )}

        {time && chosenType && chosenDoctor && (
          <div className="booking-summary">
            <h2 className="h5">Your appointment</h2>
            <p className="mb-1">
              <strong>{chosenType.name}</strong> with {chosenDoctor.fullName}
            </p>
            <p className="mb-1">
              {longDate(date)} at {time} ({chosenType.durationMinutes} minutes)
            </p>
            <p className="text-muted">
              {surgery.name}, {surgery.address}, {surgery.town}
            </p>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <Button className="btn-brand" onClick={handleConfirm} disabled={booking}>
              {booking ? "Booking" : "Confirm booking"}
            </Button>
          </div>
        )}

        {!time && error && (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookAppointment;