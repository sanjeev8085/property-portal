"use client";
import { useState } from "react";
import api from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProvenanceField {
  value: string | number | null;
  source: string | null;
  confidence: "high" | "medium" | "low" | null;
}

interface ExtractionResult {
  property: {
    name: ProvenanceField;
    address: ProvenanceField;
    city: ProvenanceField;
    state: ProvenanceField;
    country: ProvenanceField;
    postalCode: ProvenanceField;
    latitude: ProvenanceField;
    longitude: ProvenanceField;
    propertyType: ProvenanceField;
    price: ProvenanceField;
    currency: ProvenanceField;
  };
  classification: { type: string | null; confidence: string | null; note: string };
  googleMaps: { placeId: ProvenanceField; sourceUrl: string };
  streetView: {
    available: boolean;
    panoramaId: string | null;
    latitude: number | null;
    longitude: number | null;
    heading: number | null;
    pitch: number | null;
    fieldOfView: number | null;
  };
  geocoded?: {
    area: string | null;
    locality: string | null;
    latitude: number | null;
    longitude: number | null;
    google_maps_url: string;
  };
  extraction: {
    status: string;
    fieldsFound: string[];
    fieldsMissing: string[];
    warnings: string[];
    timestamp: string;
  };
  duplicate?: { id: string; title: string; city: string };
}

interface ApiResponse {
  success: boolean;
  code: string;
  message: string;
  data?: ExtractionResult;
}

// ─── Helper components ───────────────────────────────────────────────────────

const PROGRESS_STAGES = [
  "Validating URL",
  "Parsing map information",
  "Extracting coordinates",
  "Checking property information",
  "Preparing results",
];

function ProgressAnimation({ stage }: { stage: number }) {
  return (
    <div style={{ marginTop: 20 }}>
      {PROGRESS_STAGES.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, opacity: i <= stage ? 1 : 0.35, transition: "opacity 0.3s" }}>
          <span style={{ fontSize: 16 }}>{i < stage ? "✅" : i === stage ? "⏳" : "⬜"}</span>
          <span style={{ fontSize: 14, color: i <= stage ? "#1a1a2e" : "#888" }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

function FieldRow({
  label,
  field,
  editValue,
  onEdit,
  editable = true,
  inputType = "text",
}: {
  label: string;
  field: ProvenanceField | null | undefined;
  editValue: string;
  onEdit: (v: string) => void;
  editable?: boolean;
  inputType?: string;
}) {
  const hasValue = field?.value !== null && field?.value !== undefined && field?.value !== "";
  const displayValue = hasValue ? String(field!.value) : null;
  const isNotAvailable = !hasValue;

  const confidenceColor: Record<string, string> = {
    high: "#16a34a",
    medium: "#d97706",
    low: "#dc2626",
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <label style={{ fontWeight: 600, fontSize: 13, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </label>
        {field?.confidence && (
          <span style={{
            fontSize: 10, padding: "2px 7px", borderRadius: 99, fontWeight: 700,
            background: confidenceColor[field.confidence] + "20",
            color: confidenceColor[field.confidence],
          }}>
            {field.confidence.toUpperCase()}
          </span>
        )}
        {field?.source && (
          <span style={{ fontSize: 10, color: "#9ca3af" }}>via {field.source.replace(/_/g, " ")}</span>
        )}
      </div>
      {editable ? (
        <input
          type={inputType}
          value={editValue}
          onChange={(e) => onEdit(e.target.value)}
          placeholder={isNotAvailable ? "Not available from this URL" : undefined}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8, fontSize: 14,
            border: `1.5px solid ${hasValue ? "#6366f1" : "#e5e7eb"}`,
            background: isNotAvailable ? "#f9fafb" : "#fff",
            color: isNotAvailable ? "#9ca3af" : "#111827",
            boxSizing: "border-box" as const,
            outline: "none",
          }}
        />
      ) : (
        <div style={{
          padding: "10px 14px", borderRadius: 8, fontSize: 14,
          border: "1.5px solid #e5e7eb", background: "#f9fafb",
          color: isNotAvailable ? "#9ca3af" : "#374151",
        }}>
          {displayValue || "Not available from provided source"}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ExtractFromMapPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Editable form fields (pre-filled from extraction, fully editable by user)
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editPostal, setEditPostal] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editLocality, setEditLocality] = useState("");

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setApiError(null);
    setProgressStage(0);

    // Simulate stage progression
    const stages = [300, 600, 900, 1200];
    stages.forEach((delay, i) => {
      setTimeout(() => setProgressStage(i + 1), delay);
    });

    try {
      const res: ApiResponse = await api.extractFromMap(url.trim());

      if (!res.success || !res.data) {
        setApiError(res.message || "Could not extract information from this URL.");
        return;
      }

      const data = res.data;
      setResult(data);

      // Pre-fill editable form
      setEditName(String(data.property.name?.value ?? ""));
      setEditAddress(String(data.property.address?.value ?? ""));
      setEditCity(String(data.property.city?.value ?? ""));
      setEditState(String(data.property.state?.value ?? ""));
      setEditCountry(String(data.property.country?.value ?? ""));
      setEditPostal(String(data.property.postalCode?.value ?? ""));
      setEditArea(data.geocoded?.area ?? "");
      setEditLocality(data.geocoded?.locality ?? "");
    } catch (err: any) {
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setProgressStage(4);
    }
  };

  const handleUseDetails = () => {
    if (!result) return;
    const params = new URLSearchParams({
      name: editName,
      address: editAddress,
      city: editCity,
      state: editState,
      country: editCountry,
      postal_code: editPostal,
      area: editArea,
      locality: editLocality,
      latitude: String(result.property.latitude?.value ?? ""),
      longitude: String(result.property.longitude?.value ?? ""),
      google_maps_url: result.googleMaps.sourceUrl ?? "",
    });
    window.location.href = `/dashboard/properties/new?${params.toString()}`;
  };

  const handleClear = () => {
    setUrl("");
    setResult(null);
    setApiError(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff 0%, #f8fafc 100%)", fontFamily: "'Inter', system-ui, sans-serif", padding: "40px 16px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              🗺️
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1a1a2e" }}>Extract Property from Google Maps</h1>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Paste a Google Maps or Street View link to extract available location details</p>
            </div>
          </div>
          <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#92400e", marginTop: 12 }}>
            ⚠️ <strong>Important:</strong> Only factual data from the URL is extracted. Price, property type, and full address are <strong>never fabricated</strong>. Missing fields will clearly show <em>Not available</em>.
          </div>
        </div>

        {/* Input card */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: 28, marginBottom: 24 }}>
          <label style={{ fontWeight: 700, fontSize: 13, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 8 }}>
            Google Maps Link
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
              placeholder="https://www.google.com/maps/place/..."
              style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none" }}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !url.trim()}
              style={{
                padding: "12px 22px", borderRadius: 10, border: "none", cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                background: loading || !url.trim() ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: loading || !url.trim() ? "#9ca3af" : "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" as const,
              }}
            >
              {loading ? "Analyzing..." : "Analyze Link"}
            </button>
            {(url || result) && (
              <button onClick={handleClear} style={{ padding: "12px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", color: "#6b7280", fontSize: 14, fontWeight: 600 }}>
                Clear
              </button>
            )}
          </div>

          {/* Progress */}
          {loading && <ProgressAnimation stage={progressStage} />}

          {/* Error */}
          {apiError && !loading && (
            <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", fontSize: 14 }}>
              ❌ {apiError}
            </div>
          )}
        </div>

        {/* Results */}
        {result && !loading && (
          <>
            {/* Warnings / Duplicate notice */}
            {result.extraction.warnings.length > 0 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                {result.extraction.warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#92400e", marginBottom: 4 }}>⚠️ {w}</div>
                ))}
              </div>
            )}

            {/* Duplicate actions */}
            {result.duplicate && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" as const }}>
                <div style={{ fontSize: 13, color: "#1d4ed8", fontWeight: 600 }}>
                  🔍 Possible existing property found: <em>{result.duplicate.title}</em>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`/properties/${result.duplicate.id}`} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, background: "#1d4ed8", color: "#fff", textDecoration: "none", fontWeight: 600 }}>
                    View Existing
                  </a>
                  <button onClick={handleUseDetails} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 8, border: "1.5px solid #1d4ed8", background: "#fff", color: "#1d4ed8", cursor: "pointer", fontWeight: 600 }}>
                    Create New Anyway
                  </button>
                </div>
              </div>
            )}

            {/* Extraction status badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{
                padding: "6px 16px", borderRadius: 99, fontSize: 13, fontWeight: 700,
                background: result.extraction.status === "partial" ? "#fef9c3" : "#dcfce7",
                color: result.extraction.status === "partial" ? "#a16207" : "#15803d",
              }}>
                {result.extraction.status === "partial" ? "⚡ Partially Extracted" : "✅ Extracted"}
              </div>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>
                {result.extraction.fieldsFound.length} field(s) found · {result.extraction.fieldsMissing.length} not available
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

              {/* ── Basic Information ── */}
              <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e", marginTop: 0, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
                  📍 Basic Information
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af" }}>— review and edit before saving</span>
                </h2>
                <FieldRow label="Place Name" field={result.property.name} editValue={editName} onEdit={setEditName} />
                <FieldRow label="Full Address" field={result.property.address} editValue={editAddress} onEdit={setEditAddress} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <FieldRow label="City" field={result.property.city} editValue={editCity} onEdit={setEditCity} />
                  <FieldRow label="State" field={result.property.state} editValue={editState} onEdit={setEditState} />
                  <FieldRow label="Country" field={result.property.country} editValue={editCountry} onEdit={setEditCountry} />
                  <FieldRow label="Postal Code" field={result.property.postalCode} editValue={editPostal} onEdit={setEditPostal} />
                  <FieldRow label="Area / Main Locality" field={{ value: editArea || null, source: "nominatim_reverse_geocoding", confidence: editArea ? "high" : null }} editValue={editArea} onEdit={setEditArea} />
                  <FieldRow label="Locality Sub-area" field={{ value: editLocality || null, source: "nominatim_reverse_geocoding", confidence: editLocality ? "high" : null }} editValue={editLocality} onEdit={setEditLocality} />
                </div>
              </div>

              {/* ── Property Information ── */}
              <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e", marginTop: 0, marginBottom: 20 }}>🏠 Property Information</h2>
                <FieldRow label="Property Type" field={result.property.propertyType} editValue="" onEdit={() => {}} editable={false} />
                <FieldRow label="Price" field={result.property.price} editValue="" onEdit={() => {}} editable={false} />
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#f9fafb" }}>
                  ℹ️ {result.classification.note}
                </div>
              </div>

              {/* ── Location / Coordinates ── */}
              <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e", marginTop: 0, marginBottom: 20 }}>📡 Coordinates</h2>
                <FieldRow label="Latitude" field={result.property.latitude} editValue={String(result.property.latitude?.value ?? "")} onEdit={() => {}} editable={false} />
                <FieldRow label="Longitude" field={result.property.longitude} editValue={String(result.property.longitude?.value ?? "")} onEdit={() => {}} editable={false} />
                {result.property.latitude?.value && result.property.longitude?.value && (
                  <a
                    href={`https://www.google.com/maps?q=${result.property.latitude.value},${result.property.longitude.value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 8, fontSize: 13, color: "#6366f1", fontWeight: 600 }}
                  >
                    🔗 Open in Google Maps
                  </a>
                )}
              </div>

              {/* ── Google Maps ── */}
              <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e", marginTop: 0, marginBottom: 20 }}>🔍 Google Maps</h2>
                <FieldRow label="Place ID" field={result.googleMaps.placeId} editValue="" onEdit={() => {}} editable={false} />
              </div>

              {/* ── Street View ── */}
              <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e", marginTop: 0, marginBottom: 20 }}>🌆 Street View</h2>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 99,
                  background: result.streetView.available ? "#dcfce7" : "#f3f4f6",
                  color: result.streetView.available ? "#15803d" : "#6b7280",
                  fontWeight: 700, fontSize: 13, marginBottom: 16,
                }}>
                  {result.streetView.available ? "✅ Street View Available" : "❌ Street View Not Detected"}
                </div>
                {result.streetView.available && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {[
                      { label: "Panorama ID", val: result.streetView.panoramaId },
                      { label: "Heading", val: result.streetView.heading != null ? `${result.streetView.heading}°` : null },
                      { label: "Pitch", val: result.streetView.pitch != null ? `${result.streetView.pitch}°` : null },
                      { label: "Field of View", val: result.streetView.fieldOfView != null ? `${result.streetView.fieldOfView}°` : null },
                      { label: "SV Latitude", val: result.streetView.latitude },
                      { label: "SV Longitude", val: result.streetView.longitude },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" as const, marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: val != null ? "#1a1a2e" : "#9ca3af" }}>
                          {val != null ? String(val) : "Not available"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {result.streetView.available && result.streetView.latitude && result.streetView.longitude && (
                  <a
                    href={`https://www.google.com/maps/@${result.streetView.latitude},${result.streetView.longitude},3a,75y,${result.streetView.heading ?? 0}h,90t`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: "#6366f1", fontWeight: 600 }}
                  >
                    🌆 Open Street View
                  </a>
                )}
              </div>

              {/* ── Extraction Status ── */}
              <div style={{ gridColumn: "1 / -1", background: "#f8fafc", borderRadius: 14, border: "1px solid #e5e7eb", padding: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a2e", marginTop: 0, marginBottom: 16 }}>📋 Extraction Status</h2>
                {result.extraction.fieldsMissing.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>
                      Information not available from this link:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                      {result.extraction.fieldsMissing.map((f) => (
                        <span key={f} style={{ padding: "4px 12px", borderRadius: 99, background: "#f3f4f6", color: "#6b7280", fontSize: 12, fontWeight: 600 }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.extraction.fieldsFound.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, color: "#15803d", fontWeight: 600, marginBottom: 8 }}>
                      Successfully extracted:
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                      {result.extraction.fieldsFound.map((f) => (
                        <span key={f} style={{ padding: "4px 12px", borderRadius: 99, background: "#dcfce7", color: "#15803d", fontSize: 12, fontWeight: 600 }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Use Details CTA */}
            <div style={{ marginTop: 24, padding: 24, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
              <div style={{ color: "#fff" }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>Use These Details</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Pre-fill the property creation form with extracted information. You can edit everything before publishing.</div>
              </div>
              <button
                onClick={handleUseDetails}
                style={{
                  padding: "14px 28px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.5)",
                  background: "#fff", color: "#6366f1", fontWeight: 800, fontSize: 15, cursor: "pointer",
                  whiteSpace: "nowrap" as const,
                }}
              >
                📋 Create Property →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
