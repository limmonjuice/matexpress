import { CHAPTERS, CHAPTER, UNITS } from "../journey/rig";
import { StoryDirector } from "./story-director";
import "./story.css";

function Arrow() {
  return (
    <svg className="story-arrow" viewBox="0 0 20 20" aria-hidden="true">
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

/**
 * The pinned story the 3D truck plays out under. The section is UNITS viewport
 * heights tall; its stage sticks to the screen while the scroll drives the
 * timeline in story-director.tsx.
 */
export function Story() {
  return (
    <section className="story" aria-label="How MatExpress works" style={{ height: `${UNITS}vh` }}>
      {/* Jump targets: each lands just inside its chapter's hold */}
      {CHAPTERS.map((c, i) => (
        <span key={c.id} id={c.id} className="story-anchor" style={{ top: `${CHAPTER * i + 12}vh` }} />
      ))}

      {/* Two layers stick to the screen: the colour under the 3D truck, the words over it */}
      <div className="story-backdrop" aria-hidden="true" />
      <div className="story-sticky" data-tone="light">
        <header className="story-bar">
          <a href="#top" className="story-mark">
            MatExpress
          </a>
          <nav aria-label="Chapters">
            <ol className="story-rail">
              {CHAPTERS.map((c) => (
                <li key={c.id}>
                  <a href={`#${c.id}`}>{c.label}</a>
                </li>
              ))}
            </ol>
            <div className="story-progress" aria-hidden="true">
              <i />
            </div>
          </nav>
          <a href="#get-started" className="story-start">
            Get started <Arrow />
          </a>
        </header>

        <div className="story-chapters">
          <article className="story-chapter story-chapter--left">
            <h2>Every supplier in one search.</h2>
            <p>
              Search cement, steel, lumber and tools across verified hardware stores near your
              project, and compare price, stock and delivery date side by side.
            </p>
          </article>

          <article className="story-chapter story-chapter--right">
            <h2>One cart. Many suppliers.</h2>
            <p>
              Add materials from every store the build needs and check out once. One payment, one
              order number, and each seller confirms before anything ships.
            </p>
          </article>

          <article className="story-chapter story-chapter--left">
            <h2>Delivered to your site.</h2>
            <p>
              Our trucks collect from every seller in your order and arrive in the window you book.
              Follow the delivery live, and sign for it on your phone.
            </p>
          </article>

          <article className="story-chapter story-chapter--right">
            <h2>Sell to every site nearby.</h2>
            <p>
              Hardware stores, lumberyards and steel suppliers list their stock on MatExpress and
              reach the contractors and architects building around them.
            </p>
            <a href="#get-started" className="story-link">
              Become a seller <Arrow />
            </a>
          </article>

          <article className="story-chapter story-chapter--left">
            <h2>Ready to build?</h2>
            <p>Create a free account, add your project site and order your first materials today.</p>
            <div className="story-actions">
              <a href="#get-started" className="story-button">
                Get started <Arrow />
              </a>
              <a href="#sell" className="story-link">
                Sell on MatExpress <Arrow />
              </a>
            </div>
          </article>
        </div>
      </div>
      <StoryDirector />
    </section>
  );
}

export function StoryFooter() {
  return (
    <footer className="story-footer">
      <span className="story-footer-mark">MatExpress</span>
      <nav aria-label="Footer">
        <a href="#how-it-works">How it works</a>
        <a href="#for-your-project">For your project</a>
        <a href="#sell">Sell on MatExpress</a>
      </nav>
      <span>© 2026 MatExpress</span>
    </footer>
  );
}
