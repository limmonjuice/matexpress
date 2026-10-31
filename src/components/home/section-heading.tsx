import Link from "next/link";
import { ArrowIcon } from "./icons";

type Props = {
  title: string;
  viewAllHref?: string;
  /** What the "View all" link leads to, for screen readers. Defaults to the title. */
  viewAllName?: string;
  /** Controls that sit beside the link, like a row's arrows. */
  actions?: React.ReactNode;
};

export function SectionHeading({ title, viewAllHref, viewAllName = title.toLowerCase(), actions }: Props) {
  return (
    <div className="hm-heading">
      <h2 className="hm-title" data-split>
        {title}
      </h2>
      <div className="hm-heading-side">
        {actions}
        {viewAllHref && (
          <Link href={viewAllHref} className="hm-link" aria-label={`View all ${viewAllName}`}>
            View all <ArrowIcon />
          </Link>
        )}
      </div>
    </div>
  );
}
