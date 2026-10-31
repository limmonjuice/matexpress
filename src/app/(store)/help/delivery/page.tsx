import type { Metadata } from "next";
import Link from "next/link";
import { DeliveryChecker } from "@/components/info/delivery-checker";
import { HELP_NAV, InfoPage } from "@/components/info/info-page";
import { areaFee, CUTOFF_HOUR, deliveryAreas, DELIVERY_WINDOWS, FREE_DELIVERY_OVER } from "@/lib/delivery";
import { formatPeso } from "@/lib/format";
import { TRUCKS, formatWeight } from "@/lib/load";

export const metadata: Metadata = {
  title: "Delivery | MatExpress",
  description: "Delivery areas, fees, dates and truck sizes for materials ordered on MatExpress.",
};

const FAR_AREAS = ["Cavite", "Laguna", "Bulacan"];

export default function DeliveryHelp() {
  return (
    <InfoPage
      title="Delivery"
      image="/home/products/in-use/washed-sand.webp"
      lead="One truck collects from every seller in your order and brings it all in the window you book."
      crumbs={[{ label: "Home", href: "/" }, { label: "Delivery" }]}
      nav={HELP_NAV}
      current="/help/delivery"
    >
      <div className="hm-prose hm-arrive">
        <DeliveryChecker />

        <h2>Areas and fees</h2>
        <p>One fee per order, however many sellers the truck visits. Orders of {formatPeso(FREE_DELIVERY_OVER)} or more deliver free.</p>
        <table>
          <thead>
            <tr>
              <th scope="col">Area</th>
              <th scope="col">Delivery fee</th>
              <th scope="col">Extra time</th>
            </tr>
          </thead>
          <tbody>
            {deliveryAreas.map((area) => (
              <tr key={area}>
                <th scope="row">{area}</th>
                <td>{formatPeso(areaFee(area))}</td>
                <td>{FAR_AREAS.includes(area) ? "One more day" : "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>When it arrives</h2>
        <ul>
          <li>Orders placed before {CUTOFF_HOUR - 12} PM count as today&apos;s. After that, they count as tomorrow&apos;s.</li>
          <li>Every product shows its date for your area, before you add it to the cart.</li>
          <li>Everything comes together, so the seller who needs longest sets the day. The cart tells you who that is, so you can switch.</li>
          <li>Pick your day at checkout, and a window: {DELIVERY_WINDOWS.join(" or ")}.</li>
        </ul>

        <h2>Which truck comes</h2>
        <p>We send the smallest truck that holds your load. Your cart shows which one it will be.</p>
        <table>
          <thead>
            <tr>
              <th scope="col">Truck</th>
              <th scope="col">Carries up to</th>
            </tr>
          </thead>
          <tbody>
            {TRUCKS.map((truck) => (
              <tr key={truck.id}>
                <th scope="row">{truck.name}</th>
                <td>{formatWeight(truck.capacityKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>At your site</h2>
        <ul>
          <li>Checkout asks whether a big truck can reach your gate, so we know before it leaves.</li>
          <li>Gate, road and parking fees at the site are paid by the buyer.</li>
          <li>Someone should be there to check the load and sign. The driver takes a signed photo of every drop.</li>
        </ul>
        <p>
          Something damaged or missing? See <Link href="/help/returns">returns and damage</Link>.
        </p>
      </div>
    </InfoPage>
  );
}
