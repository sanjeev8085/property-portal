"use client";

import React, { useEffect, useState } from "react";
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
  { href: "/plans", icon: "💎", label: "Plans" },
  { href: "/account/profile", icon: "👤", label: "Account" },
];

interface BottomNavProps {
  notificationCount?: number;
}

export default function BottomNav({ notificationCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("access_token"));
  }, []);

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const isPost = item.icon === "+";
          const targetHref = item.label === "Account" && !isLoggedIn ? "/login" : item.href;

          return (
            <a
              key={item.href}
              href={targetHref}
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
                <span className="icon-post" aria-label="Post Property">{item.icon}</span>
              ) : (
                <>
                  <span className="icon" style={{ position: "relative" }}>
                    {item.icon}
                    {item.label === "Account" && notificationCount > 0 && (
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
            background: var(--surface);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border-top: 1px solid var(--border);
            z-index: 200;
            padding: 6px 0 max(8px, env(safe-area-inset-bottom, 0px));
            justify-content: space-around;
            align-items: center;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
          }
          .mobile-nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            min-width: 52px;
            text-decoration: none;
            transition: color 0.15s ease;
          }
          .mobile-nav-item .icon {
            font-size: 20px;
            display: block;
            line-height: 1;
          }
          .mobile-nav-item .label {
            font-size: 10px;
            font-family: var(--font-body);
            line-height: 1.2;
          }
          .mobile-nav-post {
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            border-radius: 50%;
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2px;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          }
          .icon-post {
            color: white;
            font-size: 26px;
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
