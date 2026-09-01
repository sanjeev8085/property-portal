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
 * Extract raw property UUID or ID from a slugged URL.
 * Handles both plain IDs ("d3b07384-d113-4d44-9694-71286b24d775", "12345")
 * and slugified URLs ("2-bhk-apartment-arera-colony-bhopal-d3b07384-d113-4d44-9694-71286b24d775").
 */
export function extractPropertyId(slugOrId: string): string {
  if (!slugOrId) return "";
  
  // Standard UUID v4 regex match (8-4-4-4-12 hex chars)
  const uuidMatch = slugOrId.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  if (uuidMatch) {
    return uuidMatch[0];
  }

  // Fallback: extract last hypen segment if numeric ID
  const parts = slugOrId.split("-");
  const lastPart = parts[parts.length - 1];
  if (lastPart && !isNaN(Number(lastPart))) {
    return lastPart;
  }

  return slugOrId;
}

export const extractIdFromSlug = extractPropertyId;

export function getFallbackImage(typeOrTitle: string = ""): string {
  const t = (typeOrTitle || "").toLowerCase();
  if (t.includes("plot") || t.includes("land")) {
    return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80";
  }
  if (t.includes("office") || t.includes("shop") || t.includes("commercial") || t.includes("retail") || t.includes("warehouse")) {
    return "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";
  }
  if (t.includes("pg") || t.includes("coliving") || t.includes("hostel") || t.includes("dormitory")) {
    return "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80";
  }
  return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";
}

export function normalizeImage(img: any, typeOrTitle: string = ""): string {
  if (!img) return getFallbackImage(typeOrTitle);
  let src = typeof img === "string" ? img : (img.image_url || img.url || img.src || "");
  if (typeof src !== "string" || !src.trim() || src.includes("[object")) {
    return getFallbackImage(typeOrTitle);
  }
  return src.trim();
}
