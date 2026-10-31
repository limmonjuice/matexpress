import { services } from "@/lib/catalog/home-content";
import { PerkIcon } from "./icons";

export function ServiceStrip() {
  return (
    <section className="hm-frame" aria-label="What MatExpress does">
      <ul className="hm-services">
        {services.map((service) => (
          <li key={service.title}>
            <span className="hm-service-icon">
              <PerkIcon name={service.icon} />
            </span>
            <span>
              <b>{service.title}</b>
              <small>{service.text}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
