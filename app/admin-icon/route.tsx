import { ImageResponse } from "next/og";

export async function GET(req: Request) {
  const size = new URL(req.url).searchParams.get("s") === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#0f5c5c,#134e4a)",
        }}
      >
        <svg width={size * 0.7} height={size * 0.7} viewBox="5 0 100 100">
          <path
            fillRule="evenodd"
            fill="#ffffff"
            d="M24 16 H50 C72 16 86 30 86 50 C86 70 72 84 50 84 H24 Z M40 30 V70 H49 C62 70 70 62 70 50 C70 38 62 30 49 30 Z"
          />
          <polyline points="46,62 54,54 59,58 66,45" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="59,45 66,45 66,52" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="86" cy="18" r="9" fill="#22c55e" stroke="#ffffff" strokeWidth="3" />
        </svg>
      </div>
    ),
    { width: size, height: size }
  );
}
