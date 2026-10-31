import Image from "next/image";
import { Breadcrumbs } from "./breadcrumbs";
import "./listing.css";

type Props = {
  title: string;
  blurb: string;
  image?: string;
  field: string;
  fieldInk: "dark" | "light";
  crumbs: { label: string; href?: string }[];
  /** Plain facts about the list, in a line under the blurb. */
  facts?: string[];
  children?: React.ReactNode;
};

/**
 * The top of a list: the material's own colour as a field, and its picture in
 * the same arch the home page's hero stands in.
 */
export function CategoryBand({ title, blurb, image, field, fieldInk, crumbs, facts, children }: Props) {
  return (
    <section className="hm-frame hm-band-wrap">
      <div className="hm-band" data-ink={fieldInk} style={{ "--hm-field": field } as React.CSSProperties}>
        <div className="hm-band-copy">
          <Breadcrumbs items={crumbs} />
          <h1>{title}</h1>
          <p className="hm-band-blurb">{blurb}</p>
          {facts && facts.length > 0 && (
            <ul className="hm-band-facts">
              {facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          )}
          {children}
        </div>
        {image && (
          <div className="hm-band-figure" aria-hidden="true">
            <span className="hm-band-arch hm-band-arch--back" />
            <span className="hm-band-arch">
              <Image src={image} alt="" fill sizes="(max-width: 699px) 40vw, 300px" preload />
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
