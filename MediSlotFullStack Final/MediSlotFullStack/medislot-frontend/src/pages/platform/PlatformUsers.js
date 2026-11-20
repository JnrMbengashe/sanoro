import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Badge, Button, Form, Modal, Spinner, Table } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_BASE } from "../../api";

const roleLabel = { Patient: "Patient", SurgeryAdmin: "Surgery admin", PlatformAdmin: "Platform admin" };

function PlatformUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [toDisable, setToDisable] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/platform/users`, { params: { search } });
      setUsers(response.data);
    } catch {
      toast.error("Could not load the users.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearch(input.trim());
  };

  const disable = async () => {
    try {
      await axios.post(`${API_BASE}/platform/users/${toDisable.id}/disable`);
      toast.success("Account disabled.");
      setToDisable(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Could not disable the account.");
    }
  };

  const enable = async (user) => {
    try {
      await axios.post(`${API_BASE}/platform/users/${user.id}/enable`);
      toast.success("Account enabled.");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Could not enable the account.");
    }
  };

  return (
    <div className="container py-4">
      <h1>Users</h1>
      <p className="text-muted">Patients, surgery accounts and platform admins. The first 100 matches are shown.</p>

      <form className="list-search" onSubmit={handleSearch}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search by name or email"
          aria-label="Search by name or email"
        />
        <button type="submit" className="btn btn-brand">
          Search
        </button>
      </form>

      {loading ? (
        <div className="empty-state">
          <Spinner animation="border" size="sm" /> Loading
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p className="mb-0">No users match your search.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <Table hover responsive className="align-middle mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Surgery</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="fw-semibold">{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{roleLabel[user.role] ?? user.role}</td>
                  <td>{user.surgeryName ?? ""}</td>
                  <td>
                    {user.isDisabled ? <Badge bg="danger">Disabled</Badge> : <Badge bg="success">Active</Badge>}
                  </td>
                  <td className="text-end text-nowrap">
                    {user.role !== "PlatformAdmin" &&
                      (user.isDisabled ? (
                        <Button size="sm" variant="outline-secondary" onClick={() => enable(user)}>
                          Enable
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline-danger" onClick={() => setToDisable(user)}>
                          Disable
                        </Button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Modal show={toDisable !== null} onHide={() => setToDisable(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Disable account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Disable the account of <strong>{toDisable?.fullName}</strong>? They will not be able to log in. Their bookings
          are kept. You can enable the account again later. If they are logged in right now, they can keep using the site
          for up to an hour.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setToDisable(null)}>
            Keep active
          </Button>
          <Button variant="danger" onClick={disable}>
            Disable account
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PlatformUsers;