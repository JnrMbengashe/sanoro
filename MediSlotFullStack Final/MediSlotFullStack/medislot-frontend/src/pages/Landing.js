import { useEffect, useState } from "react";
import axios from "axios";
import { Accordion } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import HeroSlideshow from "../components/HeroSlideshow";
import { API_BASE } from "../api";

const steps = [
  { title: "Choose a surgery", text: "Browse the surgeries in your town and see their doctors and services." },
  { title: "Pick a time", text: "Select a doctor and a free time that suits you." },
  { title: "Get confirmed", text: "Your appointment is confirmed straight away and saved to your account." },
];

const benefits = [
  { title: "See free times instantly", text: "Every time you see is genuinely free, so there is no waiting on hold to find out." },
  { title: "One account, every surgery", text: "Sign up once and book at any surgery on Sanoro." },
  { title: "Manage it yourself", text: "See your bookings in one place and cancel in a tap if your plans change." },
  { title: "Plans you can count on", text: "Surgeries are reviewed before they appear, and doctors' leave is blocked out automatically." },
];

const questions = [
  {
    question: "Do I need an account to book?",
    answer: "Yes. A free account lets you see your appointments and cancel them. You can create one in a minute.",
  },
  {
    question: "How far ahead can I book?",
    answer: "Up to 60 days ahead. Bookings need at least an hour's notice, so for something urgent please phone the surgery.",
  },
  {
    question: "How do I cancel or change an appointment?",
    answer:
      "Log in and open My appointments. Cancel the booking there, then book a new time. Cancelling quickly frees the time for another patient.",
  },
  {
    question: "What if I cannot use the website?",
    answer: "Every surgery page shows its phone number, so you can always book by phoning the surgery directly.",
  },
  {
    question: "What happens to my information?",
    answer:
      "We keep only what is needed to manage your bookings. We do not store medical records or notes. Read the privacy policy for the details.",
  },
];

function Landing() {
  const [search, setSearch] = useState("");
  const [surgeries, setSurgeries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    axios
      .get(`${API_BASE}/public/surgeries`)
      .then((response) => {
        if (!ignore) setSurgeries(response.data.slice(0, 3));
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const term = search.trim();
    navigate(term ? `/surgeries?search=${encodeURIComponent(term)}` : "/surgeries");
  };

  return (
    <>
      <section className="home-hero">
        <HeroSlideshow />
        <div className="home-hero-content container">
          <p className="home-tagline">Ixesha lakho. Impilo yethu.</p>
          <h1>Book your doctor&apos;s appointment without the queue</h1>
          <p className="home-hero-text">
            Find a surgery in your town, see its doctors and free times, and book in a few taps.
          </p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by town or surgery name"
              aria-label="Search by town or surgery name"
            />
            <button type="submit" className="btn btn-light">
              Find a surgery
            </button>
          </form>
          <p className="hero-note">
            Run a surgery? <Link to="/register-surgery">Register it on Sanoro</Link>
          </p>
        </div>
      </section>

      <section className="container home-section">
        <h2>How booking works</h2>
        <ol className="steps">
          {steps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p className="mb-0">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section home-section-tint">
        <div className="container">
          <h2>Why patients use Sanoro</h2>
          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <div className="benefit" key={benefit.title}>
                <h3>{benefit.title}</h3>
                <p className="mb-0">{benefit.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {surgeries.length > 0 && (
        <section className="container home-section">
          <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-3">
            <h2 className="mb-0">Surgeries on Sanoro</h2>
            <Link to="/surgeries">See all surgeries</Link>
          </div>
          <div className="surgery-grid">
            {surgeries.map((surgery) => (
              <article className="surgery-card" key={surgery.id}>
                <h3 className="h5">{surgery.name}</h3>
                <p className="mb-1">
                  {surgery.address}, {surgery.town}
                </p>
                <p className="text-muted mb-3">
                  {surgery.doctorCount} {surgery.doctorCount === 1 ? "doctor" : "doctors"}
                </p>
                <Link to={`/surgeries/${surgery.id}`} className="btn btn-brand btn-sm">
                  View surgery
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="surgery-band">
        <div className="container band-inner">
          <div>
            <h2>Run a surgery?</h2>
            <p className="mb-0">
              Put your surgery on Sanoro and let patients book online. See each day&apos;s appointments at a glance, set your
              doctors&apos; hours and leave, and add walk-in or phone bookings yourself.
            </p>
          </div>
          <Link to="/register-surgery" className="btn btn-light btn-lg">
            Register your surgery
          </Link>
        </div>
      </section>

      <section className="container home-section faq">
        <h2>Questions people ask</h2>
        <Accordion>
          {questions.map((item, index) => (
            <Accordion.Item eventKey={String(index)} key={item.question}>
              <Accordion.Header>{item.question}</Accordion.Header>
              <Accordion.Body>{item.answer}</Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
        <p className="mt-3">
          More detail is in our <Link to="/privacy">privacy policy</Link>.
        </p>
      </section>
    </>
  );
}

export default Landing;