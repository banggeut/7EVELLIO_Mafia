import React from "react";
import { Card, Button } from "../components/ui.jsx";
import { THEMES } from "../theme.js";
import { loginUrl } from "../api.js";

export default function LoginPage() {
  const theme = THEMES.dusk;
  return (
    <div style={{ minHeight: "100vh", background: theme.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card theme={theme} style={{ maxWidth: 380, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🌾</div>
        <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 22, color: theme.text, margin: "0 0 8px" }}>레벨리오 마피아</h1>
        <p style={{ color: theme.sub, fontSize: 13.5, lineHeight: 1.6, marginBottom: 22 }}>
          치지직 계정으로 로그인하면 참여 대기열에 등록할 수 있어요.
        </p>
        <Button theme={theme} onClick={() => (window.location.href = loginUrl())} style={{ width: "100%" }}>
          치지직으로 로그인
        </Button>
      </Card>
    </div>
  );
}
