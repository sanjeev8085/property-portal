export interface StoredProperty {
  id: string | number;
  title: string;
  price: string;
  priceNum: number;
  location: string;
  specs: string;
  image: string;
  photos?: string[];
  type: string;
  purpose: "rent" | "sell";
  bhk: number;
  parking?: string;
  bathrooms?: number;
  furnished?: string;
  size?: string;
  facing?: string;
  dimensions?: string;
  boundaryWall?: string;
  cornerPlot?: string;
  frontage?: string;
  shopFloor?: string;
  shopWashroom?: string;
  cabins?: string;
  workstations?: string;
  pgFor?: string;
  roomType?: string;
  foodIncluded?: string;
  description?: string;
  contactName?: string;
  contactPhone?: string;
  created_at?: string;
  views?: number;
  leads?: number;
  status?: string;
  ownerId?: string;
  ownerEmail?: string;
  amenities?: string[];
}

const STORAGE_KEY = "aurahomes_published_properties";
const DEACTIVATED_KEY = "aurahomes_deactivated_properties";

export function getPublishedProperties(): StoredProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const LEGACY_SAMPLE_IDS = new Set([
      "premium-pg-coliving-space-triple-dormitory-sharing-in-gandhi-nagar-bhopal-gandhi-nagar-gandhi-nagar-bhopal-1788182184833",
      "1500-sqft-commercial-office-space-in-arera-colony-bhopal",
      "3-bhk-luxury-apartment-in-mp-nagar-bhopal",
      "1500-sqft-east-facing-plot-land-in-kolar-road-bhopal",
    ]);

    // Deduplicate by id and title+price, and filter out exact legacy sample IDs
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    const valid = parsed.filter(p => {
      if (!p || !p.id) return false;
      const idStr = p.id.toString();

      if (LEGACY_SAMPLE_IDS.has(idStr)) {
        return false;
      }

      const titleLower = (p.title || "").toLowerCase().trim();
      const priceVal = Number(p.priceNum || p.price) || 0;
      const contentKey = `${titleLower}_${priceVal}`;
      if (seenIds.has(idStr) || seenKeys.has(contentKey)) {
        return false;
      }
      seenIds.add(idStr);
      seenKeys.add(contentKey);
      return true;
    });

    // Auto-clean localStorage if legacy items were pruned
    if (valid.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }

    return valid;
  } catch {
    return [];
  }
}

export function getDeactivatedPropertyIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DEACTIVATED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePublishedProperty(prop: StoredProperty): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getPublishedProperties();
    const propPriceVal = Number(prop.priceNum || prop.price) || 0;
    const propKey = `${(prop.title || "").toLowerCase().trim()}_${propPriceVal}`;

    // Filter out if already exists with same id or same title+price
    const filtered = existing.filter(p => {
      const pPriceVal = Number(p.priceNum || p.price) || 0;
      const pKey = `${(p.title || "").toLowerCase().trim()}_${pPriceVal}`;
      return p.id !== prop.id && pKey !== propKey;
    });
    const updated = [prop, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Remove from deactivated set if reactivating
    const deactIds = getDeactivatedPropertyIds().filter(d => d !== prop.id.toString());
    localStorage.setItem(DEACTIVATED_KEY, JSON.stringify(deactIds));

    // Dispatch custom event so open tabs/pages update immediately
    window.dispatchEvent(new Event("aurahomes_properties_updated"));
  } catch (err) {
    console.error("Failed to save property to localStorage:", err);
  }
}

export function deactivatePropertyStore(id: string | number): void {
  if (typeof window === "undefined") return;
  try {
    // 1. Update published properties list status
    const existing = getPublishedProperties();
    const updated = existing.map(p => p.id.toString() === id.toString() ? { ...p, status: "Deactivated" } : p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Add to deactivated IDs set
    const deactIds = getDeactivatedPropertyIds();
    const idStr = id.toString();
    if (!deactIds.includes(idStr)) {
      localStorage.setItem(DEACTIVATED_KEY, JSON.stringify([...deactIds, idStr]));
    }

    // 3. Dispatch update event
    window.dispatchEvent(new Event("aurahomes_properties_updated"));
  } catch (err) {
    console.error("Failed to deactivate property:", err);
  }
}

export function reactivatePropertyStore(id: string | number): void {
  if (typeof window === "undefined") return;
  try {
    // 1. Update published properties list status
    const existing = getPublishedProperties();
    const updated = existing.map(p => p.id.toString() === id.toString() ? { ...p, status: "Published" } : p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Remove from deactivated IDs set
    const deactIds = getDeactivatedPropertyIds().filter(d => d !== id.toString());
    localStorage.setItem(DEACTIVATED_KEY, JSON.stringify(deactIds));

    // 3. Dispatch update event
    window.dispatchEvent(new Event("aurahomes_properties_updated"));
  } catch (err) {
    console.error("Failed to reactivate property:", err);
  }
}

import { api } from "@/lib/api";

export async function syncOfflinePropertiesToCloud(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return;

    let updated = false;
    for (const item of parsed) {
      if (!item || !item.id) continue;
      const idStr = String(item.id);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);
      
      // If item is a local unsynced property (not a UUID)
      if (!isUuid && item.title) {
        try {
          const type = item.type || item.property_type || "Apartment";
          const isLandOrComm = ["Plot / Land", "Shop", "Office Space", "Warehouse"].includes(type);
          const cloudRes = await api.createProperty({
            title: item.title,
            price: Number(item.priceNum || item.price) || 500000,
            purpose: item.purpose === "sell" ? "sell" : "rent",
            category: ["Shop", "Office Space", "Warehouse"].includes(type) ? "commercial" : "residential",
            property_type: type,
            bhk: isLandOrComm ? null : (Number(item.bhk) || null),
            area_sqft: parseFloat(String(item.size || item.area_sqft)) || 1200,
            bathrooms: type === "Plot / Land" ? null : (Number(item.bathrooms) || null),
            description: item.description || item.title,
            images: item.photos && item.photos.length > 0 ? item.photos : (item.image ? [item.image] : []),
            image: item.image || (item.photos && item.photos[0]) || "",
            city: item.city || "Bhopal",
            locality: item.location || item.locality || "Arera Colony",
            contact_name: item.contactName || "Property Owner",
            contact_phone: item.contactPhone || "",
            amenities: item.amenities || [],
          });

          if (cloudRes && cloudRes.id) {
            item.id = cloudRes.id;
            updated = true;
          }
        } catch {
          // Ignored
        }
      }
    }
    if (updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      window.dispatchEvent(new Event("aurahomes_properties_updated"));
    }
  } catch {
    // Ignored
  }
}

export function deletePublishedProperty(id: string | number): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getPublishedProperties();
    const updated = existing.filter(p => p.id.toString() !== id.toString());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    const deactIds = getDeactivatedPropertyIds().filter(d => d !== id.toString());
    localStorage.setItem(DEACTIVATED_KEY, JSON.stringify(deactIds));

    window.dispatchEvent(new Event("aurahomes_properties_updated"));
  } catch (err) {
    console.error("Failed to delete property:", err);
  }
}
