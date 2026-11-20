import { useEffect, useState } from "react";
import axios from "axios";
import { Button, Form, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_BASE } from "../../api";

// Monday first. The API uses 0 = Sunday ... 6 = Saturday.
const days = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

let keyCounter = 0;
const newKey = () => ++keyCounter;

function DoctorHours({ doctorId }) {
  const url = `${API_BASE}/admin/doctors/${doctorId}/schedule`;
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let ignore = false;
    axios
      .get(url)
      .then((response) => {
        if (!ignore) setBlocks(response.data.map((block) => ({ ...block, key: newKey() })));
      })
      .catch(() => toast.error("Could not load the weekly hours."))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [url]);

  const addBlock = (dayOfWeek) => {
    setBlocks((current) => [...current, { key: newKey(), dayOfWeek, startTime: "08:00", endTime: "13:00" }]);
  };

  const updateBlock = (key, field, value) => {
    setBlocks((current) => current.map((block) => (block.key === key ? { ...block, [field]: value } : block)));
  };

  const removeBlock = (key) => {
    setBlocks((current) => current.filter((block) => block.key !== key));
  };

  // Copies Monday's hours to Tuesday to Friday
  const copyMondayToWeekdays = () => {
    const monday = blocks.filter((block) => block.dayOfWeek === 1);
    const kept = blocks.filter((block) => ![2, 3, 4, 5].includes(block.dayOfWeek));
    const copies = [2, 3, 4, 5].flatMap((day) =>
      monday.map((block) => ({ key: newKey(), dayOfWeek: day, startTime: block.startTime, endTime: block.endTime }))
    );
    setBlocks([...kept, ...copies]);
  };

  const validate = () => {
    for (const day of days) {
      const dayBlocks = blocks
        .filter((block) => block.dayOfWeek === day.value)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      for (let i = 0; i < dayBlocks.length; i++) {
        const block = dayBlocks[i];
        if (!block.startTime || !block.endTime) return `${day.label}: enter a start and an end time.`;
        if (block.endTime <= block.startTime) return `${day.label}: each block must finish after it starts.`;
        if (i > 0 && block.startTime < dayBlocks[i - 1].endTime) return `${day.label}: time blocks cannot overlap.`;
      }
    }
    return "";
  };

  const handleSave = async () => {
    const message = validate();
    setProblem(message);
    if (message) return;

    setSaving(true);
    try {
      await axios.put(
        url,
        blocks.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }))
      );
      toast.success("Weekly hours saved.");
    } catch (err) {
      setProblem(err.response?.data?.message ?? "Could not save the weekly hours. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <Spinner animation="border" size="sm" /> Loading
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted">
        Add one or more blocks for each day the doctor works, for example 08:00 to 13:00 and 14:00 to 17:00. Days with
        no blocks are days off.
      </p>

      {problem && (
        <div className="alert alert-danger" role="alert">
          {problem}
        </div>
      )}

      <div className="hours-grid">
        {days.map((day) => {
          const dayBlocks = blocks.filter((block) => block.dayOfWeek === day.value);
          return (
            <div className="hours-row" key={day.value}>
              <div className="hours-day">{day.label}</div>
              <div className="hours-blocks">
                {dayBlocks.length === 0 && <span className="text-muted">Not working</span>}
                {dayBlocks.map((block) => (
                  <div className="hours-block" key={block.key}>
                    <Form.Control
                      type="time"
                      aria-label={`${day.label} start time`}
                      value={block.startTime}
                      onChange={(event) => updateBlock(block.key, "startTime", event.target.value)}
                    />
                    <span>to</span>
                    <Form.Control
                      type="time"
                      aria-label={`${day.label} end time`}
                      value={block.endTime}
                      onChange={(event) => updateBlock(block.key, "endTime", event.target.value)}
                    />
                    <Button size="sm" variant="outline-danger" onClick={() => removeBlock(block.key)}>
                      Remove
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline-secondary" onClick={() => addBlock(day.value)}>
                  Add hours
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="d-flex gap-2 flex-wrap mt-4">
        <Button className="btn-brand" onClick={handleSave} disabled={saving}>
          {saving ? "Saving" : "Save weekly hours"}
        </Button>
        <Button variant="outline-secondary" onClick={copyMondayToWeekdays}>
          Copy Monday to Tuesday to Friday
        </Button>
      </div>
    </div>
  );
}

export default DoctorHours;