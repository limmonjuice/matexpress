import { MaterialIcon, type MaterialIconName } from "./material-icons";
import { CATALOG, formatPeso } from "./catalog";

// The MatExpress app as it appears inside the hero monitor. Sized in container
// units (cqw) so it scales with the monitor at any width.

const ROUTE = "M28 188 C 90 186, 96 132, 150 128 S 230 150, 262 96 S 330 40, 372 34";

function MiniMap({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 220" aria-hidden="true">
      <rect width="400" height="220" fill="#E9E7DD" />
      <g fill="#DEDBCF">
        <rect x="18" y="16" width="70" height="48" rx="4" />
        <rect x="106" y="16" width="96" height="48" rx="4" />
        <rect x="220" y="140" width="80" height="62" rx="4" />
        <rect x="318" y="118" width="66" height="84" rx="4" />
        <rect x="18" y="86" width="96" height="40" rx="4" />
        <rect x="132" y="160" width="70" height="44" rx="4" />
      </g>
      <g stroke="#F7F6F0" strokeWidth="9" fill="none" strokeLinecap="round">
        <path d="M0 76 H400" />
        <path d="M210 0 V220" />
        <path d="M0 140 C 120 140, 160 110, 400 104" />
        <path d="M300 0 C 300 80, 320 140, 400 210" />
      </g>
      <path d={ROUTE} stroke="#16150F" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path
        d={ROUTE}
        stroke="#FFC929"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="1 11"
      />
      <circle cx="28" cy="188" r="7" fill="#16150F" />
      <circle cx="372" cy="34" r="9" fill="#FFC929" stroke="#16150F" strokeWidth="3" />
      <g>
        <circle r="9" fill="#16150F" />
        <circle r="4" fill="#FFC929" />
        <animateMotion dur="9s" repeatCount="indefinite" path={ROUTE} keyPoints="0;0.78;0.78" keyTimes="0;0.85;1" calcMode="linear" />
      </g>
    </svg>
  );
}

function TopBar() {
  return (
    <div className="ui-top">
      <span className="ui-logo">
        <MaterialIcon name="hardhat" className="ui-logo-mark" />
        MatExpress
      </span>
      <span className="ui-search">Search 2,400 materials, brands, SKUs…</span>
      <span className="ui-top-right">
        <span className="ui-cart">
          Cart <b>3</b>
        </span>
        <span className="ui-avatar">RB</span>
      </span>
    </div>
  );
}

const NAV = ["Home", "Catalog", "Orders", "Deliveries", "Projects", "Invoices"] as const;

function SideNav({ active }: { active: (typeof NAV)[number] }) {
  return (
    <div className="ui-side">
      {NAV.map((item) => (
        <span key={item} className={item === active ? "ui-side-item is-active" : "ui-side-item"}>
          {item}
        </span>
      ))}
      <span className="ui-side-project">
        <small>Project</small>
        Casa Verde, Antipolo
      </span>
    </div>
  );
}

function DeliveriesPage() {
  return (
    <div className="ui-main">
      <div className="ui-heading">
        <h3>Good morning, Reyes Builders</h3>
        <span>2 deliveries today</span>
      </div>
      <div className="ui-grid-deliveries">
        <div className="ui-panel ui-map-panel">
          <MiniMap className="ui-map" />
          <div className="ui-map-caption">
            <b>MX-204</b> on Marcos Hwy · 6.2 km away
          </div>
        </div>
        <div className="ui-col">
          <div className="ui-panel ui-eta">
            <small>Arriving</small>
            <strong>11:40 AM</strong>
            <span>Order #MX-48213 · 6 items</span>
          </div>
          <div className="ui-panel ui-steps">
            {[
              ["Ordered", "8:02"],
              ["Loaded at yard", "9:15"],
              ["On the road", "10:48"],
              ["Delivered", "—"],
            ].map(([label, time], i) => (
              <div key={label} className={i < 3 ? "ui-step is-done" : "ui-step"}>
                <i />
                <span>{label}</span>
                <em>{time}</em>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ui-panel ui-items">
        {(["cement", "rebar", "rocks", "coil"] as MaterialIconName[]).map((icon, i) => (
          <div key={icon} className="ui-item">
            <MaterialIcon name={icon} className="ui-item-icon" />
            <span>
              {["Cement Type I", "Rebar 12 mm", "Washed sand", "Tie wire #16"][i]}
              <small>{["120 bags", "80 lengths", "3 m³", "25 kg"][i]}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogPage() {
  return (
    <div className="ui-main">
      <div className="ui-heading">
        <h3>Structural materials</h3>
        <span>Showing yard stock · Antipolo</span>
      </div>
      <div className="ui-chips">
        <span className="is-active">All</span>
        <span>Cement</span>
        <span>Steel</span>
        <span>Aggregates</span>
        <span>Masonry</span>
      </div>
      <div className="ui-tiles">
        {CATALOG.slice(0, 6).map((item) => (
          <div key={item.id} className="ui-tile">
            <MaterialIcon name={item.icon} className="ui-tile-icon" />
            <b>{item.name}</b>
            <span>
              {formatPeso(item.price)} / {item.unit}
            </span>
            <i>Add</i>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoicesPage() {
  return (
    <div className="ui-main">
      <div className="ui-heading">
        <h3>Trade account</h3>
        <span>Reyes Builders Inc. · Net 30</span>
      </div>
      <div className="ui-panel ui-credit">
        <div>
          <small>Available credit</small>
          <strong>₱412,500</strong>
        </div>
        <div className="ui-bar">
          <i style={{ width: "17.5%" }} />
        </div>
        <span>₱87,500 used of ₱500,000</span>
      </div>
      <div className="ui-panel ui-table">
        {[
          ["INV-2291", "Casa Verde", "₱54,190", "Due Nov 28", "Open"],
          ["INV-2284", "Casa Verde", "₱33,310", "Due Nov 21", "Open"],
          ["INV-2260", "Lot 14 Duplex", "₱128,900", "Oct 30", "Paid"],
          ["INV-2241", "Lot 14 Duplex", "₱76,420", "Oct 16", "Paid"],
        ].map((row) => (
          <div key={row[0]} className="ui-row">
            {row.map((cell, i) => (
              <span key={i} className={i === 4 ? `ui-status is-${cell.toLowerCase()}` : undefined}>
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DesktopScreen() {
  return (
    <div className="ui" data-ui>
      <TopBar />
      <div className="ui-body">
        <div className="ui-page" data-screen="0">
          <SideNav active="Deliveries" />
          <DeliveriesPage />
        </div>
        <div className="ui-page" data-screen="1">
          <SideNav active="Catalog" />
          <CatalogPage />
        </div>
        <div className="ui-page" data-screen="2">
          <SideNav active="Invoices" />
          <InvoicesPage />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The cards that pop out of the screen during the scroll story
// ---------------------------------------------------------------------------

export function PopCards() {
  return (
    <>
      <div className="pop-card pop-track" data-pop="0" data-ui aria-hidden="true">
        <MiniMap className="pop-map" />
        <div className="pop-row">
          <div>
            <small>Arriving in</small>
            <strong>18 min</strong>
          </div>
          <MaterialIcon name="truck" className="pop-icon" />
        </div>
        <div className="pop-driver">
          <span className="ui-avatar">JD</span>
          <span>
            Jun Dela Cruz
            <small>Truck MX-204 · 6-wheeler</small>
          </span>
          <i>Call</i>
        </div>
      </div>

      <div className="pop-card pop-cart" data-pop="1" data-ui aria-hidden="true">
        <div className="pop-title">
          Your order <small>3 items</small>
        </div>
        {[
          ["cement", "Cement Type I", "120 bags", "₱30,240", true],
          ["rebar", "Rebar 12 mm", "80 lengths", "₱19,600", false],
          ["rocks", "Washed sand", "3 m³", "₱4,350", false],
        ].map(([icon, name, qty, total, bulk]) => (
          <div key={name as string} className="pop-line">
            <MaterialIcon name={icon as MaterialIconName} className="pop-line-icon" />
            <span>
              {name}
              <small>
                {qty}
                {bulk ? " · bulk price" : ""}
              </small>
            </span>
            <b>{total}</b>
          </div>
        ))}
        <div className="pop-total">
          <span>Total</span>
          <strong>₱54,190</strong>
        </div>
        <i className="pop-button">Place order · Thu 7–9 AM</i>
      </div>

      <div className="pop-card pop-trade" data-pop="2" data-ui aria-hidden="true">
        <div className="pop-title">
          Net 30 terms <small>Reyes Builders Inc.</small>
        </div>
        <strong className="pop-big">₱412,500</strong>
        <small className="pop-muted">available of ₱500,000</small>
        <div className="ui-bar">
          <i style={{ width: "17.5%" }} />
        </div>
        <div className="pop-line">
          <MaterialIcon name="level" className="pop-line-icon" />
          <span>
            INV-2291 · Casa Verde
            <small>Due Nov 28</small>
          </span>
          <b>₱54,190</b>
        </div>
        <i className="pop-button">Pay invoice</i>
      </div>
    </>
  );
}
