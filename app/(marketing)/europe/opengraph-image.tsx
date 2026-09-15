import { ImageResponse } from "next/og";
import { OG_SIZE, ogFonts, ogImageData } from "@/lib/og";

/**
 * Share card for /europe.
 *
 * ⚠ WITHOUT THIS FILE THE PAGE HAS NO SHARE IMAGE AT ALL. `page.tsx` sets its
 * own `openGraph` block to displace the root one (which reads "Carvana PPA
 * Tour" and draws the Carvana lockup). That block carries no `images`, so from
 * the moment it shipped every paste of this link fell back to whatever the
 * scraper could find on the page — Slack picked the Barcelona hero photo, with
 * no title card and no branding. Payton flagged it 2026-09-15.
 *
 * A file-based `opengraph-image` wins over anything named in metadata, so this
 * is the one place the Europe card can live.
 *
 * ⚠ THE WORDMARK IS TEXT, NOT AN IMAGE, AND THAT IS DELIBERATE. The root card
 * loads `ppa-horizontal-white.png` because it needs the full Carvana lockup as
 * artwork. Europe needs the words "PPA TOUR", which `ogFonts()` already loads
 * Gotham Black for. An attempt to ship a cropped PNG of the lockup produced an
 * OPAQUE WHITE RECTANGLE — `qlmanage` rasterises SVG onto a white background,
 * and the file passed every check (dimensions, byte count, RGBA colour type,
 * and viewing it directly, since white-on-transparent renders as white) before
 * a navy composite revealed it. Satori drops a malformed image silently;
 * it renders text reliably. Do not reintroduce a raster here.
 *
 * ⚠ Satori needs explicit numeric dimensions and an explicit `display` on any
 * container with children. `width: "auto"` renders nothing.
 */

export const alt = "PPA Tour Europe — professional pickleball across Europe";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function EuropeOpengraphImage() {
  const [fonts, bg] = await Promise.all([
    ogFonts(),
    // ⚠ The only Europe photograph in the repo. `public/europe/` holds the 26
    // pro portraits and nothing else. Catie's first-event photos (promised
    // 9/3) are the upgrade when they land.
    ogImageData("/ppa/event-barcelona.jpg"),
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
            display: "flex",
            backgroundImage:
              "linear-gradient(to top, rgba(7,34,58,0.96) 10%, rgba(7,34,58,0.5) 55%, rgba(7,34,58,0.2) 100%)",
          }}
        />
        {/* Top scrim so the wordmark reads over the bright Barcelona sky. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "42%",
            display: "flex",
            backgroundImage:
              "linear-gradient(to bottom, rgba(7,34,58,0.6), rgba(7,34,58,0))",
          }}
        />

        {/* Wordmark — mirrors the site header: PPA TOUR | EUROPE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "46px 56px 0",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 1,
              display: "flex",
            }}
          >
            PPA TOUR
          </div>
          <div
            style={{
              width: 2,
              height: 34,
              background: "rgba(255,255,255,0.35)",
              margin: "0 20px",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: "#ffffff",
              letterSpacing: 4,
              display: "flex",
            }}
          >
            EUROPE
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            padding: "0 56px 40px",
            position: "relative",
          }}
        >
          {/* The page's own H1, not new copy. */}
          <div
            style={{
              fontSize: 82,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.0,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Professional Pickleball,
          </div>
          <div
            style={{
              fontSize: 82,
              fontWeight: 900,
              color: "#4dc1ef",
              lineHeight: 1.0,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Across Europe
          </div>
          {/* Counted off the live roster section, not estimated. */}
          <div
            style={{
              fontSize: 25,
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
              marginTop: 18,
              letterSpacing: 2,
              display: "flex",
            }}
          >
            26 SIGNED PROS · 13 COUNTRIES · THE EUROPEAN TOUR
          </div>
        </div>
        <div
          style={{
            display: "flex",
            height: 14,
            background: "#228be6",
            position: "relative",
          }}
        />
      </div>
    ),
    { ...size, fonts },
  );
}
