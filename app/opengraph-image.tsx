import { ImageResponse } from "next/og";
import { OG_SIZE, ogFonts, ogImageData } from "@/lib/og";

export const alt = "Carvana PPA Tour — The Pro Tour of Pickleball";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpengraphImage() {
  const [fonts, bg, logo] = await Promise.all([
    ogFonts(),
    ogImageData("/ppa/nationals-championship-court.jpg"),
    ogImageData("/ppa/logos/ppa-horizontal-white.png"),
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
              "linear-gradient(to top, rgba(7,34,58,0.96) 10%, rgba(7,34,58,0.5) 55%, rgba(7,34,58,0.2) 100%)",
          }}
        />

        {/* Top scrim so the white logo reads over a bright sky in the photo. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "42%",
            backgroundImage:
              "linear-gradient(to bottom, rgba(7,34,58,0.6), rgba(7,34,58,0))",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "46px 56px 0",
            position: "relative",
          }}
        >
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            // Satori needs explicit numeric dimensions — "auto" renders nothing.
            // Logo is 700x74 (ratio 9.46), so 400x42 keeps it exact.
            <img src={logo} alt="" width={400} height={42} />
          )}
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
          <div
            style={{
              fontSize: 92,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.0,
              textTransform: "uppercase",
            }}
          >
            The Pro Tour
          </div>
          <div
            style={{
              fontSize: 92,
              fontWeight: 900,
              color: "#4dc1ef",
              lineHeight: 1.0,
              textTransform: "uppercase",
            }}
          >
            of Pickleball
          </div>
          <div
            style={{
              fontSize: 25,
              fontWeight: 500,
              color: "rgba(255,255,255,0.8)",
              marginTop: 18,
              letterSpacing: 2,
            }}
          >
            LIVE SCORES · THE POINTS RACE · EVERY MAIN-TOUR STOP
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
