/** Format a number as an Indian Rupee (INR) price string with Indian numbering system (lakh/crore). */
export function formatPrice(price: number | undefined | null): string {
  const amount = typeof price === 'number' && !isNaN(price) ? price : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a date string into a human-readable format. */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

/** Returns a placeholder image URL if the provided URL is empty. */
export function getImageUrl(url?: string): string {
  if (!url || url.trim() === '') {
    return 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600';
  }
  return url;
}

/** Truncate text to a given character limit. */
export function truncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trimEnd() + '…';
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
