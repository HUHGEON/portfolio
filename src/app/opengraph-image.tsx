import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "HEO GEON — Backend Developer Portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// English-only card so the default ImageResponse font renders cleanly (no CJK).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0e1014",
          color: "#c9d1da",
          fontFamily: "monospace",
          padding: 64,
        }}
      >
        {/* title bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#e06c5b",
            }}
          />
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#e0b23b",
            }}
          />
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#5bb865",
            }}
          />
          <div style={{ marginLeft: 20, fontSize: 22, color: "#586271" }}>
            ~/heo-geon — zsh
          </div>
        </div>

        {/* body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 90,
          }}
        >
          <div style={{ fontSize: 26, color: "#86ad8e" }}>$ whoami</div>
          <div
            style={{
              fontSize: 104,
              fontWeight: 800,
              letterSpacing: -2,
              marginTop: 12,
              color: "#ffffff",
            }}
          >
            HEO GEON
          </div>
          <div style={{ fontSize: 40, marginTop: 12, color: "#8b94a1" }}>
            Backend Developer
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 44 }}>
            {["Node.js", "Spring", "MongoDB", "Redis", "Docker"].map((t) => (
              <div
                key={t}
                style={{
                  fontSize: 26,
                  color: "#7aa2c9",
                  border: "1px solid rgba(122,162,201,0.4)",
                  borderRadius: 10,
                  padding: "8px 18px",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            marginTop: "auto",
            fontSize: 26,
            color: "#586271",
          }}
        >
          huhgeon.github.io/portfolio
        </div>
      </div>
    ),
    { ...size },
  );
}
