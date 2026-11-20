import ChildPanel from "../../ChildPanel";
import { useAuth } from "../../AuthContext";

const fields = [
  { name: "name", label: "Appointment type", required: true, maxLength: 100 },
  { name: "durationMinutes", label: "Duration in minutes", type: "number", required: true, min: 5, max: 240 },
];

const columns = [
  { key: "name", label: "Appointment type" },
  { key: "durationMinutes", label: "Duration", render: (minutes) => `${minutes} min` },
];

function AdminAppointmentTypes() {
  const { user } = useAuth();

  return (
    <div className="container py-4">
      <h1>Appointment types</h1>
      <p className="text-muted">The kinds of visit patients can book, and how long each one takes.</p>
      <ChildPanel
        surgeryId={user.surgeryId}
        endpoint="admin/appointment-types"
        singular="appointment type"
        plural="appointment types"
        fields={fields}
        columns={columns}
      />
    </div>
  );
}

export default AdminAppointmentTypes;