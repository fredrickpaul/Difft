import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg,#4f46e5,#7c6cf2)",
          color: "#fff",
          fontSize: 300,
          fontWeight: 800,
        }}
      >
        D
      </div>
    ),
    { width: 512, height: 512 }
  );
}
