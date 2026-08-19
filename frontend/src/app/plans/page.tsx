"use client";

import React from "react";

export default function PlansPage() {
  const plans = [
    {
      id: "free",
      name: "Free",
      price: "₹0",
      description: "Ideal for basic home searchers.",
      credits: "0 Credits included",
      perks: [
        "Browse residential/commercial listings",
        "Save favorite properties",
        "Create up to 2 property search alerts",
        "❌ Contact details locked"
      ],
      cta: "Browse Properties Free",
      featured: false,
      accent: "#64748b"
    },
    {
      id: "basic",
      name: "Basic Bundle",
      price: "₹99",
      description: "Best for casual home hunting.",
      credits: "5 Contact Credits",
      perks: [
        "Browse all residential/commercial listings",
        "Save favorite properties",
        "Create up to 5 property search alerts",
        "Unlock 5 owner contacts directly",
        "Validity: 30 days"
      ],
      cta: "Get Basic Bundle",
      featured: false,
      accent: "var(--secondary)"
    },
    {
      id: "standard",
      name: "Standard Package",
      price: "₹199",
      description: "Recommended for serious renters and buyers.",
      credits: "15 Contact Credits",
      perks: [
        "Browse all listings",
        "Save favorite properties",
        "Create up to 15 property search alerts",
        "Unlock 15 owner contacts directly",
        "Priority customer support",
        "Validity: 30 Days"
      ],
      cta: "Get Standard Package",
      featured: true,
      accent: "var(--primary)"
    },
    {
      id: "premium",
      name: "Premium Package",
      price: "₹399",
      description: "For active agents or heavy investors.",
      credits: "50 Contact Credits",
      perks: [
        "Browse all listings",
        "Save favorite properties",
        "Unlimited property search alerts",
        "Unlock 50 owner contacts directly",
        "Premium priority support",
        "Validity: 60 Days"
      ],
      cta: "Get Premium Package",
      featured: false,
      accent: "var(--accent)"
    }
  ];

  const handlePlanClick = (planId: string) => {
    if (planId === "free") {
      window.location.href = "/search";
    } else {
      window.location.href = `/checkout/${planId}`;
    }
  };

  return (
    <div className="plans-page-container fade-in">
      <div className="plans-header">
        <h1>Monetized Contact Access Packages</h1>
        <p>AuraHomes operates under a credit system to eliminate listing spam and protect owners&apos; privacy. Select a bundle that fits your property search journey.</p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`premium-card plan-card ${plan.featured ? "featured" : ""}`}>
            {plan.featured && <div className="popular-ribbon">Most Popular</div>}
            
            <div className="plan-meta">
              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-price">{plan.price}</p>
              <p className="plan-credits" style={{ color: plan.accent }}>{plan.credits}</p>
              <p className="plan-desc">{plan.description}</p>
            </div>

            <div className="divider"></div>

            <ul className="plan-perks-list">
              {plan.perks.map((perk, j) => (
                <li key={j}>{perk}</li>
              ))}
            </ul>

            <button 
              type="button" 
              className={`plan-cta-btn ${plan.featured ? "btn-primary" : "btn-secondary"}`}
              style={{ borderColor: plan.featured ? "transparent" : plan.accent }}
              onClick={() => handlePlanClick(plan.id)}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
