import { useState } from "react";
import { Button, Tab, Tabs } from "react-bootstrap";
import ChildPanel from "../../ChildPanel";
import { useAuth } from "../../AuthContext";
import DoctorHours from "./DoctorHours";
import DoctorTimeOff from "./DoctorTimeOff";

const fields = [
  { name: "fullName", label: "Full name", required: true, maxLength: 100 },
  { name: "speciality", label: "Speciality (optional)", maxLength: 100 },
];

const columns = [
  { key: "fullName", label: "Name" },
  { key: "speciality", label: "Speciality" },
];

function AdminDoctors() {
  const { user } = useAuth();
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  if (selectedDoctor) {
    return (
      <div className="container py-4">
        <Button variant="link" className="back-link px-0 mb-2" onClick={() => setSelectedDoctor(null)}>
          Back to doctors
        </Button>
        <h1>{selectedDoctor.fullName}</h1>
        {selectedDoctor.speciality && <p className="text-muted">{selectedDoctor.speciality}</p>}

        <Tabs defaultActiveKey="hours" className="mb-3">
          <Tab eventKey="hours" title="Weekly hours">
            <DoctorHours doctorId={selectedDoctor.id} />
          </Tab>
          <Tab eventKey="timeOff" title="Time off">
            <DoctorTimeOff doctorId={selectedDoctor.id} />
          </Tab>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h1>Doctors and hours</h1>
      <p className="text-muted">Add your doctors, then set when each one works and when they are away.</p>
      <ChildPanel
        surgeryId={user.surgeryId}
        endpoint="admin/doctors"
        singular="doctor"
        plural="doctors"
        fields={fields}
        columns={columns}
        extraActions={(doctor) => (
          <Button size="sm" className="btn-brand me-2" onClick={() => setSelectedDoctor(doctor)}>
            Hours and time off
          </Button>
        )}
      />
    </div>
  );
}

export default AdminDoctors;