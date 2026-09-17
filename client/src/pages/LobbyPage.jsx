import React, { useState, useEffect } from "react";
import { RoleIcon, TeamIcon } from "../components/roleIcons.jsx";
import { TitleIcon } from "../components/titleIcons.jsx";
import { Card, Button, PlayerAvatar, titleColor, TITLE_ANIMATION_CSS, TitleBadge } from "../components/ui.jsx";
import { NOIR_THEMES as THEMES } from "../theme.js";
import { logout } from "../api.js";
import { useIsDesktop } from "../components/gameLayout.jsx";
import RoleGuide from "../components/RoleGuide.jsx";

const MAFIA_SPECIALS = [
  ["spy", "스파이"], ["framer", "해커"], ["blocker", "마담"], ["silencer", "유괴범"], ["terrorist", "테러리스트"], ["witch", "마녀"], ["conartist", "사기꾼"], ["godfather", "대부"], ["hitman", "히트맨"],
];
const CITIZEN_SPECIALS = [
  ["reporter", "기자"], ["medium", "영매"], ["veteran", "군인"], ["undertaker", "장의사"], ["judge", "판사"],
  ["soldier", "건달"], ["newlywed", "연인(2인)"], ["politician", "정치인"], ["detective", "탐정"], ["official", "공무원"], ["priest", "성직자"], ["bodyguard", "경호원"],
];
const NEUTRAL_SPECIALS = [
  ["cultist", "악마 숭배자"], ["vampire", "뱀파이어"], ["thief", "괴도"], ["werewolf", "늑대인간"], ["cat", "고양이"], ["mercenary", "용병"],
];
const CITIZEN_GENERALS = [
  ["unemployed", "백수"], ["teacherStudent", "교사&학생(2인)"], ["counselor", "상담원"], ["idol", "피싱"], ["coroner", "검시관"], ["warden", "교도관"],
];

export default function LobbyPage({ me, queue, isAdmin, socket, streamerMode, balance, testMode, myProfile, topHonors, myOwnedTitles, myActiveTitle, achievementCatalog: fullAchievementCatalog }) {
  const theme = THEMES.dusk;
  const isDesktop = useIsDesktop();
  const [mafiaPool, setMafiaPool] = useState({ spy: true, framer: true, blocker: true, silencer: true, terrorist: true, witch: true, conartist: true, godfather: true, hitman: true });
  const [citizenPool, setCitizenPool] = useState({
    reporter: true, medium: true, veteran: true, undertaker: true, judge: true,
    soldier: true, newlywed: true, politician: true, detective: true, official: true, priest: true, bodyguard: true,
  });
  const [neutralPool, setNeutralPool] = useState({ cultist: true, vampire: true, thief: true, werewolf: true, cat: true, mercenary: true });
  const [citizenGeneralPool, setCitizenGeneralPool] = useState({ unemployed: true, teacherStudent: true, counselor: true, idol: true, coroner: true, warden: true });
  const [testNickname, setTestNickname] = useState("");
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [achievementCatalog, setAchievementCatalog] = useState([]);
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [tab, setTab] = useState("queue");

  useEffect(() => {
    const onProfiles = ({ profiles, catalog }) => {
      setAdminProfiles(profiles || []);
      if (catalog) setAchievementCatalog(catalog);
    };
    socket.on("admin_profiles", onProfiles);
    return () => socket.off("admin_profiles", onProfiles);
  }, [socket]);

  const iAmInQueue = queue.some((q) => q.channelId === me.channelId);
  const n = queue.length;

  if (showAdminPage) {
    return <AdminPage theme={theme} socket={socket} profiles={adminProfiles} catalog={achievementCatalog} onBack={() => setShowAdminPage(false)} />;
  }

  const css = (
    <style>{`
      * { box-sizing: border-box; }
      .lobby-col { overflow-y: auto; min-height: 0; scrollbar-width: thin; scrollbar-color: rgba(209,154,76,0.25) transparent; }
      .lobby-col::-webkit-scrollbar { width: 6px; } .lobby-col::-webkit-scrollbar-thumb { background: rgba(209,154,76,0.25); border-radius: 3px; }
      @keyframes lobbyPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(209,154,76,0.45); } 50% { box-shadow: 0 0 0 8px rgba(209,154,76,0); } }
      @keyframes lobbyIn { from { opacity: 0; transform: translateY(6px) scale(0.96); } to { opacity: 1; transform: none; } }
    `}</style>
  );

  const topBar = (
    <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", gap: 12,
      padding: isDesktop ? "10px 72px 10px 22px" : "8px 58px 8px 12px", background: "linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0.55))",
      borderBottom: `1px solid ${theme.panelBorder}`, backdropFilter: "blur(10px)" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        {isDesktop && <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.3em", color: theme.accent }}>■ 7EVELLIO · WAITING ROOM</div>}
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 800, fontSize: isDesktop ? 17 : 15, color: theme.text, whiteSpace: "nowrap" }}>
          레벨리오 마피아 <span style={{ fontSize: 12, fontWeight: 400, color: theme.sub }}>· 대기실</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        {isDesktop && <PlayerAvatar theme={theme} player={{ name: me.nickname, alive: true, profileImageUrl: me.profileImageUrl }} size={26} />}
        {isDesktop && <span style={{ color: theme.text, fontSize: 13.5, whiteSpace: "nowrap" }}>{me.nickname}</span>}
        {isAdmin && <span style={{ fontSize: 11, color: theme.accent, border: `1px solid ${theme.accent}`, borderRadius: 2, padding: "2px 8px", whiteSpace: "nowrap" }}>관리자</span>}
        <button onClick={async () => { await logout(); window.location.reload(); }}
          style={{ fontSize: 11.5, color: theme.sub, background: "transparent", border: `1px solid ${theme.panelBorder}`,
            borderRadius: 2, padding: "4px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
          로그아웃
        </button>
      </div>
    </div>
  );

  const profileCard = (
    <Card theme={theme} style={{ padding: "16px 16px" }}>
      <style>{TITLE_ANIMATION_CSS}</style>
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10.5, letterSpacing: "0.25em", color: theme.accent, marginBottom: 10 }}>MY RECORD</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <PlayerAvatar theme={theme} player={{ name: me.nickname, alive: true, profileImageUrl: me.profileImageUrl }} size={54} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {myActiveTitle && (
            <TitleBadge as="div" title={myActiveTitle} style={{ fontSize: 11.5, color: titleColor(myActiveTitle, theme), fontWeight: 700, marginBottom: 1 }} />
          )}
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 800, fontSize: 19, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.nickname}</div>
          <button onClick={() => setShowTitleModal(true)}
            style={{ marginTop: 4, fontSize: 11, color: theme.sub, background: "transparent", border: `1px solid ${theme.panelBorder}`,
              borderRadius: 2, padding: "3px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>
            🏅 칭호 바꾸기
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginTop: 14 }}>
        {[["🏆", "명예", myProfile?.honor ?? 0, theme.accent], ["🚨", "경고", myProfile?.warnings ?? 0, "#E05F5F"]].map(([icon, label, v, color]) => (
          <div key={label} style={{ borderRadius: 2, padding: "8px 10px", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: theme.sub }}>{icon} {label}</span>
            <b style={{ fontSize: 18, color }}>{v}</b>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", marginTop: 8, borderTop: `1px solid ${theme.panelBorder}`, paddingTop: 10 }}>
        {[["총 게임", myProfile?.gamesPlayed ?? 0], ["승리", myProfile?.wins ?? 0], ["패배", myProfile?.losses ?? 0]].map(([label, v], i) => (
          <div key={label} style={{ textAlign: "center", borderLeft: i ? `1px solid ${theme.panelBorder}` : "none" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{v}</div>
            <div style={{ fontSize: 11, color: theme.sub, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      {(myProfile?.gamesPlayed ?? 0) > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: theme.sub, marginBottom: 3 }}>
            <span>승률</span><b style={{ color: theme.text }}>{Math.round(((myProfile?.wins ?? 0) / myProfile.gamesPlayed) * 100)}%</b>
          </div>
          <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.4)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.round(((myProfile?.wins ?? 0) / myProfile.gamesPlayed) * 100)}%`, background: theme.accent }} />
          </div>
        </div>
      )}
    </Card>
  );

  const rankingCard = topHonors && topHonors.length > 0 ? (
    <Card theme={theme} style={{ padding: "14px 16px" }}>
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10.5, letterSpacing: "0.25em", color: theme.accent, marginBottom: 2 }}>HALL OF HONOR</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 14 }}>🏆 명예 랭킹</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8 }}>
        {[topHonors[1], topHonors[0], topHonors[2]].map((entry, i) => {
          const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
          if (!entry) return <div key={rank} style={{ flex: 1 }} />;
          const height = rank === 1 ? 86 : rank === 2 ? 64 : 48;
          const color = rank === 1 ? "#E8C468" : rank === 2 ? "#C7CDD6" : "#D08A5A";
          const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
          return (
            <div key={entry.channelId} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: rank === 1 ? 26 : 20 }}>{medal}</div>
              <div style={{ fontSize: rank === 1 ? 13 : 12, fontWeight: 700, color: theme.text, marginTop: 4, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                {entry.nickname}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color, marginTop: 2 }}>🏆 {entry.honor}</div>
              <div style={{ width: "100%", height, marginTop: 6, borderRadius: "3px 3px 0 0", background: `linear-gradient(180deg, ${color}44, ${color}18)`,
                border: `1px solid ${color}88`, borderBottom: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color }}>{rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  ) : null;

  const queueCard = (
    <Card theme={theme} style={{ padding: "16px 18px", display: "flex", flexDirection: "column", minHeight: isDesktop ? 0 : undefined, flex: isDesktop ? "1 0 auto" : undefined }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10.5, letterSpacing: "0.25em", color: theme.accent }}>THE LINEUP</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 22, fontWeight: 900, color: theme.text }}>
            참여 대기열 <span style={{ color: theme.accent }}>{n}</span><span style={{ fontSize: 14, color: theme.sub, fontWeight: 400 }}>명</span>
          </div>
          <div style={{ fontSize: 12, color: theme.sub, marginTop: 2 }}>
            {n < 4 ? `게임을 시작하려면 ${4 - n}명이 더 필요해요.` : "관리자가 게임을 시작하면 바로 직업이 배정됩니다."}
          </div>
        </div>
        {!iAmInQueue ? (
          <Button theme={theme} onClick={() => socket.emit("join_queue")} style={{ padding: "12px 26px", fontSize: 15, animation: "lobbyPulse 2s ease-in-out infinite" }}>🎟️ 참여하기</Button>
        ) : (
          <Button theme={theme} variant="ghost" onClick={() => socket.emit("leave_queue")} style={{ padding: "12px 22px", fontSize: 14 }}>대기열에서 나가기</Button>
        )}
      </div>
      {balance && n >= 4 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 12 }}>
          {[[<><TeamIcon team="mafia" size={13} />마피아팀</>, balance.mafiaTeam, `특수능력 ${balance.mafiaSpecials}명`, "#C4323A"],
            [<><TeamIcon team="citizen" size={13} />시민팀</>, n - balance.mafiaTeam, `특수직업 ${balance.citizenSpecials}자리 + 경찰·의사`, "#6E9FD8"],
            [<><TeamIcon team="neutral" size={13} />중립</>, 1, "시민 한 자리 대체", "#9C7BC9"]].map(([label, v, sub, color], bi) => (
            <div key={bi} style={{ borderRadius: 2, padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderTop: `2px solid ${color}` }}>
              <div style={{ fontSize: 11.5, color: theme.sub }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>{v}<span style={{ fontSize: 12, color: theme.sub, fontWeight: 400 }}>명</span></div>
              <div style={{ fontSize: 10.5, color: theme.sub }}>{sub}</div>
            </div>
          ))}
        </div>
      )}
      <div className={isDesktop ? "lobby-col" : undefined} style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${isDesktop ? 128 : 96}px, 1fr))`, gridAutoRows: isDesktop ? 108 : 92, gap: 8, alignContent: "start" }}>
        {n === 0 && <div style={{ gridColumn: "1 / -1", fontSize: 13, color: theme.sub, padding: "20px 0", textAlign: "center" }}>아직 참여자가 없습니다. 첫 번째로 자리에 앉아보세요.</div>}
        {queue.map((q, i) => {
          const isMe = q.channelId === me.channelId;
          return (
            <div key={q.channelId} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: 6,
              borderRadius: 3, background: isMe ? theme.accentSoft : q.isTestPlayer ? "rgba(217,140,61,0.1)" : "rgba(0,0,0,0.3)",
              border: `1px solid ${isMe ? theme.accent : theme.panelBorder}`, animation: "lobbyIn 0.25s ease-out", minWidth: 0 }}>
              <span style={{ position: "absolute", top: 4, left: 6, fontFamily: "'Courier Prime', monospace", fontSize: 10, color: theme.sub }}>#{i + 1}</span>
              <PlayerAvatar theme={theme} player={{ name: q.nickname, alive: true, profileImageUrl: q.profileImageUrl }} size={isDesktop ? 42 : 34} />
              <span style={{ fontSize: 13, fontWeight: isMe ? 800 : 600, color: theme.text, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.nickname}</span>
              {q.isTestPlayer && <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent }}>🧪 가짜</span>}
              {isMe && !q.isTestPlayer && <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent }}>나</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );

  const toggle = (label, on, onClick, roleKey) => (
    <button key={label} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 9px", borderRadius: 2, cursor: "pointer", fontSize: 12.5, textAlign: "left",
      color: on ? theme.text : theme.sub, background: on ? theme.accentSoft : "rgba(0,0,0,0.3)", border: `1px solid ${on ? theme.accent : theme.panelBorder}`, fontWeight: on ? 700 : 500 }}>
      <span style={{ width: 13, height: 13, borderRadius: 2, border: `1px solid ${on ? theme.accent : theme.panelBorder}`, background: on ? theme.accent : "transparent",
        color: "#0c0906", fontSize: 10, lineHeight: "12px", textAlign: "center", flexShrink: 0 }}>{on ? "✓" : ""}</span>
      {roleKey && <RoleIcon role={roleKey} size={15} style={{ opacity: on ? 1 : 0.55 }} />}
      {label}
    </button>
  );
  const poolSection = (title, entries, pool, setPool, note) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 800, color: theme.text }}>{title} <span style={{ color: theme.sub, fontWeight: 400 }}>({Object.values(pool).filter(Boolean).length}/{entries.length})</span></span>
        <span style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setPool(Object.fromEntries(entries.map(([k]) => [k, true])))} style={{ fontSize: 10.5, color: theme.sub, background: "transparent", border: `1px solid ${theme.panelBorder}`, borderRadius: 2, padding: "1px 6px", cursor: "pointer" }}>전체</button>
          <button onClick={() => setPool(Object.fromEntries(entries.map(([k]) => [k, false])))} style={{ fontSize: 10.5, color: theme.sub, background: "transparent", border: `1px solid ${theme.panelBorder}`, borderRadius: 2, padding: "1px 6px", cursor: "pointer" }}>해제</button>
        </span>
      </div>
      {note && <div style={{ fontSize: 11, color: theme.sub, marginBottom: 6 }}>{note}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(118px, 1fr))", gap: 5 }}>
        {entries.map(([key, label]) => toggle(label, !!pool[key], () => setPool({ ...pool, [key]: !pool[key] }), key))}
      </div>
    </div>
  );
  const switchRow = (label, on, event) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 12, marginTop: 12, borderTop: `1px solid ${theme.panelBorder}` }}>
      <span style={{ fontSize: 12.5, color: theme.sub }}>{label}</span>
      <button onClick={() => socket.emit(event)}
        style={{ width: 46, height: 26, borderRadius: 999, border: `1px solid ${theme.panelBorder}`, flexShrink: 0,
          background: on ? theme.accent : "rgba(120,120,120,0.25)", position: "relative", cursor: "pointer" }}>
        <span style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
      </button>
    </div>
  );

  const adminCard = isAdmin ? (
    <Card theme={theme} style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10.5, letterSpacing: "0.25em", color: theme.accent }}>CONTROL ROOM</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: theme.text }}>⚙️ 관리자 설정</div>
        </div>
        <Button theme={theme} variant="ghost" style={{ fontSize: 12, padding: "7px 12px" }}
          onClick={() => { socket.emit("admin_get_profiles"); setShowAdminPage(true); }}>
          🏅 업적 · 명예 · 경고 관리
        </Button>
      </div>
      <Button theme={theme} disabled={n < 4} onClick={() => socket.emit("admin_start_game", { mafiaPool, citizenPool, neutralPool, citizenGeneralPool })}
        style={{ width: "100%", padding: "13px 0", fontSize: 15, marginBottom: 14 }}>
        {n < 4 ? `최소 4명 이상 필요합니다 (현재 ${n}명)` : `🎬 ${n}명으로 역할 배정하고 게임 시작하기`}
      </Button>
      <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 12px", lineHeight: 1.6 }}>
        체크한 직업은 "이번 게임에 등장할 수 있는 후보"예요. 실제 등장 수는 인원수 기준 밸런스로 정해지고, 그 안에서 무작위로 배정돼요.
        경찰과 의사는 체크와 상관없이 항상 등장하고, 아무 직업도 못 받은 사람은 일반 시민이 됩니다.
      </p>
      {poolSection(<><TeamIcon team="mafia" size={13} />마피아팀 특수직업</>, MAFIA_SPECIALS, mafiaPool, setMafiaPool)}
      {poolSection(<><TeamIcon team="citizen" size={13} />시민팀 특수직업</>, CITIZEN_SPECIALS, citizenPool, setCitizenPool)}
      {poolSection(<><TeamIcon team="neutral" size={13} />중립 직업</>, NEUTRAL_SPECIALS, neutralPool, setNeutralPool, "매 게임 이 중 정확히 1명만 등장해요.")}
      {poolSection(<><TeamIcon team="citizen" size={13} />시민팀 일반직업</>, CITIZEN_GENERALS, citizenGeneralPool, setCitizenGeneralPool, "특수직업 수와 무관하게, 켜두면 남은 시민 자리에서 배정돼요.")}
      {switchRow("📡 스트리머 모드 (방송 화면 활성화)", streamerMode, "admin_toggle_streamer_mode")}
      {streamerMode && (
        <p style={{ fontSize: 11.5, color: theme.sub, marginTop: 8, marginBottom: 0 }}>
          OBS 브라우저 소스 주소: <code>{window.location.origin}/broadcast</code>
        </p>
      )}
      {switchRow("🧪 테스트 모드 (가짜 참여자 + 시점 전환)", testMode, "admin_toggle_test_mode")}
      {testMode && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 11.5, color: theme.sub, marginBottom: 8 }}>
            치지직 로그인 없이 가짜 참여자를 대기열에 추가할 수 있어요. 게임이 시작되면 게임 화면에서 "시점 전환"으로 그 사람인 척 조작할 수 있습니다.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={testNickname} onChange={(e) => setTestNickname(e.target.value)}
              placeholder="가짜 참여자 닉네임" onKeyDown={(e) => {
                if (e.key === "Enter" && testNickname.trim()) { socket.emit("admin_add_test_player", testNickname); setTestNickname(""); }
              }}
              style={{ flex: 1, minWidth: 0, padding: "8px 12px", borderRadius: 2, border: `1px solid ${theme.panelBorder}`,
                background: "rgba(0,0,0,0.35)", color: theme.text, fontSize: 13, outline: "none" }} />
            <Button theme={theme} style={{ padding: "8px 16px", fontSize: 13 }}
              onClick={() => { socket.emit("admin_add_test_player", testNickname); setTestNickname(""); }}>
              추가
            </Button>
          </div>
        </div>
      )}
    </Card>
  ) : null;

  const guideCard = (
    <Card theme={theme} style={isDesktop ? { padding: "12px 12px", display: "flex", flexDirection: "column", minHeight: 0, flex: 1 } : { padding: "12px 12px" }}>
      <RoleGuide theme={theme} style={isDesktop ? { flex: 1 } : undefined} pageScroll={!isDesktop} />
    </Card>
  );

  const titleModal = showTitleModal && (
    <TitleModal theme={theme} socket={socket} catalog={fullAchievementCatalog || []}
      myOwnedTitles={myOwnedTitles || []} myActiveTitle={myActiveTitle} onClose={() => setShowTitleModal(false)} />
  );

  if (isDesktop) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: theme.bg, overflow: "hidden" }}>
        {css}
        {topBar}
        <div style={{ flex: 1, minHeight: 0, display: "grid", gap: 12, padding: "12px 14px 14px",
          gridTemplateColumns: "minmax(270px, 22%) minmax(0, 1fr) minmax(340px, 27%)" }}>
          <aside className="lobby-col" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {profileCard}
            {rankingCard}
          </aside>
          <main className="lobby-col" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {queueCard}
            {adminCard}
          </main>
          <aside style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>{guideCard}</aside>
        </div>
        {titleModal}
      </div>
    );
  }

  const tabs = [["queue", "🎟️", `대기열 ${n}`], ["me", "🗂️", "내 기록"], ["guide", "📖", "직업 도감"], ...(isAdmin ? [["admin", "⚙️", "관리"]] : [])];
  return (
    <div style={{ minHeight: "100vh", background: theme.bg, paddingBottom: 84 }}>
      {css}
      {topBar}
      <div style={{ padding: "12px 12px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {tab === "queue" && queueCard}
        {tab === "me" && <>{profileCard}{rankingCard}</>}
        {tab === "guide" && guideCard}
        {tab === "admin" && adminCard}
      </div>
      <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 80, display: "grid", gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        background: "linear-gradient(180deg, rgba(10,9,8,0.92), rgba(0,0,0,0.98))", borderTop: `1px solid ${theme.panelBorder}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {tabs.map(([key, icon, label]) => {
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: "8px 2px 9px",
              color: active ? theme.accent : theme.sub, borderTop: `2px solid ${active ? theme.accent : "transparent"}` }}>
              <div style={{ fontSize: 18, lineHeight: 1.1, filter: active ? "none" : "grayscale(0.6)" }}>{icon}</div>
              <div style={{ fontSize: 11, fontWeight: active ? 800 : 500, marginTop: 2 }}>{label}</div>
            </button>
          );
        })}
      </nav>
      {titleModal}
    </div>
  );
}

function AdminPage({ theme, socket, profiles, catalog, onBack }) {
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState({}); // { [channelId]: { honor, warnings } } - 아직 저장 안 한 입력값

  const filtered = profiles.filter((p) => (p.nickname || "").toLowerCase().includes(search.toLowerCase()));

  const getDraft = (p, field) => {
    const d = drafts[p.channelId];
    return d && d[field] !== undefined ? d[field] : p[field];
  };
  const setDraft = (channelId, field, value) => {
    setDrafts((prev) => ({ ...prev, [channelId]: { ...prev[channelId], [field]: value } }));
  };

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, padding: "24px 16px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 20, color: theme.text }}>
            🏅 관리자 페이지 <span style={{ fontSize: 13, fontWeight: 400, color: theme.sub }}>· 업적 · 명예 · 경고 관리</span>
          </div>
          <button onClick={onBack}
            style={{ fontSize: 12.5, color: theme.sub, background: "transparent", border: `1px solid ${theme.panelBorder}`,
              borderRadius: 999, padding: "6px 14px", cursor: "pointer" }}>
            ← 대기실로 돌아가기
          </button>
        </div>

        <Card theme={theme}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="닉네임으로 검색..."
            style={{ width: "100%", padding: "9px 12px", borderRadius: 4, border: `1px solid ${theme.panelBorder}`,
              background: "rgba(255,255,255,0.04)", color: theme.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </Card>

        {filtered.length === 0 && (
          <Card theme={theme}>
            <p style={{ fontSize: 12.5, color: theme.sub, margin: 0 }}>
              {profiles.length === 0 ? "아직 기록이 있는 플레이어가 없습니다." : "검색 결과가 없습니다."}
            </p>
          </Card>
        )}

        {filtered.map((p) => (
          <Card key={p.channelId} theme={theme}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{p.nickname}</div>
              {p.activeTitle && (
                <TitleBadge title={p.activeTitle} style={{ fontSize: 11, color: titleColor(p.activeTitle, theme), border: `1px solid ${titleColor(p.activeTitle, theme)}`, borderRadius: 999, padding: "2px 10px" }} />
              )}
            </div>
            <div style={{ fontSize: 11.5, color: theme.sub, marginBottom: 12 }}>
              전적 {p.gamesPlayed}전 {p.wins}승 {p.losses}패
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: theme.sub }}>🏆 명예</span>
                <input type="number" value={getDraft(p, "honor")} onChange={(e) => setDraft(p.channelId, "honor", e.target.value)}
                  style={{ width: 64, padding: "5px 8px", borderRadius: 8, border: `1px solid ${theme.panelBorder}`,
                    background: "rgba(255,255,255,0.04)", color: theme.text, fontSize: 12.5 }} />
                <Button theme={theme} style={{ padding: "5px 10px", fontSize: 11.5 }}
                  onClick={() => socket.emit("admin_set_honor", { targetId: p.channelId, nickname: p.nickname, value: getDraft(p, "honor") })}>
                  저장
                </Button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: theme.sub }}>🚨 경고</span>
                <input type="number" value={getDraft(p, "warnings")} onChange={(e) => setDraft(p.channelId, "warnings", e.target.value)}
                  style={{ width: 64, padding: "5px 8px", borderRadius: 8, border: `1px solid ${theme.panelBorder}`,
                    background: "rgba(255,255,255,0.04)", color: theme.text, fontSize: 12.5 }} />
                <Button theme={theme} style={{ padding: "5px 10px", fontSize: 11.5 }}
                  onClick={() => socket.emit("admin_set_warnings", { targetId: p.channelId, nickname: p.nickname, value: getDraft(p, "warnings") })}>
                  저장
                </Button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11.5, color: theme.sub }}>업적 부여</div>
              <button
                disabled={!(p.achievements || []).length}
                onClick={() => {
                  if (!window.confirm(`${p.nickname}님의 업적을 전부 초기화할까요? 보유 칭호도 함께 사라집니다.`)) return;
                  socket.emit("admin_reset_achievements", { targetId: p.channelId });
                }}
                style={{
                  fontSize: 11, padding: "4px 10px", borderRadius: 999,
                  cursor: (p.achievements || []).length ? "pointer" : "default",
                  border: `1px solid ${(p.achievements || []).length ? "#E05F5F" : theme.panelBorder}`,
                  background: "transparent",
                  color: (p.achievements || []).length ? "#E05F5F" : theme.sub,
                }}>
                🗑️ 업적 초기화
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {catalog.map((a) => {
                const owned = (p.achievements || []).includes(a.id);
                return (
                  <button key={a.id} disabled={owned}
                    onClick={() => socket.emit("admin_grant_achievement", { targetId: p.channelId, nickname: p.nickname, achievementId: a.id })}
                    title={a.desc}
                    style={{
                      fontSize: 12, padding: "5px 12px", borderRadius: 999, cursor: owned ? "default" : "pointer",
                      border: `1px solid ${owned ? theme.accent : theme.panelBorder}`,
                      background: owned ? theme.accentSoft : "transparent",
                      color: owned ? theme.accent : theme.text,
                    }}>
                    {owned ? "✓ " : ""}<TitleIcon title={a.title} style={{ marginRight: "0.25em" }} />{a.name}
                  </button>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TitleModal({ theme, socket, catalog, myOwnedTitles, myActiveTitle, onClose }) {
  const ownedIds = new Set((myOwnedTitles || []).map((t) => t.achievementId));
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 420, maxHeight: "76vh", background: theme.bg, borderRadius: 5,
          border: `1px solid ${theme.panelBorder}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: `1px solid ${theme.panelBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>🏅 칭호 선택</div>
          <button onClick={onClose}
            style={{ background: "transparent", border: "none", color: theme.sub, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>
            ✕
          </button>
        </div>
        <div style={{ padding: "12px 18px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {catalog.length === 0 && <p style={{ fontSize: 12.5, color: theme.sub, margin: 0 }}>등록된 칭호가 없습니다.</p>}
          {catalog.map((a) => {
            const owned = ownedIds.has(a.id);
            const active = owned && myActiveTitle === a.title;
            const c = titleColor(a.title, theme);
            return (
              <button key={a.id} disabled={!owned}
                onClick={() => socket.emit("set_my_title", active ? null : a.title)}
                style={{
                  textAlign: "left", padding: "10px 14px", borderRadius: 4, cursor: owned ? "pointer" : "default",
                  border: `1px solid ${active ? c : theme.panelBorder}`,
                  background: active ? `${c}22` : "transparent",
                  opacity: owned ? 1 : 0.45,
                }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: owned ? c : theme.sub }}>
                  {active ? "✓ " : ""}&lt;<TitleIcon title={a.title} style={{ marginRight: "0.2em" }} />{a.name}&gt; {!owned && "🔒"}
                </div>
                <div style={{ fontSize: 11, color: theme.sub, marginTop: 3, lineHeight: 1.4 }}>{a.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
