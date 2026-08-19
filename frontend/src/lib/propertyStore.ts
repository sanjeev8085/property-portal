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
  description?: string;
  contactName?: string;
  contactPhone?: string;
  created_at?: string;
  views?: number;
  leads?: number;
  status?: string;
}

const STORAGE_KEY = "aurahomes_published_properties";

export function getPublishedProperties(): StoredProperty[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    // Filter out if already exists with same id
    const filtered = existing.filter(p => p.id !== prop.id);
    const updated = [prop, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Also dispatch a custom event so open tabs/pages update immediately
    window.dispatchEvent(new Event("aurahomes_properties_updated"));
  } catch (err) {
    console.error("Failed to save property to localStorage:", err);
  }
}

export function deletePublishedProperty(id: string | number): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getPublishedProperties();
    const updated = existing.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("aurahomes_properties_updated"));
  } catch (err) {
    console.error("Failed to delete property:", err);
  }
}
