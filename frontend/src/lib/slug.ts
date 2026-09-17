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

export function getFallbackImage(typeOrTitle: string = "", index: number = 0): string {
  const t = (typeOrTitle || "").toLowerCase();
  const i = Math.abs(index) % 4;
  if (t.includes("plot") || t.includes("land")) {
    const plotImgs = [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524813686514-a57563d77d66?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    ];
    return plotImgs[i];
  }
  if (t.includes("office") || t.includes("shop") || t.includes("commercial") || t.includes("retail") || t.includes("warehouse")) {
    const commImgs = [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    ];
    return commImgs[i];
  }
  if (t.includes("pg") || t.includes("coliving") || t.includes("hostel") || t.includes("dormitory")) {
    const pgImgs = [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    ];
    return pgImgs[i];
  }
  const resImgs = [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
  ];
  return resImgs[i];
}

export function normalizeImage(img: any, typeOrTitle: string = "", index: number = 0): string {
  if (!img) return getFallbackImage(typeOrTitle, index);
  let src = typeof img === "string" ? img : (img.detail_url || img.card_url || img.image_url || img.url || img.thumbnail_url || img.src || "");
  if (typeof src !== "string" || !src.trim() || src.includes("[object") || src === "null" || src === "undefined") {
    return getFallbackImage(typeOrTitle, index);
  }
  src = src.trim();
  if (src.startsWith("/uploads")) {
    const rawApi = process.env.NEXT_PUBLIC_API_URL || "https://aurahomes-backend-tz1c.onrender.com";
    const apiBase = rawApi.replace(/\/+$/, "");
    return `${apiBase}${src}`;
  }
  return src;
}
