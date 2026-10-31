import { announcements } from "@/lib/catalog/home-content";

export function AnnouncementBar() {
  return (
    <div className="hm-announce">
      <div className="hm-frame hm-announce-row">
        {announcements.map((text) => (
          <span key={text}>{text}</span>
        ))}
      </div>
    </div>
  );
}
