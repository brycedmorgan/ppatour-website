import { ImageResponse } from "next/og";
import { OG_SIZE, ogFonts, ogImageData } from "@/lib/og";
import {
  eventYear,
  formatDateRange,
  tierPoints,
  tierShort,
  tournaments,
} from "@/lib/placeholder-data";

export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ year: string; slug: string }>;
}) {
  const { year, slug } = await params;
  const t =
    tournaments.find((x) => x.slug === slug && eventYear(x) === year) ?? tournaments[0];
  const accent = t.brand?.accent ?? "#228be6";
  const [fonts, bg, icon] = await Promise.all([
    ogFonts(),
    ogImageData(t.image),
    t.brand?.icon ? ogImageData(t.brand.icon) : Promise.resolve(null),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#07223a",
          fontFamily: "Gotham",
          position: "relative",
        }}
      >
        {bg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage:
              "linear-gradient(to top, rgba(7,34,58,0.96) 8%, rgba(7,34,58,0.55) 45%, rgba(7,34,58,0.15) 100%)",
          }}
        />

        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "44px 56px 0",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 8, background: accent }} />
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 6,
                color: "#ffffff",
              }}
            >
              CARVANA PPA TOUR
            </div>
          </div>
          {icon && (
            <div
              style={{
                display: "flex",
                background: "#ffffff",
                padding: "14px 18px",
                borderRadius: 6,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon} alt="" style={{ height: 84 }} />
            </div>
          )}
        </div>

        {/* Bottom block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            padding: "0 56px 40px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                background: accent,
                color: "#ffffff",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 3,
                padding: "8px 16px",
              }}
            >
              {`${tierShort(t).toUpperCase()} · ${tierPoints(t).toLocaleString()} PTS`}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 500,
                color: "rgba(255,255,255,0.85)",
                letterSpacing: 2,
              }}
            >
              {`${formatDateRange(t.startDate, t.endDate).toUpperCase()} · ${t.city.toUpperCase()}${t.state ? ", " + t.state : ""}`}
            </div>
          </div>
          <div
            style={{
              fontSize: t.shortName.length > 18 ? 68 : 84,
              maxWidth: 1080,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.02,
              marginTop: 18,
              textTransform: "uppercase",
            }}
          >
            {t.shortName}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginTop: 16,
              fontSize: 26,
              fontWeight: 900,
              color: "#e7e700",
              letterSpacing: 2,
            }}
          >
            {`${t.prizeMoney} ON THE LINE · TICKETS FROM $${t.ticketPriceFrom}`}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: 14,
            background: accent,
            position: "relative",
          }}
        />
      </div>
    ),
    { ...size, fonts },
  );
}
