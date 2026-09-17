import React, { memo, useMemo, useState } from "react";
import { ROLE_GUIDE, ROLE_GUIDE_GROUPS } from "../roleGuide.js";

const TEAM_COLOR = { mafia: "#E0474F", citizen: "#8DB4E2", neutral: "#B79BE0" };
const TEAM_NAME = { mafia: "마피아팀", citizen: "시민팀", neutral: "중립" };

/**
 * 직업 도감 - 그룹별로 직업이 나열되고, 누르면 펼쳐지면서 능력·변수·7일차 카드 설명이 나온다.
 * myRole을 넘기면 내 직업에 표시가 붙고 처음부터 펼쳐진다.
 */
function RoleGuide({ theme, myRole, style }) {
  const [openRole, setOpenRole] = useState(myRole && ROLE_GUIDE[myRole] ? myRole : null);
  const [query, setQuery] = useState("");
  const q = query.trim();
  const groups = useMemo(() => ROLE_GUIDE_GROUPS.map((g) => ({
    ...g,
    roles: g.roles.filter((r) => !q || ROLE_GUIDE[r].label.includes(q) || ROLE_GUIDE[r].desc.includes(q)
      || ROLE_GUIDE[r].cards.some((c) => c.title.includes(q))),
  })).filter((g) => g.roles.length > 0), [q]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 10.5, letterSpacing: "0.25em", color: theme.accent }}>■ CASE FILES</span>
        <span style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 15, fontWeight: 800, color: theme.text }}>직업 도감</span>
      </div>
      <input className="noir-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="직업·카드 이름으로 찾기"
        style={{ "--noir-accent": theme.accent, flexShrink: 0, marginBottom: 10, padding: "7px 10px", borderRadius: 2, border: `1px solid ${theme.panelBorder}`,
          background: "rgba(0,0,0,0.45)", color: theme.text, fontSize: 12.5, outline: "none" }} />
      <div className="noir-col" style={{ flex: 1, minHeight: 0, paddingRight: 4 }}>
        {groups.length === 0 && <div style={{ fontSize: 12, color: theme.sub }}>찾는 직업이 없습니다.</div>}
        {groups.map((g) => (
          <div key={g.key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: theme.sub, marginBottom: 6, letterSpacing: "0.02em" }}>{g.title}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", gap: 5 }}>
              {g.roles.map((r) => {
                const info = ROLE_GUIDE[r];
                const active = openRole === r;
                return (
                  <button key={r} onClick={() => setOpenRole(active ? null : r)} title={info.label}
                    style={{ position: "relative", display: "flex", alignItems: "center", gap: 5, padding: "6px 7px", borderRadius: 2, cursor: "pointer", minWidth: 0,
                      fontSize: 12, fontWeight: active ? 800 : 600, color: active ? theme.text : theme.text,
                      background: active ? theme.accentSoft : "rgba(0,0,0,0.32)",
                      border: `1px solid ${active ? theme.accent : theme.panelBorder}`, borderLeft: `2px solid ${TEAM_COLOR[info.team]}` }}>
                    <span style={{ fontSize: 13 }}>{info.emoji}</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{info.label}</span>
                    {myRole === r && <span style={{ position: "absolute", top: -5, right: -3, fontSize: 9, fontWeight: 800, color: "#0b0a08", background: theme.accent, borderRadius: 2, padding: "0 3px" }}>나</span>}
                    {info.cards.length > 0 && <span title="7일차 카드 있음" style={{ marginLeft: "auto", fontSize: 10, color: "#E8C468" }}>✦</span>}
                  </button>
                );
              })}
            </div>
            {g.roles.includes(openRole) && <RoleDetail theme={theme} role={openRole} isMine={myRole === openRole} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(RoleGuide);

function Section({ theme, icon, title, children }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, marginBottom: 4, letterSpacing: "0.04em" }}>{icon} {title}</div>
      {children}
    </div>
  );
}

function RoleDetail({ theme, role, isMine }) {
  const info = ROLE_GUIDE[role];
  return (
    <div style={{ marginTop: 8, borderRadius: 3, padding: "12px 12px", background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.35))",
      border: `1px solid ${theme.panelBorder}`, borderTop: `2px solid ${TEAM_COLOR[info.team]}`, animation: "noirGuideOpen 0.18s ease-out" }}>
      <style>{"@keyframes noirGuideOpen { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }"}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 22 }}>{info.emoji}</span>
        <span style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 900, color: theme.text }}>{info.label}</span>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: TEAM_COLOR[info.team], background: "rgba(0,0,0,0.4)", borderRadius: 2, padding: "1px 6px" }}>{TEAM_NAME[info.team]}</span>
        {isMine && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#0b0a08", background: theme.accent, borderRadius: 2, padding: "1px 6px" }}>내 직업</span>}
      </div>
      <Section theme={theme} icon="⚙️" title="능력">
        <div style={{ fontSize: 12.5, color: theme.text, lineHeight: 1.65 }}>{info.desc}</div>
      </Section>
      <Section theme={theme} icon="⚠️" title="변수">
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {info.notes.map((n, i) => <li key={i} style={{ fontSize: 12, color: theme.sub, lineHeight: 1.6, marginBottom: 2 }}>{n}</li>)}
        </ul>
      </Section>
      <Section theme={theme} icon="✦" title="7일차 새로운 능력">
        {info.cards.length === 0 ? (
          <div style={{ fontSize: 12, color: theme.sub }}>7일차에 받을 수 있는 카드가 없는 직업입니다.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {info.cards.map((c) => (
              <div key={c.id} style={{ borderRadius: 2, padding: "7px 9px", background: "rgba(232,196,104,0.07)", border: "1px solid rgba(232,196,104,0.28)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "#F1DFA8", marginBottom: 2 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: theme.text, lineHeight: 1.55 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
