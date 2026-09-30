export function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(d));
}

export function formatRelative(d: Date | string | null | undefined): string {
  if (!d) return "never";
  const date = new Date(d);
  const diffDays = Math.round(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays > 1) return `in ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}

export function isOverdue(d: Date | string | null | undefined): boolean {
  if (!d) return false;
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
