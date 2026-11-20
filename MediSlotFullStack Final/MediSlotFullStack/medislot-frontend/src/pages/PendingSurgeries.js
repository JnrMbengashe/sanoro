import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Button, Modal, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_BASE } from "../api";

function PendingSurgeries() {
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toReject, setToReject] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/platform/pending-surgeries`);
      setSurgeries(response.data);
    } catch {
      toast.error("Could not load the pending surgeries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (surgery) => {
    setBusyId(surgery.id);
    try {
      await axios.post(`${API_BASE}/platform/surgeries/${surgery.id}/approve`);
      toast.success(`${surgery.name} is now live.`);
      await load();
    } catch {
      toast.error("Could not approve the surgery.");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async () => {
    const surgery = toReject;
    setBusyId(surgery.id);
    try {
      await axios.post(`${API_BASE}/platform/surgeries/${surgery.id}/reject`);
      toast.success("Surgery rejected and removed.");
      setToReject(null);
      await load();
    } catch {
      toast.error("Could not reject the surgery.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container py-4">
      <h1>Surgeries waiting for approval</h1>
      <p className="text-muted">Check each surgery before approving it, for example by phoning the number it gave.</p>

      {loading ? (
        <div className="empty-state">
          <Spinner animation="border" size="sm" /> Loading
        </div>
      ) : surgeries.length === 0 ? (
        <div className="empty-state">
          <p className="mb-0">No surgeries are waiting for approval.</p>
        </div>
      ) : (
        surgeries.map((surgery) => (
          <article className="approval-card" key={surgery.id}>
            <h2 className="h5">{surgery.name}</h2>
            <p className="mb-1">
              {surgery.address}, {surgery.town}
            </p>
            <p className="mb-1">Surgery phone: {surgery.phoneNumber}</p>
            <p className="mb-1">
              Registered by {surgery.adminName} ({surgery.adminEmail})
            </p>
            {surgery.description && <p className="text-muted mb-1">{surgery.description}</p>}
            <div className="approval-actions mt-3">
              <Button className="btn-brand" disabled={busyId === surgery.id} onClick={() => approve(surgery)}>
                Approve
              </Button>
              <Button variant="outline-danger" disabled={busyId === surgery.id} onClick={() => setToReject(surgery)}>
                Reject
              </Button>
            </div>
          </article>
        ))
      )}

      <Modal show={toReject !== null} onHide={() => setToReject(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reject surgery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Reject <strong>{toReject?.name}</strong>? The surgery and its account will be permanently removed.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setToReject(null)}>
            Keep for now
          </Button>
          <Button variant="danger" onClick={reject}>
            Reject and remove
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PendingSurgeries;