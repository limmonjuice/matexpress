import { trustPoints } from "@/lib/catalog/home-content";
import { PerkIcon } from "./icons";

export function TrustStrip() {
  return (
    <section className="hm-frame hm-section" aria-label="Why buy on MatExpress">
      <ul className="hm-trust" data-reveal>
        {trustPoints.map((point) => (
          <li key={point.title}>
            <PerkIcon name={point.icon} />
            <b>{point.title}</b>
            <small>{point.text}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
