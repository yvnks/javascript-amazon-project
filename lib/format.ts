export function formatMoney(cents: number) {
  return `$${(Math.round(cents) / 100).toFixed(2)}`;
}

export function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Order dates come from Postgres as calendar dates ("2026-10-04") or UTC
// timestamps; format them in UTC so the day never shifts by time zone.
export function formatDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
  timeZone?: string,
) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone }).format(
    typeof value === "string" ? new Date(value) : value,
  );
}

export function formatStoredDate(
  value: string,
  options: Intl.DateTimeFormatOptions,
) {
  return formatDate(value, options, "UTC");
}

export function capitalize(text: string) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

export function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

// Product and order images are stored as "images/products/x.jpg".
export function publicImagePath(image: string) {
  return /^(https?:)?\//.test(image) ? image : `/${image}`;
}

export function ratingImagePath(stars: number) {
  const tenths = Math.round(stars * 10);
  return `/images/ratings/rating-${String(tenths).padStart(2, "0")}.png`;
}
