import React from "react";
import { Card, Button, NoirAtmosphere } from "../components/ui.jsx";
import { NOIR_THEMES } from "../theme.js";
import { loginUrl } from "../api.js";

export default function LoginPage() {
  const theme = NOIR_THEMES.dusk;
  return (
    <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <NoirAtmosphere theme={theme} />
      <Card theme={theme} style={{ maxWidth: 400, width: "100%", textAlign: "center", padding: "34px 28px 28px" }}>
        <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, letterSpacing: "0.35em", color: theme.accent, marginBottom: 14 }}>
          ── CASE No. 7 ──
        </div>
        <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: 30, color: theme.text, margin: "0 0 4px",
          letterSpacing: "-0.01em", textShadow: "0 3px 18px rgba(0,0,0,0.9)" }}>레벨리오 마피아</h1>
        <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 12, letterSpacing: "0.5em", color: theme.sub, marginBottom: 20 }}>
          7EVELLIO · MAFIA
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${theme.accent}99, transparent)`, marginBottom: 18 }} />
        <p style={{ color: theme.sub, fontSize: 13.5, lineHeight: 1.7, marginBottom: 24 }}>
          이 도시엔 누군가 거짓말을 하고 있다.<br />
          치지직 계정으로 로그인해 참여 대기열에 이름을 올리세요.
        </p>
        <Button theme={theme} onClick={() => (window.location.href = loginUrl())} style={{ width: "100%" }}>
          치지직으로 로그인
        </Button>
      </Card>
    </div>
  );
}
