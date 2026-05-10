"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("axion_jwt");
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!token && !isPublicRoute) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // Prevent flash of protected content
  if (!isAuthorized && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
