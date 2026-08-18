"use client";

import React, { useState } from "react";
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

  const handleLogout = () => {
    api.logout();
    // Also clear admin cookies
    document.cookie = "admin_token=; max-age=0; path=/";
    document.cookie = "user_type=; max-age=0; path=/";
    window.location.href = "/admin/login";
  };

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
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="al-header-title">
            {title && <h1 className="al-page-title">{title}</h1>}
            {subtitle && <p className="al-page-subtitle">{subtitle}</p>}
          </div>
          <div className="al-header-right">
            <span className="al-admin-tag">🛡️ Admin</span>
          </div>
        </header>

        {/* Page content */}
        <main className="al-content">{children}</main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .al-root {
          display: flex;
          min-height: 100vh;
          background: #f1f5f9;
          font-family: var(--font-body);
        }

        /* ── Sidebar ── */
        .al-sidebar {
          width: 240px;
          flex-shrink: 0;
          background: #0f172a;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          z-index: 50;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .al-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .al-logo-icon { font-size: 24px; }
        .al-logo-text {
          font-family: var(--font-heading);
          font-size: 20px;
          font-weight: 800;
          background: linear-gradient(135deg, #60a5fa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .al-nav {
          flex: 1;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .al-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 13.5px;
          font-weight: 500;
          transition: background 0.15s, color 0.15s;
          position: relative;
        }
        .al-nav-item:hover {
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
        }
        .al-nav-active {
          background: rgba(96,165,250,0.12) !important;
          color: #60a5fa !important;
          font-weight: 600;
        }
        .al-nav-icon { font-size: 16px; flex-shrink: 0; width: 20px; text-align: center; }
        .al-nav-label { flex: 1; }
        .al-nav-badge {
          background: #ef4444;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 99px;
          min-width: 18px;
          text-align: center;
        }
        .al-sidebar-footer {
          padding: 16px 10px;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
        }
        .al-back-site {
          color: #64748b;
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 6px;
          transition: color 0.15s;
        }
        .al-back-site:hover { color: #94a3b8; }
        .al-logout-btn {
          background: rgba(239,68,68,0.1);
          color: #f87171;
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }
        .al-logout-btn:hover { background: rgba(239,68,68,0.18); }

        /* ── Main ── */
        .al-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .al-header {
          background: white;
          border-bottom: 1px solid var(--border);
          padding: 0 28px;
          height: 64px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: var(--shadow-sm);
        }
        .al-hamburger {
          display: none;
          background: none;
          border: none;
          font-size: 22px;
          cursor: pointer;
          color: var(--text-primary);
          padding: 4px 8px;
          border-radius: 6px;
        }
        .al-hamburger:hover { background: var(--surface-hover); }
        .al-header-title { flex: 1; }
        .al-page-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .al-page-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .al-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .al-admin-tag {
          font-size: 12px;
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
