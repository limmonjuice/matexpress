"use client";

import { usePreferences } from "@/stores/preferences-store";
import { HeartIcon } from "./icons";

export function SaveButton({ slug, name }: { slug: string; name: string }) {
  const saved = usePreferences((s) => s.saved.includes(slug));
  const toggleSaved = usePreferences((s) => s.toggleSaved);

  return (
    <button
      type="button"
      className="hm-save"
      aria-pressed={saved}
      aria-label={`Save ${name}`}
      onClick={() => toggleSaved(slug)}
    >
      <HeartIcon />
    </button>
  );
}
