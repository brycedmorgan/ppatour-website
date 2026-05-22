import { ImageResponse } from "next/og";

export const alt = "Carvana PPA Tour — The Pro Tour of Pickleball";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0c2b44",
          color: "#ffffff",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 8, background: "#228be6" }} />
          <div
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 7,
              color: "#cbd5e1",
            }}
          >
            CARVANA PPA TOUR
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, fontWeight: 900, lineHeight: 1 }}>
            THE PRO TOUR
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 900,
              lineHeight: 1,
              color: "#228be6",
            }}
          >
            OF PICKLEBALL
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              fontWeight: 700,
              color: "#e7e700",
            }}
          >
            Live scores · The points race · 18 main-tour stops
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 20,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            color: "#94a3b8",
          }}
        >
          <div>WORLDS</div>
          <div>·</div>
          <div>SLAMS</div>
          <div>·</div>
          <div>CUPS</div>
          <div>·</div>
          <div>OPENS</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
