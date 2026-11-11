import Link from "next/link";
import WalletBar from "./WalletBar";

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-md space-y-2 bg-gray-50 px-4 pt-4">
        <WalletBar />
        <Link
          href="/orders"
          className="block text-right text-sm text-[#6057E8]"
        >
          My Orders
        </Link>
      </div>
      {children}
    </>
  );
}
