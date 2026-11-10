import WalletBar from "./WalletBar";

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mx-auto max-w-md bg-gray-50 px-4 pt-4">
        <WalletBar />
      </div>
      {children}
    </>
  );
}
