const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "Oct 16, 2026" from an ISO timestamp. */
export function formatDate(iso: string): string {
  return formatter.format(new Date(iso));
}
