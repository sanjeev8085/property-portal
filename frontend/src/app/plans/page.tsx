"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  price: number;
  contact_limit: number;
  validity_days: number;
  description: string | null;
  is_featured: boolean;
  sort_order: number;
}

const FREE_PLAN = {
  id: "free",
  name: "Free",
  price: 0,
  contact_limit: 0,
  validity_days: 0,
  description: "Ideal for basic home searchers. Browse listings with no contact access.",
  is_featured: false,
  sort_order: -1,
};

const PLAN_PERKS: Record<string, string[]> = {
  free: [
    "Browse residential/commercial listings",
    "Save favorite properties",
    "Create up to 2 property search alerts",
    "Contact details locked",
  ],
  default: [
    "Browse all listings",
    "Save favorite properties",
    "Unlock owner contacts directly",
  ],
};

function getPlanAccent(index: number): string {
  const accents = ["#64748b", "var(--secondary)", "var(--primary)", "var(--accent)"];
  return accents[index % accents.length];
}

function formatPrice(price: number): string {
  if (price === 0) return "\u20b90";
  if (price >= 10000000) return `\u20b9${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `\u20b9${(price / 100000).toFixed(2)} Lakh`;
  return `\u20b9${price.toLocaleString("en-IN")}`;
}

function PlanSkeleton() {
  return (
    <div className="premium-card plan-card" style={{ opacity: 0.5, animation: "pulse 1.5s infinite" }}>
      <div style={{ height: 24, background: "#e2e8f0", borderRadius: 6, marginBottom: 12 }} />
      <div style={{ height: 40, background: "#e2e8f0", borderRadius: 6, marginBottom: 8, width: "60%" }} />
      <div style={{ height: 16, background: "#e2e8f0", borderRadius: 6, marginBottom: 24, width: "40%" }} />
      <div style={{ height: 100, background: "#f1f5f9", borderRadius: 6 }} />
    </div>
  );
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api.getPlans().then((data: Plan[]) => {
      if (!mounted) return;
      if (data && data.length > 0) {
        setPlans(data);
      } else {
        setError("Plans could not be loaded. Please try again later.");
      }
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      setError("Unable to load plans. Please check your connection.");
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const allPlans = [FREE_PLAN as unknown as Plan, ...plans];

  const handlePlanClick = (planId: string, price: number) => {
    if (price === 0) {
      window.location.href = "/search";
    } else {
      window.location.href = `/checkout/${planId}`;
    }
  };

  return (
    <div className="plans-page-container fade-in">
      <div className="plans-header">
        <h1>Monetized Contact Access Packages</h1>
        <p>
          AuraHomes operates under a credit system to eliminate listing spam and protect owners&apos; privacy.
          Select a bundle that fits your property search journey.
        </p>
      </div>

      {error && (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--danger, #ef4444)" }}>
          <p>{error}</p>
          <button
            className="btn-secondary"
            style={{ marginTop: "1rem" }}
            onClick={() => { setError(null); setLoading(true); api.getPlans().then((d: Plan[]) => { setPlans(d); setLoading(false); }); }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="plans-grid">
        {loading ? (
          // Skeleton loader while fetching from DB
          [0, 1, 2, 3].map((i) => <PlanSkeleton key={i} />)
        ) : (
          allPlans.map((plan, index) => {
            const accent = getPlanAccent(index);
            const isFree = plan.price === 0;
            const perks = isFree
              ? PLAN_PERKS.free
              : [
                  ...(PLAN_PERKS.default),
                  `Unlock ${plan.contact_limit} owner contacts`,
                  plan.validity_days > 0 ? `Validity: ${plan.validity_days} Days` : null,
                ].filter(Boolean) as string[];

            const ctaLabel = isFree
              ? "Browse Properties Free"
              : `Get ${plan.name}`;

            return (
              <div
                key={plan.id}
                className={`premium-card plan-card ${plan.is_featured ? "featured" : ""}`}
              >
                {plan.is_featured && (
                  <div className="popular-ribbon">Most Popular</div>
                )}

                <div className="plan-meta">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-price">{formatPrice(plan.price)}</p>
                  <p className="plan-credits" style={{ color: accent }}>
                    {isFree
                      ? "0 Credits included"
                      : `${plan.contact_limit} Contact Credits`}
                  </p>
                  <p className="plan-desc">
                    {plan.description || (isFree ? "Ideal for basic home searchers." : `Best for ${plan.contact_limit} owner contacts.`)}
                  </p>
                </div>

                <div className="divider" />

                <ul className="plan-perks-list">
                  {perks.map((perk, j) => (
                    <li key={j}>{perk}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  id={`plan-cta-${plan.id}`}
                  className={`plan-cta-btn ${plan.is_featured ? "btn-primary" : "btn-secondary"}`}
                  style={{ borderColor: plan.is_featured ? "transparent" : accent }}
                  onClick={() => handlePlanClick(plan.id, plan.price)}
                >
                  {ctaLabel}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
