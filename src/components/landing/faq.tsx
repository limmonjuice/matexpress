const QUESTIONS = [
  {
    q: "Where do you deliver?",
    a: "Metro Manila, Rizal, Cavite, Laguna and Bulacan, from yards in Antipolo, Valenzuela and Biñan. Enter your site address at checkout to see your nearest yard and windows.",
  },
  {
    q: "How fast can materials arrive?",
    a: "Orders placed before 2 PM ship the same day from stock. You can also book a window from 6 AM, so the truck lands before your crew starts the pour.",
  },
  {
    q: "Is there a minimum order?",
    a: "No. Delivery is free on orders over ₱25,000. Below that, a flat fee for your area shows in the cart before you pay.",
  },
  {
    q: "Can I pay on terms?",
    a: "Yes, with a trade account. Approved companies get Net 30 terms with a credit limit set to the size of their work. Card, bank transfer and GCash work for everyone.",
  },
  {
    q: "What if something arrives damaged or short?",
    a: "Report it in the app with a photo within 24 hours of the drop. We replace it on the next truck or credit your account, whichever you choose.",
  },
  {
    q: "Can my site team order without seeing our prices?",
    a: "Yes. Give foremen a requester role: they build the order from site, and an owner or purchaser approves it before it ships.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="section faq" data-theme="light" aria-labelledby="faq-title">
      <div className="frame faq-grid">
        <div className="faq-head">
          <h2 id="faq-title" data-reveal>
            Questions from the site office.
          </h2>
          <p data-reveal>
            Still stuck? Call the yard on <a href="tel:+63289001234">(02) 8900 1234</a>, 6 AM to 6 PM
            every day.
          </p>
        </div>
        <div className="faq-list">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="faq-item" data-reveal>
              <summary>
                <h3>{item.q}</h3>
                <span className="faq-toggle" aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
