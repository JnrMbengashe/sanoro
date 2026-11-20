import { Button, Tab, Tabs } from "react-bootstrap";
import ChildPanel from "./ChildPanel";

const doctorFields = [
  { name: "fullName", label: "Full name", required: true, maxLength: 100 },
  { name: "speciality", label: "Speciality (optional)", maxLength: 100 },
];
const doctorColumns = [
  { key: "fullName", label: "Name" },
  { key: "speciality", label: "Speciality" },
];

const appointmentTypeFields = [
  { name: "name", label: "Appointment type", required: true, maxLength: 100 },
  { name: "durationMinutes", label: "Duration in minutes", type: "number", required: true, min: 5, max: 240 },
];
const appointmentTypeColumns = [
  { key: "name", label: "Appointment type" },
  { key: "durationMinutes", label: "Duration", render: (minutes) => `${minutes} min` },
];

function SurgeryDetails({ surgery, onBack }) {
  return (
    <section>
      <Button variant="link" className="back-link px-0 mb-2" onClick={onBack}>
        Back to surgeries
      </Button>
      <div className="page-head">
        <div>
          <h1>{surgery.name}</h1>
          <p className="text-muted mb-0">
            {surgery.address}, {surgery.town}
          </p>
        </div>
      </div>

      <Tabs defaultActiveKey="doctors" className="mb-3">
        <Tab eventKey="doctors" title="Doctors">
          <ChildPanel
            surgeryId={surgery.id}
            endpoint="Doctors"
            singular="doctor"
            plural="doctors"
            fields={doctorFields}
            columns={doctorColumns}
          />
        </Tab>
        <Tab eventKey="appointmentTypes" title="Appointment types">
          <ChildPanel
            surgeryId={surgery.id}
            endpoint="AppointmentTypes"
            singular="appointment type"
            plural="appointment types"
            fields={appointmentTypeFields}
            columns={appointmentTypeColumns}
          />
        </Tab>
      </Tabs>
    </section>
  );
}

export default SurgeryDetails;
