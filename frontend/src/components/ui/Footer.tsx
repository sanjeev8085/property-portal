import React from "react";

const FOOTER_LINKS = {
  Discover: [
    { label: "Rent a Property", href: "/search?purpose=rent" },
    { label: "Buy a Property", href: "/search?purpose=sell" },
    { label: "Commercial Spaces", href: "/search?category=commercial" },
    { label: "New Projects", href: "/search?is_new=true" },
    { label: "Verified Listings", href: "/search?is_verified=true" },
  ],
  Company: [
    { label: "About AuraHomes", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Pricing Plans", href: "/plans" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
  ],
  Owners: [
    { label: "Post a Property", href: "/dashboard/properties/new" },
    { label: "Owner Dashboard", href: "/dashboard" },
    { label: "Manage Listings", href: "/dashboard/properties" },
    { label: "Subscription Plans", href: "/plans" },
  ],
};

const SOCIAL = [
  { label: "Twitter / X", href: "https://twitter.com", icon: "𝕏" },
  { label: "Instagram", href: "https://instagram.com", icon: "📸" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "💼" },
  { label: "YouTube", href: "https://youtube.com", icon: "▶" },
];

const CITIES = [
  "Bhopal", "Indore", "Jaipur", "Pune", "Mumbai",
  "Bengaluru", "Hyderabad", "Noida", "Delhi", "Chennai",
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Brand + Description */}
        <div className="footer-brand-col">
          <a href="/" className="footer-logo">
            <span className="footer-logo-icon">🏠</span>
            <span className="footer-logo-text">AuraHomes</span>
          </a>
          <p className="footer-tagline">
            India&apos;s trusted marketplace for verified residential and commercial
            property listings. Find your perfect space with zero hassle.
          </p>
          <div className="footer-social">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.label}
                className="footer-social-btn"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Link Columns */}
        {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
          <div key={heading} className="footer-link-col">
            <h4 className="footer-col-heading">{heading}</h4>
            <ul className="footer-link-list">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="footer-link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Popular Cities */}
      <div className="footer-cities-strip">
        <span className="cities-label">Browse by city:</span>
        {CITIES.map((city) => (
          <a
            key={city}
            href={`/search?location=${encodeURIComponent(city)}`}
            className="city-chip"
          >
            {city}
          </a>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-left-group">
          <p className="footer-copy">
            © {year} AuraHomes Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="footer-developer-credit">
            Designed &amp; Developed by{" "}
            <a
              href="https://sanjeev-portfolio-iota.vercel.app/?ref=aurahomes"
              target="_blank"
              rel="noopener noreferrer"
              className="developer-credit-link"
              title="Website Designer & Web Developer in Bhopal | Sanjeev Tyagi"
            >
              <span className="developer-name">Sanjeev Tyagi</span>
              <span className="developer-title"> — Website Designer &amp; Web Developer in Bhopal</span>
            </a>
          </div>
        </div>
        <div className="footer-badges">
          <span className="footer-badge">🔒 SSL Secured</span>
          <span className="footer-badge">✅ RERA Compliant</span>
          <span className="footer-badge">🇮🇳 Made in India</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .site-footer {
          background: var(--text-primary);
          color: #94a3b8;
          font-family: var(--font-body);
          margin-top: 80px;
          padding-bottom: max(0px, env(safe-area-inset-bottom));
        }

        .footer-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 64px 24px 40px;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 40px;
        }

        /* Brand column */
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-heading);
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 16px;
        }
        .footer-logo-icon { font-size: 26px; }
        .footer-logo-text {
          background: linear-gradient(135deg, #60a5fa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .footer-tagline {
          font-size: 13.5px;
          line-height: 1.7;
          color: #64748b;
          margin-bottom: 24px;
          max-width: 280px;
        }
        .footer-social {
          display: flex;
          gap: 10px;
        }
        .footer-social-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: background 0.15s, transform 0.15s;
          color: #94a3b8;
        }
        .footer-social-btn:hover {
          background: rgba(255,255,255,0.12);
          transform: translateY(-2px);
          color: white;
        }

        /* Link columns */
        .footer-link-col {}
        .footer-col-heading {
          font-family: var(--font-heading);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #e2e8f0;
          margin-bottom: 16px;
        }
        .footer-link-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .footer-link {
          font-size: 13.5px;
          color: #64748b;
          transition: color 0.15s;
          display: inline-block;
        }
        .footer-link:hover { color: #e2e8f0; }

        /* Cities strip */
        .footer-cities-strip {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .cities-label {
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          white-space: nowrap;
          margin-right: 4px;
        }
        .city-chip {
          font-size: 12px;
          padding: 3px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #64748b;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .city-chip:hover {
          background: rgba(96,165,250,0.1);
          border-color: rgba(96,165,250,0.3);
          color: #93c5fd;
        }

        /* Bottom bar */
        .footer-bottom {
          max-width: 1280px;
          margin: 0 auto;
          padding: 20px 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .footer-copy {
          font-size: 12px;
          color: #475569;
        }
        .footer-left-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .footer-developer-credit {
          font-size: 12px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }
        .developer-credit-link {
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .developer-credit-link:hover {
          color: #60a5fa;
          text-decoration: underline;
        }
        .developer-name {
          font-weight: 700;
          background: linear-gradient(135deg, #60a5fa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .developer-title {
          color: #64748b;
          font-weight: 400;
        }
        .developer-credit-link:hover .developer-title {
          color: #94a3b8;
        }
        .footer-badges {
          display: flex;
          gap: 12px;
        }
        .footer-badge {
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
        }

        @media (max-width: 960px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .footer-brand-col {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 768px) {
          .site-footer {
            padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px));
          }
        }
        @media (max-width: 600px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
            padding: 48px 16px 32px;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .footer-badges { flex-wrap: wrap; gap: 8px; }
        }
      `}} />
    </footer>
  );
}
