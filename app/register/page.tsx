"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    router.replace(`/login?mode=signup${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`);
  }, [router]);

  return null;
}
