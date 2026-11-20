import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Badge, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";

// Must match the port in MediSlot/Properties/launchSettings.json
const API_URL = "http://localhost:5000/api/Surgeries";

const emptySurgery = {
  id: 0,
  name: "",
  town: "",
  address: "",
  phoneNumber: "",
  description: "",
  isApproved: false,
};

function SurgeryCrud({ onManage }) {
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptySurgery);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [surgeryToDelete, setSurgeryToDelete] = useState(null);

  const loadSurgeries = useCallback(async () => {
    try {
      const response = await axios.get(API_URL);
      setSurgeries(response.data);
    } catch {
      toast.error("Could not load surgeries. Check that the API is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurgeries();
  }, [loadSurgeries]);

  const openAddForm = () => {
    setForm(emptySurgery);
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (surgery) => {
    setForm({ ...emptySurgery, ...surgery, description: surgery.description ?? "" });
    setErrors({});
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const found = {};
    if (!form.name.trim()) found.name = "Enter the surgery name.";
    if (!form.town.trim()) found.town = "Enter the town.";
    if (!form.address.trim()) found.address = "Enter the street address.";
    if (!/^[0-9+()\s-]{7,20}$/.test(form.phoneNumber.trim())) {
      found.phoneNumber = "Enter a phone number with 7 to 20 digits.";
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (form.id === 0) {
        await axios.post(API_URL, form);
        toast.success("Surgery added.");
      } else {
        await axios.put(`${API_URL}/${form.id}`, form);
        toast.success("Surgery updated.");
      }
      setShowForm(false);
      await loadSurgeries();
    } catch {
      toast.error("Could not save the surgery. Check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/${surgeryToDelete.id}`);
      toast.success("Surgery deleted.");
      setSurgeryToDelete(null);
      await loadSurgeries();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Could not delete the surgery. Try again.");
    }
  };

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Surgeries</h1>
          <p className="text-muted mb-0">Manage the surgeries patients can book with.</p>
        </div>
        <Button className="btn-brand" onClick={openAddForm}>
          Add surgery
        </Button>
      </div>

      {loading ? (
        <div className="empty-state">
          <Spinner animation="border" size="sm" /> Loading surgeries
        </div>
      ) : surgeries.length === 0 ? (
        <div className="empty-state">
          <p className="mb-2">No surgeries yet.</p>
          <Button variant="outline-secondary" onClick={openAddForm}>
            Add the first surgery
          </Button>
        </div>
      ) : (
        <div className="table-wrap">
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Town</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {surgeries.map((surgery) => (
                <tr key={surgery.id}>
                  <td className="fw-semibold">{surgery.name}</td>
                  <td>{surgery.town}</td>
                  <td>{surgery.address}</td>
                  <td>{surgery.phoneNumber}</td>
                  <td>
                    {surgery.isApproved ? (
                      <Badge bg="success">Approved</Badge>
                    ) : (
                      <Badge bg="secondary">Pending approval</Badge>
                    )}
                  </td>
                  <td className="text-end text-nowrap">
                    <Button size="sm" className="btn-brand me-2" onClick={() => onManage(surgery)}>
                      Doctors and services
                    </Button>
                    <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => openEditForm(surgery)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => setSurgeryToDelete(surgery)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Form onSubmit={handleSave} noValidate>
          <Modal.Header closeButton>
            <Modal.Title>{form.id === 0 ? "Add surgery" : "Edit surgery"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="surgeryName">
              <Form.Label>Surgery name</Form.Label>
              <Form.Control name="name" value={form.name} onChange={handleChange} isInvalid={!!errors.name} maxLength={100} />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="surgeryTown">
              <Form.Label>Town</Form.Label>
              <Form.Control name="town" value={form.town} onChange={handleChange} isInvalid={!!errors.town} maxLength={100} />
              <Form.Control.Feedback type="invalid">{errors.town}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="surgeryAddress">
              <Form.Label>Street address</Form.Label>
              <Form.Control name="address" value={form.address} onChange={handleChange} isInvalid={!!errors.address} maxLength={200} />
              <Form.Control.Feedback type="invalid">{errors.address}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="surgeryPhone">
              <Form.Label>Phone number</Form.Label>
              <Form.Control name="phoneNumber" value={form.phoneNumber} onChange={handleChange} isInvalid={!!errors.phoneNumber} maxLength={20} />
              <Form.Control.Feedback type="invalid">{errors.phoneNumber}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="surgeryDescription">
              <Form.Label>Description (optional)</Form.Label>
              <Form.Control as="textarea" rows={3} name="description" value={form.description} onChange={handleChange} maxLength={500} />
            </Form.Group>
            <Form.Check
              type="switch"
              id="surgeryApproved"
              name="isApproved"
              label="Approved to appear for patients"
              checked={form.isApproved}
              onChange={handleChange}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-brand" disabled={saving}>
              {saving ? "Saving" : "Save surgery"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={surgeryToDelete !== null} onHide={() => setSurgeryToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete surgery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Delete <strong>{surgeryToDelete?.name}</strong>? This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setSurgeryToDelete(null)}>
            Keep surgery
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete surgery
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}

export default SurgeryCrud;
