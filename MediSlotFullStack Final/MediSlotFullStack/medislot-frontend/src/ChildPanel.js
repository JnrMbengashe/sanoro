import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";

// One reusable list for anything that belongs to a surgery (doctors, appointment types).
// It talks to api/<endpoint>?surgeryId=<id>
function ChildPanel({ surgeryId, endpoint, singular, plural, fields, columns, extraActions }) {
  const apiUrl = `http://localhost:5000/api/${endpoint}`;
  const blankForm = () => ({
    id: 0,
    surgeryId,
    ...Object.fromEntries(fields.map((field) => [field.name, ""])),
  });

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const loadItems = useCallback(async () => {
    try {
      const response = await axios.get(apiUrl, { params: { surgeryId } });
      setItems(response.data);
    } catch {
      toast.error(`Could not load the ${plural}. Check that the API is running.`);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, surgeryId, plural]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const sentence = (text) => text.charAt(0).toUpperCase() + text.slice(1);

  const openAddForm = () => {
    setForm(blankForm());
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (item) => {
    const values = Object.fromEntries(fields.map((field) => [field.name, item[field.name] ?? ""]));
    setForm({ id: item.id, surgeryId, ...values });
    setErrors({});
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = () => {
    const found = {};
    fields.forEach((field) => {
      const value = String(form[field.name]).trim();
      if (field.required && !value) {
        found[field.name] = `Enter the ${field.label.toLowerCase()}.`;
      } else if (field.type === "number" && value) {
        const number = Number(value);
        if (!Number.isInteger(number) || number < field.min || number > field.max) {
          found[field.name] = `Enter a whole number from ${field.min} to ${field.max}.`;
        }
      }
    });
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = { ...form, surgeryId };
    fields.forEach((field) => {
      if (field.type === "number") payload[field.name] = Number(payload[field.name]);
    });

    setSaving(true);
    try {
      if (form.id === 0) {
        await axios.post(apiUrl, payload);
        toast.success(`${sentence(singular)} added.`);
      } else {
        await axios.put(`${apiUrl}/${form.id}`, payload);
        toast.success(`${sentence(singular)} updated.`);
      }
      setShowForm(false);
      await loadItems();
    } catch {
      toast.error(`Could not save the ${singular}. Check the details and try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${apiUrl}/${itemToDelete.id}`);
      toast.success(`${sentence(singular)} deleted.`);
      setItemToDelete(null);
      await loadItems();
    } catch {
      toast.error(`Could not delete the ${singular}. Try again.`);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-end mb-3">
        <Button className="btn-brand" onClick={openAddForm}>
          Add {singular}
        </Button>
      </div>

      {loading ? (
        <div className="empty-state">
          <Spinner animation="border" size="sm" /> Loading
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p className="mb-2">No {plural} yet.</p>
          <Button variant="outline-secondary" onClick={openAddForm}>
            Add the first {singular}
          </Button>
        </div>
      ) : (
        <div className="table-wrap">
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  {columns.map((column) => (
                    <td key={column.key}>{column.render ? column.render(item[column.key]) : item[column.key]}</td>
                  ))}
                  <td className="text-end text-nowrap">
                                        {extraActions && extraActions(item)}
                    <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => openEditForm(item)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => setItemToDelete(item)}>
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
            <Modal.Title>{form.id === 0 ? `Add ${singular}` : `Edit ${singular}`}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {fields.map((field) => (
              <Form.Group className="mb-3" controlId={`${endpoint}-${field.name}`} key={field.name}>
                <Form.Label>{field.label}</Form.Label>
                <Form.Control
                  name={field.name}
                  type={field.type === "number" ? "number" : "text"}
                  value={form[field.name]}
                  onChange={handleChange}
                  isInvalid={!!errors[field.name]}
                  maxLength={field.maxLength}
                  min={field.min}
                  max={field.max}
                />
                <Form.Control.Feedback type="invalid">{errors[field.name]}</Form.Control.Feedback>
              </Form.Group>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" className="btn-brand" disabled={saving}>
              {saving ? "Saving" : `Save ${singular}`}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={itemToDelete !== null} onHide={() => setItemToDelete(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete {singular}</Modal.Title>
        </Modal.Header>
        <Modal.Body>This {singular} will be removed from the surgery. This cannot be undone.</Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setItemToDelete(null)}>
            Keep {singular}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete {singular}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ChildPanel;
