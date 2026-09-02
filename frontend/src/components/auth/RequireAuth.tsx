"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Client-side route gate for areas backed by the bearer token in localStorage. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("access_token");
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setAuthorized(true);
  }, [pathname, router]);

  if (!authorized) {
    return (
      <main aria-busy="true" style={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
        Redirecting to login…
      </main>
    );
  }

  return <>{children}</>;
}
