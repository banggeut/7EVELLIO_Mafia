import React, { useState, useEffect, useRef } from "react";

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
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Chip({ theme, label, selected, onClick, dim }) {
  return (
    <button onClick={onClick} style={{ padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
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

export function ChatPanel({ theme, title, messages, onSend }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length]);
  const submit = () => { if (text.trim()) { onSend(text.trim()); setText(""); } };
  return (
    <div style={{ marginTop: 14, border: `1px solid ${theme.panelBorder}`, borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: theme.text }}>{title}</div>
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
