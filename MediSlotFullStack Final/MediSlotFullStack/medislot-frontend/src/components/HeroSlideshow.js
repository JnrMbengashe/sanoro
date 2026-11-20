import { useState } from "react";
import { Carousel } from "react-bootstrap";

// One entry per photo in public/images/hero. The gradient shows until a photo exists.
const slides = [
  { image: "slide-1.jpg", fallback: "linear-gradient(135deg, #0f5c5a, #1f8a84)" },
  { image: "slide-2.jpg", fallback: "linear-gradient(135deg, #0a4543, #2a7f7a)" },
  { image: "slide-3.jpg", fallback: "linear-gradient(135deg, #123f5a, #0f5c5a)" },
  { image: "slide-4.jpg", fallback: "linear-gradient(135deg, #17302f, #0f5c5a)" },
  { image: "slide-5.jpg", fallback: "linear-gradient(135deg, #0f5c5a, #2a7f7a)" },
];

// People who ask their device to reduce motion start with the slideshow paused.
const prefersReducedMotion =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function HeroSlideshow() {
  const [paused, setPaused] = useState(prefersReducedMotion);

  return (
    <>
      <Carousel
        fade
        controls={false}
        indicators={false}
        pause={false}
        touch={false}
        interval={paused ? null : 6000}
        className="hero-carousel"
        aria-hidden="true"
      >
        {slides.map((slide) => (
          <Carousel.Item key={slide.image}>
            <div
              className="hero-slide"
              style={{
                backgroundImage: `url(${process.env.PUBLIC_URL}/images/hero/${slide.image}), ${slide.fallback}`,
              }}
            />
          </Carousel.Item>
        ))}
      </Carousel>

      <button type="button" className="hero-pause" aria-pressed={paused} onClick={() => setPaused((value) => !value)}>
        {paused ? "Play slideshow" : "Pause slideshow"}
      </button>
    </>
  );
}

export default HeroSlideshow;