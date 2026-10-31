import type { PaymentProvider } from "./create-order";

/**
 * Takes no money and talks to no one: checkout works end to end until a real
 * gateway's test keys are added. Checkout says so on the page.
 */
export const simulatedPayments: PaymentProvider = {
  async start({ number }) {
    return { status: "paid", ref: `TEST-${number}` };
  },
};
