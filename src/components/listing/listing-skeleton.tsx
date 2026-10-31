import "./listing.css";

/** The top of a list, before its address is known. */
export function BandSkeleton() {
  return (
    <>
      <div className="hm-frame hm-band-wrap hm-skeleton" aria-hidden="true">
        <i className="hm-skel-band" />
      </div>
      <ListingSkeleton />
    </>
  );
}

/** Holds the page's shape while a list that depends on the URL streams in. */
export function ListingSkeleton() {
  return (
    <div className="hm-listing hm-skeleton" aria-hidden="true">
      <div className="hm-listing-grid">
        <div className="hm-filters">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="hm-skel-group">
              <i />
              <i />
              <i />
              <i />
            </div>
          ))}
        </div>
        <div className="hm-results">
          <div className="hm-skel-tools">
            <i />
            <i />
          </div>
          <div className="hm-products">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="hm-skel-card" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
