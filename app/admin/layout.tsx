import type { Metadata } from "next";
import SwRegister from "@/components/swregister";

export const metadata: Metadata = {
  title: "DIFFT Admin",
  manifest: "/admin-manifest.webmanifest",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SwRegister />
      {children}
    </>
  );
}
