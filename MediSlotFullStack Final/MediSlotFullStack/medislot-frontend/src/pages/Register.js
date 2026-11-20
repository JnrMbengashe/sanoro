import { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { roleHome, useAuth } from "../AuthContext";

function readErrors(err) {
  const data = err.response?.data;
  if (!data) return ["We could not reach the server. Check that the API is running."];
  if (Array.isArray(data.errors)) return data.errors;
  if (data.errors && typeof data.errors === "object") return Object.values(data.errors).flat();
  return [data.message ?? "Something went wrong. Please try again."];
}

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    acceptedPrivacyPolicy: false,
  });
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = [];
    if (!form.fullName.trim()) found.push("Enter your full name.");
    if (!form.email.trim()) found.push("Enter your email address.");
    if (form.password.length < 8) found.push("Your password must have at least 8 characters.");
    if (form.password !== form.confirmPassword) found.push("The two passwords do not match.");
    if (!form.acceptedPrivacyPolicy) found.push("Please accept the privacy policy to continue.");
    setErrors(found);
    if (found.length > 0) return;

    setSubmitting(true);
    try {
      const data = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        password: form.password,
        acceptedPrivacyPolicy: form.acceptedPrivacyPolicy,
      });
      navigate(roleHome(data.roles), { replace: true });
    } catch (err) {
      setErrors(readErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="text-muted">One account lets you book at any surgery on Sanoro.</p>

        {errors.length > 0 && (
          <div className="alert alert-danger" role="alert">
            <ul className="mb-0 ps-3">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3" controlId="regName">
            <Form.Label>Full name</Form.Label>
            <Form.Control name="fullName" autoComplete="name" value={form.fullName} onChange={handleChange} maxLength={100} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="regEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" name="email" autoComplete="email" value={form.email} onChange={handleChange} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="regPhone">
            <Form.Label>Phone number (optional)</Form.Label>
            <Form.Control name="phoneNumber" autoComplete="tel" value={form.phoneNumber} onChange={handleChange} maxLength={20} />
          </Form.Group>
          <Form.Group className="mb-3" controlId="regPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" name="password" autoComplete="new-password" value={form.password} onChange={handleChange} />
            <Form.Text className="text-muted">
              At least 8 characters, with an uppercase letter, a lowercase letter and a number.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="regConfirm">
            <Form.Label>Confirm password</Form.Label>
            <Form.Control type="password" name="confirmPassword" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} />
          </Form.Group>
          <Form.Check
            className="mb-4"
            type="checkbox"
            id="regConsent"
            name="acceptedPrivacyPolicy"
            checked={form.acceptedPrivacyPolicy}
            onChange={handleChange}
            label={
              <>
                I have read and accept the{" "}
                <Link to="/privacy" target="_blank" rel="noreferrer">
                  privacy policy
                </Link>
              </>
            }
          />
          <Button type="submit" className="btn-brand w-100" disabled={submitting}>
            {submitting ? "Creating account" : "Create account"}
          </Button>
        </Form>

        <p className="mt-4 mb-0">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;