import { ImageResponse } from "next/og";
import { OG_SIZE, ogFonts, ogImageData } from "@/lib/og";
import { getArticle, newsArticles } from "@/lib/news-articles";

export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = getArticle(slug) ?? newsArticles[0];
  const [fonts, bg] = await Promise.all([ogFonts(), ogImageData(a.image)]);

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
              "linear-gradient(to top, rgba(7,34,58,0.97) 15%, rgba(7,34,58,0.6) 55%, rgba(7,34,58,0.2) 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "44px 56px 0",
            position: "relative",
          }}
        >
          <div style={{ width: 52, height: 8, background: "#228be6" }} />
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: 6,
              color: "#ffffff",
            }}
          >
            PPA TOUR NEWS
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
          <div style={{ display: "flex" }}>
            <div
              style={{
                background: "#228be6",
                color: "#ffffff",
                fontSize: 21,
                fontWeight: 900,
                letterSpacing: 3,
                padding: "8px 16px",
              }}
            >
              {a.category.toUpperCase()}
            </div>
          </div>
          <div
            style={{
              fontSize: a.title.length > 55 ? 54 : 64,
              fontWeight: 900,
              color: "#ffffff",
              lineHeight: 1.08,
              marginTop: 18,
              textTransform: "uppercase",
              maxWidth: 1040,
            }}
          >
            {a.title}
          </div>
          <div
            style={{
              fontSize: 23,
              fontWeight: 500,
              color: "rgba(255,255,255,0.75)",
              marginTop: 16,
              letterSpacing: 2,
            }}
          >
            {`${a.date.toUpperCase()}, 2026 · PPATOUR.COM`}
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
