import React, { useState } from "react";
import { Card, Button, PlayerAvatar } from "../components/ui.jsx";
import { THEMES } from "../theme.js";
import { logout } from "../api.js";

const CITIZEN_SPECIALS = [
  ["police", "경찰"], ["doctor", "의사"], ["reporter", "기자"], ["medium", "영매"],
  ["soldier", "건달"], ["lover", "연인(2인)"], ["politician", "정치인"], ["detective", "탐정"],
];

export default function LobbyPage({ me, queue, isAdmin, socket, streamerMode }) {
  const theme = THEMES.dusk;
  const [config, setConfig] = useState({
    police: true, doctor: true, reporter: false, medium: false,
    soldier: false, lover: false, politician: false, detective: false, spy: false,
  });

  const iAmInQueue = queue.some((q) => q.channelId === me.channelId);
  const n = queue.length;

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, padding: "24px 16px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 20, color: theme.text }}>
            🌾 레벨리오 마피아 <span style={{ fontSize: 13, fontWeight: 400, color: theme.sub }}>· 대기실</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlayerAvatar theme={theme} player={{ name: me.nickname, alive: true, profileImageUrl: me.profileImageUrl }} size={26} />
            <span style={{ color: theme.text, fontSize: 13.5 }}>{me.nickname}</span>
            {isAdmin && <span style={{ fontSize: 11, color: theme.accent, border: `1px solid ${theme.accent}`, borderRadius: 999, padding: "2px 8px" }}>관리자</span>}
            <button onClick={async () => { await logout(); window.location.reload(); }}
              style={{ fontSize: 11.5, color: theme.sub, background: "transparent", border: `1px solid ${theme.panelBorder}`,
                borderRadius: 999, padding: "4px 10px", cursor: "pointer" }}>
              로그아웃
            </button>
          </div>
        </div>

        <Card theme={theme}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 10 }}>👥 참여 대기열 ({n}명)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, minHeight: 30 }}>
            {n === 0 && <span style={{ fontSize: 12.5, color: theme.sub }}>아직 참여자가 없습니다.</span>}
            {queue.map((q) => (
              <div key={q.channelId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px 5px 6px",
                borderRadius: 999, background: theme.accentSoft }}>
                <PlayerAvatar theme={theme} player={{ name: q.nickname, alive: true, profileImageUrl: q.profileImageUrl }} size={22} />
                <span style={{ fontSize: 12.5, color: theme.text }}>{q.nickname}</span>
              </div>
            ))}
          </div>
          {!iAmInQueue ? (
            <Button theme={theme} onClick={() => socket.emit("join_queue")}>참여하기</Button>
          ) : (
            <Button theme={theme} variant="ghost" onClick={() => socket.emit("leave_queue")}>대기열에서 나가기</Button>
          )}
        </Card>

        {isAdmin && (
          <Card theme={theme}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 10 }}>⚙️ 관리자 설정</div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, margin: "10px 0 6px" }}>🗡️ 마피아팀 특수 직업</div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.text, cursor: "pointer", marginBottom: 12 }}>
              <input type="checkbox" checked={config.spy} onChange={(e) => setConfig({ ...config, spy: e.target.checked })} />
              스파이 (마피아 수와 별개로 추가)
            </label>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>🌾 시민팀 특수 직업</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 8, marginBottom: 16 }}>
              {CITIZEN_SPECIALS.map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={config[key]} onChange={(e) => setConfig({ ...config, [key]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>

            <Button theme={theme} disabled={n < 4} onClick={() => socket.emit("admin_start_game", config)} style={{ marginBottom: 10 }}>
              {n < 4 ? "최소 4명 이상 필요합니다" : "역할 배정하고 게임 시작하기 →"}
            </Button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${theme.panelBorder}` }}>
              <span style={{ fontSize: 12.5, color: theme.sub }}>📡 스트리머 모드 (방송 화면 활성화)</span>
              <button onClick={() => socket.emit("admin_toggle_streamer_mode")}
                style={{ width: 46, height: 26, borderRadius: 999, border: `1px solid ${theme.panelBorder}`,
                  background: streamerMode ? theme.accent : "rgba(120,120,120,0.25)", position: "relative", cursor: "pointer" }}>
                <span style={{ position: "absolute", top: 2, left: streamerMode ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
              </button>
            </div>
            {streamerMode && (
              <p style={{ fontSize: 11.5, color: theme.sub, marginTop: 8 }}>
                OBS 브라우저 소스 주소: <code>{window.location.origin}/broadcast</code>
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
