import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { roleHome, useAuth } from "../AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await login(email.trim(), password);
      navigate(location.state?.from ?? roleHome(data.roles), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ?? "We could not log you in. Check that the API is running and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-card">
        <h1>Log in</h1>
        <p className="text-muted">Welcome back. Log in to see your appointments.</p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3" controlId="loginEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="loginPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Form.Group>
          <Button type="submit" className="btn-brand w-100" disabled={submitting}>
            {submitting ? "Logging in" : "Log in"}
          </Button>
        </Form>

        <p className="mt-4 mb-0">
          New to Sanoro? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;