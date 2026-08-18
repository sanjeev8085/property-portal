/**
 * Utility helpers for SEO-friendly URL slugs and ID parsing.
 */

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-") // Replace spaces and non-word chars with hyphen
    .replace(/^-+|-+$/g, "");   // Remove leading/trailing hyphens
}

/**
 * Generate SEO-friendly property URL slug.
 * Example:
 * title: "2 BHK Luxury Penthouse in Arera Colony"
 * city: "Bhopal"
 * id: "12345"
 * Result: "2-bhk-luxury-penthouse-arera-colony-bhopal-12345"
 */
export function generatePropertySlug(
  title: string,
  locationOrCity?: string,
  id?: string | number
): string {
  const parts = [title];
  if (locationOrCity && !title.toLowerCase().includes(locationOrCity.toLowerCase())) {
    parts.push(locationOrCity);
  }
  const baseSlug = slugify(parts.join(" "));
  if (id) {
    return `${baseSlug}-${id}`;
  }
  return baseSlug;
}

/**
 * Extract the raw property UUID or ID from a slugged URL.
 * Handles both plain IDs ("d3b07384-d113-4d44-9694-71286b24d775", "12345")
 * and slugged strings ("2-bhk-apartment-bhopal-d3b07384-d113-4d44-9694-71286b24d775").
 */
export function extractIdFromSlug(slugOrId: string): string {
  if (!slugOrId) return "";

  // Check if string contains standard 36-char UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const uuidMatch = slugOrId.match(uuidRegex);
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // Check if trailing part is a number or ID after the last hyphen
  const parts = slugOrId.split("-");
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart.length > 0) {
    return lastPart;
  }

  return slugOrId;
}
