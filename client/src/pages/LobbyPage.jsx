import React, { useState } from "react";
import { Card, Button, PlayerAvatar } from "../components/ui.jsx";
import { THEMES } from "../theme.js";
import { logout } from "../api.js";

const MAFIA_SPECIALS = [
  ["spy", "스파이"], ["framer", "해커"], ["blocker", "마담"], ["silencer", "유괴범"], ["terrorist", "테러리스트"], ["witch", "마녀"], ["conartist", "사기꾼"], ["godfather", "대부"],
];
const CITIZEN_SPECIALS = [
  ["reporter", "기자"], ["medium", "영매"], ["veteran", "군인"], ["undertaker", "장의사"], ["judge", "판사"],
  ["soldier", "건달"], ["newlywed", "신혼부부(2인)"], ["politician", "정치인"], ["detective", "탐정"], ["official", "공무원"], ["priest", "성직자"], ["bodyguard", "경호원"],
];
const NEUTRAL_SPECIALS = [
  ["cultist", "악마 숭배자"], ["vampire", "뱀파이어"], ["thief", "괴도"], ["werewolf", "늑대인간"], ["cat", "고양이"],
];
const CITIZEN_GENERALS = [
  ["lover", "연인(2인)"], ["unemployed", "백수"], ["teacherStudent", "교사&학생(2인)"],
];

export default function LobbyPage({ me, queue, isAdmin, socket, streamerMode, balance, testMode, myProfile, topHonors }) {
  const theme = THEMES.dusk;
  const [mafiaPool, setMafiaPool] = useState({ spy: true, framer: true, blocker: true, silencer: true, terrorist: true, witch: true, conartist: true, godfather: true });
  const [citizenPool, setCitizenPool] = useState({
    reporter: true, medium: true, veteran: true, undertaker: true, judge: true,
    soldier: true, newlywed: true, politician: true, detective: true, official: true, priest: true, bodyguard: true,
  });
  const [neutralPool, setNeutralPool] = useState({ cultist: true, vampire: true, thief: true, werewolf: true, cat: true });
  const [citizenGeneralPool, setCitizenGeneralPool] = useState({ lover: true, unemployed: true, teacherStudent: true });
  const [testNickname, setTestNickname] = useState("");

  const iAmInQueue = queue.some((q) => q.channelId === me.channelId);
  const n = queue.length;
  const mafiaPoolCount = Object.values(mafiaPool).filter(Boolean).length;
  const citizenPoolCount = Object.values(citizenPool).filter(Boolean).length;
  const neutralPoolCount = Object.values(neutralPool).filter(Boolean).length;

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
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <PlayerAvatar theme={theme} player={{ name: me.nickname, alive: true, profileImageUrl: me.profileImageUrl }} size={54} />
            <div style={{ flex: 1, fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 19, color: theme.text }}>
              {me.nickname}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 18, fontWeight: 800, color: theme.accent }}>
                🏆 {myProfile?.honor ?? 0}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 15, fontWeight: 800, color: "#E05F5F" }}>
                🚨 {myProfile?.warnings ?? 0}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${theme.panelBorder}` }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>{myProfile?.gamesPlayed ?? 0}</div>
              <div style={{ fontSize: 11, color: theme.sub, marginTop: 2 }}>총 게임</div>
            </div>
            <div style={{ flex: 1, textAlign: "center", borderLeft: `1px solid ${theme.panelBorder}`, borderRight: `1px solid ${theme.panelBorder}` }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>{myProfile?.wins ?? 0}</div>
              <div style={{ fontSize: 11, color: theme.sub, marginTop: 2 }}>승리</div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>{myProfile?.losses ?? 0}</div>
              <div style={{ fontSize: 11, color: theme.sub, marginTop: 2 }}>패배</div>
            </div>
          </div>
        </Card>

        {topHonors && topHonors.length > 0 && (
          <Card theme={theme}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 16, textAlign: "center" }}>🏆 명예 랭킹</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10 }}>
              {[topHonors[1], topHonors[0], topHonors[2]].map((entry, i) => {
                const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
                if (!entry) return <div key={rank} style={{ width: 84 }} />;
                const height = rank === 1 ? 108 : rank === 2 ? 82 : 62;
                const color = rank === 1 ? "#E8C468" : rank === 2 ? "#C7CDD6" : "#D08A5A";
                const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
                return (
                  <div key={entry.channelId} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 84 }}>
                    <div style={{ fontSize: rank === 1 ? 30 : 24 }}>{medal}</div>
                    <div style={{
                      fontSize: rank === 1 ? 13.5 : 12, fontWeight: 700, color: theme.text, marginTop: 4,
                      textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 84,
                    }}>
                      {entry.nickname}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color, marginTop: 2 }}>🏆 {entry.honor}</div>
                    <div style={{
                      width: "100%", height, marginTop: 8, borderRadius: "10px 10px 0 0",
                      background: `linear-gradient(180deg, ${color}44, ${color}18)`, border: `1px solid ${color}88`, borderBottom: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color }}>{rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card theme={theme}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 10 }}>👥 참여 대기열 ({n}명)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, minHeight: 30 }}>
            {n === 0 && <span style={{ fontSize: 12.5, color: theme.sub }}>아직 참여자가 없습니다.</span>}
            {queue.map((q) => (
              <div key={q.channelId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px 5px 6px",
                borderRadius: 999, background: q.isTestPlayer ? "rgba(217,140,61,0.18)" : theme.accentSoft }}>
                <PlayerAvatar theme={theme} player={{ name: q.nickname, alive: true, profileImageUrl: q.profileImageUrl }} size={22} />
                <span style={{ fontSize: 12.5, color: theme.text }}>{q.nickname}</span>
                {q.isTestPlayer && <span style={{ fontSize: 10.5, fontWeight: 700, color: theme.accent }}>🧪 가짜</span>}
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

            {balance && n >= 4 && (
              <div style={{ borderRadius: 12, padding: "10px 14px", background: theme.accentSoft, marginBottom: 16, fontSize: 12.5, color: theme.text, lineHeight: 1.7 }}>
                <b>{n}명 기준 자동 밸런스</b><br />
                🗡️ 마피아팀 {balance.mafiaTeam}명 (그중 특수능력 {balance.mafiaSpecials}명, 아래 체크된 후보 중 무작위)<br />
                🌾 시민팀 {n - balance.mafiaTeam}명 (특수직업 {balance.citizenSpecials}자리 — 경찰·의사 필수 + 나머지는 체크된 후보 중 무작위)<br />
                😈 그중 일반 시민 한 자리는 중립 직업으로 대체돼요 (아래 중립 풀에서 무작위 1명)
              </div>
            )}
            <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 14px" }}>
              체크한 직업은 "이번 게임에 등장할 수 있는 후보"예요. 실제로 몇 명이나 등장할지는 위 인원수 기준 밸런스에 따라 자동으로 정해지고,
              그 안에서 무작위로 배정돼요. 그래서 체크해도 이번 판엔 아예 안 나올 수도 있어요 — 마피아가 사칭하기 좋아지도록 일부러 이렇게 했어요.
            </p>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, margin: "10px 0 6px" }}>
              🗡️ 마피아팀 특수직업 후보 ({mafiaPoolCount}개 선택됨)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 8, marginBottom: 16 }}>
              {MAFIA_SPECIALS.map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={mafiaPool[key]} onChange={(e) => setMafiaPool({ ...mafiaPool, [key]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>

            <div style={{ borderRadius: 10, padding: "8px 12px", background: theme.accentSoft, marginBottom: 12, fontSize: 12, color: theme.text }}>
              🔍🩺 경찰과 의사는 체크와 상관없이 매 게임 항상 시민팀에 포함돼요.<br />
              🌾 필수/특수직업도, 일반직업도 못 받은 사람은 그냥 일반 시민이 돼요.
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>
              🌾 시민팀 추가 특수직업 후보 ({citizenPoolCount}개 선택됨)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 8, marginBottom: 16 }}>
              {CITIZEN_SPECIALS.map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={citizenPool[key]} onChange={(e) => setCitizenPool({ ...citizenPool, [key]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>
              😈 중립 직업 후보 ({neutralPoolCount}개 선택됨) — 매 게임 이 중 정확히 1명만 등장해요
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 8, marginBottom: 16 }}>
              {NEUTRAL_SPECIALS.map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={neutralPool[key]} onChange={(e) => setNeutralPool({ ...neutralPool, [key]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>
              🌾 시민팀 일반직업 후보 — 특수직업 수 제한과 무관하게, 켜두면 그 인원수만큼 남은 시민 중에서 배정돼요
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 8, marginBottom: 16 }}>
              {CITIZEN_GENERALS.map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: theme.text, cursor: "pointer" }}>
                  <input type="checkbox" checked={citizenGeneralPool[key]} onChange={(e) => setCitizenGeneralPool({ ...citizenGeneralPool, [key]: e.target.checked })} />
                  {label}
                </label>
              ))}
            </div>

            <Button theme={theme} disabled={n < 4} onClick={() => socket.emit("admin_start_game", { mafiaPool, citizenPool, neutralPool, citizenGeneralPool })} style={{ marginBottom: 10 }}>
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

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${theme.panelBorder}` }}>
              <span style={{ fontSize: 12.5, color: theme.sub }}>🧪 테스트 모드 (혼자 테스트용 가짜 참여자 + 시점 전환)</span>
              <button onClick={() => socket.emit("admin_toggle_test_mode")}
                style={{ width: 46, height: 26, borderRadius: 999, border: `1px solid ${theme.panelBorder}`,
                  background: testMode ? theme.accent : "rgba(120,120,120,0.25)", position: "relative", cursor: "pointer" }}>
                <span style={{ position: "absolute", top: 2, left: testMode ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
              </button>
            </div>
            {testMode && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11.5, color: theme.sub, marginBottom: 8 }}>
                  치지직 로그인 없이 가짜 참여자를 대기열에 추가할 수 있어요. 게임이 시작되면 아래(게임 화면)에서
                  "시점 전환"으로 그 사람인 척 조작하며 혼자 테스트할 수 있습니다.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={testNickname} onChange={(e) => setTestNickname(e.target.value)}
                    placeholder="가짜 참여자 닉네임" onKeyDown={(e) => {
                      if (e.key === "Enter" && testNickname.trim()) { socket.emit("admin_add_test_player", testNickname); setTestNickname(""); }
                    }}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${theme.panelBorder}`,
                      background: "rgba(255,255,255,0.04)", color: theme.text, fontSize: 13, outline: "none" }} />
                  <Button theme={theme} style={{ padding: "8px 16px", fontSize: 13 }}
                    onClick={() => { socket.emit("admin_add_test_player", testNickname); setTestNickname(""); }}>
                    추가
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
