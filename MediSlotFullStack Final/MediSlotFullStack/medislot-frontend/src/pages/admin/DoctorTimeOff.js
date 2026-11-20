import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_BASE } from "../../api";

function formatDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DoctorTimeOff({ doctorId }) {
  const url = `${API_BASE}/admin/doctors/${doctorId}/time-off`;
  const today = new Date().toISOString().slice(0, 10);

  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ startDate: "", endDate: "", note: "" });
  const [problem, setProblem] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await axios.get(url);
      setPeriods(response.data);
    } catch {
      toast.error("Could not load the time off.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAdd = async (event) => {
    event.preventDefault();

    if (!form.startDate || !form.endDate) {
      setProblem("Choose a start date and an end date.");
      return;
    }
    if (form.endDate < form.startDate) {
      setProblem("The end date cannot be before the start date.");
      return;
    }

    setProblem("");
    setSaving(true);
    try {
      await axios.post(url, { startDate: form.startDate, endDate: form.endDate, note: form.note.trim() || null });
      toast.success("Time off added.");
      setForm({ startDate: "", endDate: "", note: "" });
      await load();
    } catch (err) {
      setProblem(err.response?.data?.message ?? "Could not add the time off. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (period) => {
    try {
      await axios.delete(`${url}/${period.id}`);
      toast.success("Time off removed.");
      await load();
    } catch {
      toast.error("Could not remove the time off.");
    }
  };

  return (
    <div>
      <p className="text-muted">
        Add the dates a doctor is away. Patients will not be able to book them on these days. Keep notes short, such as
        "Annual leave" or "Training", and leave out medical reasons.
      </p>

      <Form className="timeoff-form" onSubmit={handleAdd} noValidate>
        <Form.Group controlId="toStart">
          <Form.Label>From</Form.Label>
          <Form.Control type="date" name="startDate" min={today} value={form.startDate} onChange={handleChange} />
        </Form.Group>
        <Form.Group controlId="toEnd">
          <Form.Label>Until (including)</Form.Label>
          <Form.Control type="date" name="endDate" min={form.startDate || today} value={form.endDate} onChange={handleChange} />
        </Form.Group>
        <Form.Group controlId="toNote">
          <Form.Label>Note (optional)</Form.Label>
          <Form.Control name="note" value={form.note} onChange={handleChange} maxLength={100} />
        </Form.Group>
        <Button type="submit" className="btn-brand" disabled={saving}>
          {saving ? "Adding" : "Add time off"}
        </Button>
      </Form>

      {problem && (
        <div className="alert alert-danger mt-3" role="alert">
          {problem}
        </div>
      )}

      <h2 className="h5 mt-4">Coming up</h2>
      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : periods.length === 0 ? (
        <p className="text-muted">No time off is planned.</p>
      ) : (
        <ul className="plain-list">
          {periods.map((period) => (
            <li key={period.id} className="d-flex justify-content-between align-items-center gap-3">
              <span>
                <span className="fw-semibold">
                  {period.startDate === period.endDate
                    ? formatDate(period.startDate)
                    : `${formatDate(period.startDate)} to ${formatDate(period.endDate)}`}
                </span>
                {period.note && <span className="text-muted"> ({period.note})</span>}
              </span>
              <Button size="sm" variant="outline-danger" onClick={() => handleDelete(period)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DoctorTimeOff;