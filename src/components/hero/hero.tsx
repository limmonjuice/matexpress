import Image from "next/image";
import yard from "@/assets/hero-yard-plate.webp";
import "./hero.css";

function Arrow() {
  return (
    <svg className="hx-arrow" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section id="top" className="hx" data-pose="0" aria-labelledby="hero-title">
      {/* The 3D truck's camera locks onto this box, so the truck stands on the photo's ground */}
      <div className="hx-stage">
        <Image src={yard} alt="" fill preload sizes="100vw" placeholder="blur" className="hx-photo" />
      </div>

      <header className="hx-nav">
        <a href="#top" className="hx-wordmark">
          MatExpress
        </a>
        <nav className="hx-links" aria-label="Primary">
          <a href="#how-it-works">How it works</a>
          <a href="#for-your-project">For your project</a>
        </nav>
        <a href="#get-started" className="hx-start">
          Get started <Arrow />
        </a>
      </header>

      <div className="hx-content">
        <h1 id="hero-title" className="hx-title">
          <span>The right materials.</span> <span>Right on schedule.</span>
        </h1>
        <span className="hx-rule" aria-hidden="true" />
        <div className="hx-side">
          <p>
            Source quality construction materials from trusted suppliers and get them delivered to
            your project site — hassle-free.
          </p>
          <a href="#how-it-works" className="hx-cta">
            Explore materials <Arrow />
          </a>
        </div>
      </div>
    </section>
  );
}
