import React, { useState, useEffect, useRef } from "react";
import { playClick, isSoundEnabled, setSoundEnabled, getVolume, setVolume } from "../sound.js";

export function Card({ theme, children, style }) {
  return (
    <div style={{ background: theme.panel, border: `1px solid ${theme.panelBorder}`, borderRadius: 18,
      padding: "20px 22px", backdropFilter: "blur(6px)", boxShadow: "0 12px 30px rgba(0,0,0,0.18)", ...style }}>
      {children}
    </div>
  );
}

export function Button({ theme, children, onClick, disabled, variant = "solid", style }) {
  const base = { fontSize: 14.5, fontWeight: 600, padding: "10px 18px", borderRadius: 999,
    cursor: disabled ? "not-allowed" : "pointer", border: `1px solid ${theme.accent}`,
    opacity: disabled ? 0.4 : 1, transition: "transform 0.12s ease, opacity 0.2s ease" };
  const variants = {
    solid: { background: theme.accent, color: "#1a1508" },
    ghost: { background: "transparent", color: theme.text },
    subtle: { background: theme.accentSoft, color: theme.text },
  };
  const handleClick = (e) => {
    if (disabled) return;
    playClick();
    onClick && onClick(e);
  };
  return (
    <button onClick={handleClick} disabled={disabled}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Chip({ theme, label, selected, onClick, dim }) {
  const handleClick = onClick ? (e) => { playClick(); onClick(e); } : undefined;
  return (
    <button onClick={handleClick} style={{ padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
      border: `1px solid ${selected ? theme.accent : theme.panelBorder}`, background: selected ? theme.accentSoft : "transparent",
      color: theme.text, cursor: onClick ? "pointer" : "default", opacity: dim ? 0.4 : 1 }}>
      {label}
    </button>
  );
}

export function PhaseHeader({ theme, label, phase }) {
  const icon = phase === "night" ? "🌙" : phase === "gameover" ? "🏁" : "☀️";
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 22, color: theme.text, margin: 0 }}>{label}</h2>
    </div>
  );
}

export function RedactedNotice({ theme, text }) {
  return (
    <div style={{ border: `1.5px dashed ${theme.panelBorder}`, borderRadius: 14, padding: "26px 18px",
      textAlign: "center", color: theme.sub, fontSize: 13.5, lineHeight: 1.6 }}>
      🔒 {text}
    </div>
  );
}

export function PrivateNote({ theme, children }) {
  return (
    <div style={{ border: `1px solid ${theme.accent}55`, background: theme.accentSoft, borderRadius: 12,
      padding: "10px 14px", fontSize: 12.5, color: theme.text, marginBottom: 10, lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

export function TimerDisplay({ theme, seconds }) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return <div style={{ fontFamily: "monospace", fontSize: 40, fontWeight: 700, color: theme.accent, textAlign: "center" }}>{mm}:{ss}</div>;
}

export function AutoNote({ theme, text = "시간이 지나면 자동으로 다음 단계로 진행됩니다." }) {
  return <div style={{ marginTop: 16, fontSize: 12, color: theme.sub, textAlign: "center" }}>⏱️ {text}</div>;
}

export function ChatPanel({ theme, title, messages, onSend, participants }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length]);
  const submit = () => { if (text.trim()) { onSend(text.trim()); setText(""); } };
  return (
    <div style={{ marginTop: 14, border: `1px solid ${theme.panelBorder}`, borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: participants?.length ? 2 : 8, color: theme.text }}>{title}</div>
      {participants?.length > 0 && (
        <div style={{ fontSize: 11, color: theme.sub, marginBottom: 8 }}>참여: {participants.join(", ")}</div>
      )}
      <div style={{ maxHeight: 130, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        {messages.length === 0 && <div style={{ fontSize: 12, color: theme.sub }}>아직 메시지가 없습니다.</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ fontSize: 12.5, color: theme.text }}><b>{m.sender}:</b> {m.text}</div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지 입력..."
          onKeyDown={(e) => e.key === "Enter" && submit()}
          style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1px solid ${theme.panelBorder}`,
            background: "rgba(255,255,255,0.04)", color: theme.text, fontSize: 12.5, outline: "none" }} />
        <Button theme={theme} onClick={submit} style={{ padding: "7px 14px", fontSize: 12.5 }}>전송</Button>
      </div>
    </div>
  );
}

export function SettingsPanel({ theme }) {
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState(() => isSoundEnabled());
  const [volume, setVolumeState] = useState(() => getVolume());
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} title="설정"
        style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid ${theme.panelBorder}`,
          background: theme.panel, color: theme.text, fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
        ⚙️
      </button>
      {open && (
        <Card theme={theme} style={{ position: "absolute", top: 44, right: 0, width: 220, zIndex: 200 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 12 }}>🔊 효과음 설정</div>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5, color: theme.text, marginBottom: 12, cursor: "pointer" }}>
            효과음 사용
            <input type="checkbox" checked={on} onChange={(e) => {
              const next = e.target.checked;
              setSoundEnabled(next);
              setOn(next);
              if (next) playClick();
            }} />
          </label>
          <div style={{ fontSize: 11.5, color: theme.sub, marginBottom: 6 }}>볼륨 {volume}</div>
          <input type="range" min={0} max={100} value={volume} disabled={!on}
            onChange={(e) => { const v = Number(e.target.value); setVolumeState(v); setVolume(v); }}
            onMouseUp={() => on && playClick()}
            style={{ width: "100%", accentColor: theme.accent, opacity: on ? 1 : 0.4 }} />
        </Card>
      )}
    </div>
  );
}

export function PlayerAvatar({ theme, player, size = 28 }) {
  if (player.profileImageUrl) {
    return (
      <img src={player.profileImageUrl} alt={player.name} width={size} height={size}
        style={{ borderRadius: "50%", objectFit: "cover", opacity: player.alive ? 1 : 0.4, flexShrink: 0 }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: player.alive ? theme.accentSoft : "rgba(120,120,120,0.25)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, fontWeight: 700, color: theme.text, flexShrink: 0 }}>
      {player.alive ? player.name.slice(0, 1) : "💀"}
    </div>
  );
}

export function PlayerRow({ theme, player, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10 }}>
      <PlayerAvatar theme={theme} player={player} size={28} />
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text, textDecoration: player.alive ? "none" : "line-through" }}>{player.name}</div>
        {sub && <div style={{ fontSize: 11, color: theme.sub }}>{sub}</div>}
      </div>
    </div>
  );
}

/** 기자의 공개 특종을 실제 신문 호외처럼 꾸며 보여준다. */
export function NewsArticle({ theme, dayNumber, name, roleLabel }) {
  return (
    <div style={{
      border: `1px solid ${theme.text}33`, borderRadius: 4, padding: "16px 18px", marginBottom: 12,
      background: "rgba(120,120,120,0.06)", boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `2px solid ${theme.text}`, paddingBottom: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", color: theme.text }}>
          레벨리오 일보 · 호외
        </span>
        <span style={{ fontSize: 10.5, color: theme.sub }}>{dayNumber}일차 아침판</span>
      </div>
      <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 17, color: theme.text, lineHeight: 1.4, marginBottom: 6 }}>
        단독) {name}, 정체는 [{roleLabel}](으)로 밝혀져
      </div>
      <p style={{ fontSize: 12, color: theme.sub, lineHeight: 1.6, margin: 0 }}>
        본지 취재 결과 <b style={{ color: theme.text }}>{name}</b>님의 정체가 <b style={{ color: theme.text }}>{roleLabel}</b>(으)로 확인되었다.
        본지 기자는 어젯밤 현장을 취재해 이 같은 사실을 단독으로 입수했다.
      </p>
    </div>
  );
}

/** 치지직 채팅에서 중계된 메시지를 보여주는 읽기 전용 피드 (여기서는 입력할 수 없음) */
export function LiveChatFeed({ theme, title, messages, emptyText = "아직 채팅이 없습니다. 치지직 채팅창에 메시지를 남겨주세요!" }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length]);
  return (
    <div style={{ border: `1px solid ${theme.panelBorder}`, borderRadius: 12, padding: 12, marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: theme.text, display: "flex", alignItems: "center", gap: 6 }}>
        💬 {title}
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5 }}>
        {messages.length === 0 && <div style={{ fontSize: 12, color: theme.sub }}>{emptyText}</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ fontSize: 12.5, color: theme.text }}><b>{m.sender}:</b> {m.text}</div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

/** 참여자 명단을 하단에 늘 보여주는 로스터 - 생존/사망을 구분해 표시 */
export function PlayerRoster({ theme, players, teamCounts, onPlayerClick }) {
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11.5, color: theme.sub, marginBottom: 8 }}>
        참여자 ({players.filter((p) => p.alive).length}/{players.length}명 생존)
        {teamCounts && (
          <> · 마피아팀 {teamCounts.mafia.total}명({teamCounts.mafia.special}) · 시민팀 {teamCounts.citizen.total}명({teamCounts.citizen.special})</>
        )}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {players.map((p) => {
          const clickable = !p.roleLabel && !p.isSelf && onPlayerClick;
          return (
            <div key={p.id} onClick={clickable ? () => onPlayerClick(p.id) : undefined}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px 4px 4px",
                borderRadius: 999, background: p.alive ? theme.accentSoft : "rgba(120,120,120,0.16)",
                cursor: clickable ? "pointer" : "default" }}>
              <PlayerAvatar theme={theme} player={p} size={20} />
              <span style={{
                fontSize: 12,
                // 처형 시 "마피아였습니다"로 공개된 경우 - 정확한 직업명은 아니고 마피아 여부만 붉은색으로 표시
                color: p.isMafia === true ? "#D9534F" : p.alive ? theme.text : theme.sub,
                fontWeight: p.isMafia === true ? 700 : 400,
                textDecoration: p.alive ? "none" : "line-through",
              }}>
                {p.name}
              </span>
              {p.roleLabel && (
                <span style={{ fontSize: 10.5, fontWeight: 700, color: theme.accent, background: "rgba(0,0,0,0.12)",
                  borderRadius: 999, padding: "2px 7px" }}>
                  {p.roleLabel}
                </span>
              )}
              {p.undertakerNote && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#B48CD9", background: "rgba(123,94,167,0.16)",
                  borderRadius: 999, padding: "2px 7px" }}>
                  {p.undertakerNote}
                </span>
              )}
              {p.vampireNote && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#8E4C6B", background: "rgba(142,76,107,0.16)",
                  borderRadius: 999, padding: "2px 7px" }}>
                  {p.vampireNote}
                </span>
              )}
              {!p.roleLabel && p.guessLabel && (
                <span style={{ fontSize: 10, fontWeight: 700, color: theme.sub, background: "rgba(0,0,0,0.08)",
                  border: `1px dashed ${theme.panelBorder}`, borderRadius: 999, padding: "2px 7px" }}>
                  🔎 {p.guessLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
