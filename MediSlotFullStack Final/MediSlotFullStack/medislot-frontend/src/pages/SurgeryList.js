import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { API_BASE } from "../api";

function SurgeryList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [input, setInput] = useState(search);
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    axios
      .get(`${API_BASE}/public/surgeries`, { params: { search } })
      .then((response) => {
        if (!ignore) setSurgeries(response.data);
      })
      .catch(() => toast.error("Could not load surgeries. Check that the API is running."))
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [search]);

  const handleSearch = (event) => {
    event.preventDefault();
    const term = input.trim();
    setSearchParams(term ? { search: term } : {});
  };

  return (
    <div className="container py-4">
      <h1>Find a surgery</h1>
      <form className="list-search" onSubmit={handleSearch}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Search by town or surgery name"
          aria-label="Search by town or surgery name"
        />
        <button type="submit" className="btn btn-brand">
          Search
        </button>
      </form>

      {loading ? (
        <div className="empty-state">
          <Spinner animation="border" size="sm" /> Loading surgeries
        </div>
      ) : surgeries.length === 0 ? (
        <div className="empty-state">
          <p className="mb-0">No surgeries match your search. Try a different town or name.</p>
        </div>
      ) : (
        <div className="surgery-grid">
          {surgeries.map((surgery) => (
            <article className="surgery-card" key={surgery.id}>
              <h2>{surgery.name}</h2>
              <p className="mb-1">
                {surgery.address}, {surgery.town}
              </p>
              <p className="text-muted mb-3">
                {surgery.phoneNumber}. {surgery.doctorCount} {surgery.doctorCount === 1 ? "doctor" : "doctors"}.
              </p>
              <Link to={`/surgeries/${surgery.id}`} className="btn btn-brand btn-sm">
                View surgery
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default SurgeryList;