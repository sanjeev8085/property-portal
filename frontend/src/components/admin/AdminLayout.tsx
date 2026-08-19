"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard",     icon: "📊", label: "Dashboard" },
  { href: "/admin/properties",    icon: "🏢", label: "Properties" },
  { href: "/admin/users",         icon: "👥", label: "Users" },
  { href: "/admin/reports",       icon: "🚩", label: "Reports" },
  { href: "/admin/payments",      icon: "💳", label: "Payments" },
  { href: "/admin/subscriptions", icon: "📦", label: "Subscriptions" },
  { href: "/admin/featured",      icon: "⭐", label: "Featured" },
  { href: "/admin/analytics",     icon: "📈", label: "Analytics" },
  { href: "/admin/locations",     icon: "📍", label: "Locations" },
  { href: "/admin/categories",    icon: "🏷️", label: "Categories" },
  { href: "/admin/notifications", icon: "📣", label: "Notifications" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userType = localStorage.getItem("user_type");

    if (!token || userType !== "admin") {
      setIsAuthorized(false);
      const timer = setTimeout(() => {
        window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsAuthorized(true);
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    // Also clear admin cookies
    document.cookie = "admin_token=; max-age=0; path=/";
    document.cookie = "user_type=; max-age=0; path=/";
    window.location.href = "/admin/login";
  };

  if (isAuthorized === false) {
    return (
      <div className="al-unauth-container">
        <div className="al-unauth-card premium-card">
          <span style={{ fontSize: "52px" }}>🔒</span>
          <h2>Admin Authorization Required</h2>
          <p style={{ margin: "12px 0 20px", color: "var(--text-secondary)", fontSize: "14px" }}>
            This system console contains restricted administrative data. You must sign in with verified administrator credentials to access this area.
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
            Redirecting to secure login...
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <a href="/admin/login" className="btn-primary btn-sm">Sign In as Admin</a>
            <a href="/" className="btn-secondary btn-sm">Return to Main Site</a>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .al-unauth-container {
            min-height: 100vh;
            background: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
          }
          .al-unauth-card {
            max-width: 440px;
            width: 100%;
            padding: 40px 28px;
            text-align: center;
            background: white;
            border-radius: var(--radius-lg);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          }
        `}} />
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="al-unauth-container" style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🛡️</div>
          <p style={{ fontSize: "15px", fontWeight: 600 }}>Verifying Administrator Credentials…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="al-root">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="al-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`al-sidebar ${sidebarOpen ? "al-sidebar-open" : ""}`}>
        {/* Logo */}
        <div className="al-logo">
          <span className="al-logo-icon">🛡️</span>
          <span className="al-logo-text">AuraAdmin</span>
        </div>

        {/* Nav */}
        <nav className="al-nav">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
            return (
              <a
                key={item.href}
                href={item.href}
                className={`al-nav-item ${active ? "al-nav-active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="al-nav-icon">{item.icon}</span>
                <span className="al-nav-label">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="al-nav-badge">{item.badge}</span>
                ) : null}
              </a>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="al-sidebar-footer">
          <a href="/" className="al-back-site">
            ← Main Site
          </a>
          <button type="button" className="al-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="al-main">
        {/* Top header */}
        <header className="al-header">
          <button
            type="button"
            className="al-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <div className="al-header-titles">
            {title && <h1 className="al-title">{title}</h1>}
            {subtitle && <p className="al-subtitle">{subtitle}</p>}
          </div>

          <div className="al-header-actions">
            <span className="al-badge-role">Admin Console</span>
          </div>
        </header>

        {/* Page body */}
        <main className="al-content">{children}</main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .al-root {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
          font-family: var(--font-body);
        }

        /* ── Sidebar ── */
        .al-sidebar {
          width: 240px;
          background: #0f172a;
          color: #94a3b8;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          z-index: 50;
          transition: transform 0.25s ease;
        }
        .al-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 24px 20px 20px;
          border-bottom: 1px solid #1e293b;
        }
        .al-logo-icon { font-size: 24px; }
        .al-logo-text {
          font-family: var(--font-heading);
          font-size: 18px;
          font-weight: 800;
          color: #f8fafc;
        }

        .al-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
        }
        .al-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #94a3b8;
          text-decoration: none;
          font-size: 13.5px;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }
        .al-nav-item:hover {
          background: #1e293b;
          color: #f8fafc;
        }
        .al-nav-active {
          background: #1d4ed8 !important;
          color: #ffffff !important;
          font-weight: 600;
        }
        .al-nav-icon { font-size: 16px; width: 20px; text-align: center; }
        .al-nav-label { flex: 1; }
        .al-nav-badge {
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 99px;
        }

        .al-sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid #1e293b;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .al-back-site {
          font-size: 12px;
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s;
        }
        .al-back-site:hover { color: #94a3b8; }
        .al-logout-btn {
          background: none;
          border: 1px solid #334155;
          color: #f87171;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .al-logout-btn:hover {
          background: #1e293b;
          border-color: #ef4444;
        }

        /* ── Main area ── */
        .al-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .al-header {
          background: #ffffff;
          border-bottom: 1px solid var(--border);
          padding: 18px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .al-hamburger {
          display: none;
          background: none;
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 18px;
          cursor: pointer;
        }
        .al-header-titles {}
        .al-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .al-subtitle {
          font-size: 12.5px;
          color: var(--text-muted);
        }
        .al-badge-role {
          font-size: 11px;
          font-weight: 700;
          color: #3b82f6;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 4px 10px;
          border-radius: 99px;
        }
        .al-content {
          flex: 1;
          padding: 28px;
          max-width: 1400px;
          width: 100%;
        }

        /* ── Mobile overlay ── */
        .al-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 49;
        }

        @media (max-width: 900px) {
          .al-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
          }
          .al-sidebar-open {
            transform: translateX(0);
          }
          .al-overlay { display: block; }
          .al-hamburger { display: flex; }
          .al-content { padding: 20px 16px; }
        }
      `}} />
    </div>
  );
}
