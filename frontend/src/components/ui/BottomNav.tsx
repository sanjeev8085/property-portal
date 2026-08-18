"use client";

import React from "react";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: "🏠", label: "Home", exact: true },
  { href: "/search", icon: "🔍", label: "Search" },
  { href: "/dashboard/properties/new", icon: "+", label: "", exact: true },
  { href: "/dashboard", icon: "❤️", label: "Saved" },
  { href: "/account/profile", icon: "👤", label: "Profile" },
];

interface BottomNavProps {
  notificationCount?: number;
}

export default function BottomNav({ notificationCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const isPost = item.icon === "+" ;
          return (
            <a
              key={item.href}
              href={item.href}
              className={[
                "mobile-nav-item",
                isPost ? "mobile-nav-post" : "",
                active && !isPost ? "mobile-nav-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={active ? "page" : undefined}
            >
              {isPost ? (
                <span className="icon-post">{item.icon}</span>
              ) : (
                <>
                  <span className="icon" style={{ position: "relative" }}>
                    {item.icon}
                    {item.label === "Profile" && notificationCount > 0 && (
                      <span className="bottom-nav-badge">
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </span>
                    )}
                  </span>
                  {item.label && <span className="label">{item.label}</span>}
                </>
              )}
            </a>
          );
        })}
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        .mobile-bottom-nav {
          display: none;
        }
        .mobile-nav-active .icon,
        .mobile-nav-active .label {
          color: var(--primary);
        }
        .bottom-nav-badge {
          position: absolute;
          top: -4px;
          right: -6px;
          background: var(--error);
          color: white;
          font-size: 9px;
          font-weight: 800;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          line-height: 1;
          border: 1.5px solid var(--surface);
        }
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: var(--glass-bg);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-top: 1px solid var(--glass-border);
            z-index: 200;
            padding: 8px 0 max(8px, env(safe-area-inset-bottom));
            justify-content: space-around;
            align-items: center;
          }
          .mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            font-size: 10px;
            font-weight: 500;
            color: var(--text-muted);
            min-width: 48px;
            transition: color 0.15s ease;
          }
          .mobile-nav-item .icon {
            font-size: 22px;
            display: block;
          }
          .mobile-nav-item .label {
            font-size: 10px;
            font-family: var(--font-body);
          }
          .mobile-nav-post {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 50%;
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 4px;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          }
          .icon-post {
            color: white;
            font-size: 28px;
            font-weight: 300;
            line-height: 1;
          }
          .mobile-nav-active .icon {
            color: var(--primary);
          }
          .mobile-nav-active .label {
            color: var(--primary);
            font-weight: 700;
          }
        }
      `}} />
    </>
  );
}
