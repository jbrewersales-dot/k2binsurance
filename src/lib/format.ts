// Display formatting shared by the portal table, detail view, and CSV export.
// Mirrors the design reference's timeAgo()/displayVal() behavior.

export function displayAnswer(value: unknown): string {
  if (value == null) return "—";
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }
  const s = String(value).trim();
  return s === "" ? "—" : s;
}

export function timeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400 && now.getDate() === d.getDate()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (diff < 172800) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

// Strip parenthetical hints from a field label for compact display.
export function cleanLabel(label: string): string {
  return label.replace(/\s*\(.*?\)\s*/g, " ").trim();
}
