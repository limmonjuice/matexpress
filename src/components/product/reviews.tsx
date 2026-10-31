import { StarIcon } from "@/components/home/icons";
import type { Product, Review } from "@/lib/catalog/types";

/** Only what exists: no bars without ratings, and a plain note where nobody has reviewed yet. */
export function Reviews({ product, reviews }: { product: Product; reviews: Review[] }) {
  if (product.rating === undefined) {
    return (
      <section id="reviews" className="hm-reviews" aria-labelledby="hm-reviews-title">
        <h2 id="hm-reviews-title" className="hm-pd-title">
          Reviews
        </h2>
        <p className="hm-reviews-none">No reviews yet. Buyers can review this after their delivery.</p>
      </section>
    );
  }

  return (
    <section id="reviews" className="hm-reviews" aria-labelledby="hm-reviews-title">
      <h2 id="hm-reviews-title" className="hm-pd-title">
        Reviews
      </h2>
      <div className="hm-reviews-grid">
        <div className="hm-reviews-summary">
          <p className="hm-reviews-score">
            {product.rating.toFixed(1)}
            <StarIcon />
          </p>
          <p className="hm-reviews-count">{product.reviewCount} ratings</p>
          {product.ratingBars && (
            <ul className="hm-bars">
              {product.ratingBars.map((share, i) => (
                <li key={i}>
                  <span>{5 - i}</span>
                  <i>
                    <b style={{ width: `${share}%` }} />
                  </i>
                  <small>{share}%</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="hm-reviews-list">
            {/* Sample reviews are labelled, so nobody takes them for real buyers. Remove with data/reviews.ts before launch. */}
            <p className="hm-reviews-sample">Sample reviews, shown until real buyers review this product.</p>
            {reviews.map((review) => (
              <article key={review.title} className="hm-review">
                <header>
                  <span className="hm-review-stars" role="img" aria-label={`${review.rating} out of 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon key={i} className={i < review.rating ? "hm-star" : "hm-star hm-star--off"} />
                    ))}
                  </span>
                  <h3>{review.title}</h3>
                </header>
                <p>{review.body}</p>
                <footer>
                  {review.author}, {review.role} · {review.date}
                  {review.seller ? ` · from ${review.seller}` : ""}
                </footer>
                {review.reply && (
                  <blockquote>
                    <b>{review.reply.from} replied</b>
                    {review.reply.body}
                  </blockquote>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
