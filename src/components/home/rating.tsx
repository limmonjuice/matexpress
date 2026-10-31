import { StarIcon } from "./icons";

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="hm-rating" role="img" aria-label={`Rated ${value} out of 5${count ? ` from ${count} reviews` : ""}`}>
      <StarIcon />
      <b>{value.toFixed(1)}</b>
      {count ? <span>({count})</span> : null}
    </span>
  );
}
