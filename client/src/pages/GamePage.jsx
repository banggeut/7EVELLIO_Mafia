import React, { useEffect, useRef } from "react";
import { Card, Button, Chip, PhaseHeader, RedactedNotice, PrivateNote, TimerDisplay, AutoNote, ChatPanel, LiveChatFeed, PlayerRow, NewsArticle, PlayerRoster } from "../components/ui.jsx";
import { THEMES, themeForPhase, PHASE_LABEL } from "../theme.js";
import { playNightFall, playDayBreak, playElimination, playMafiaKill, playDoctorSave, playVote } from "../sound.js";

const NIGHT_ABILITY_LABELS = {
  mafia: "제거할 대상을 한 명 지목하세요.",
  spy: "직업을 조사할 대상을 한 명 지목하세요.",
  framer: "조작할 대상을 한 명 지목하세요. 그 사람이 이번 밤 조사받으면 조작된 기록으로 마피아처럼 보이게 됩니다.",
  blocker: "유혹할 대상을 한 명 지목하세요. 그 사람은 이번 밤 자신의 능력을 사용하지 못합니다.",
  silencer: "납치할 대상을 한 명 지목하세요. 그 사람은 다음날 낮 채팅을 전혀 칠 수 없습니다.",
  police: "조사할 대상을 한 명 선택하세요. 결과는 당신의 화면에만 보입니다.",
  doctor: "보호할 대상을 한 명 선택하세요. 자기 자신도 선택할 수 있습니다.",
  soldier: "협박할 대상을 한 명 선택하세요. 그 사람은 다음날 투표를 할 수 없습니다.",
  reporter: "직업을 공개할 대상을 한 명 선택하세요. (2일차 밤부터, 단 한 번)",
  detective: "행동을 추적할 대상을 한 명 선택하세요.",
  cultist: "지목할 대상을 한 명 선택하세요. 내일 이 사람이 투표로 처형되면 영혼을 하나 얻습니다.",
  vampire: "흡혈할 대상을 한 명 선택하세요. 그 사람은 흡혈귀가 됩니다. (1일차 제외 홀수일차 밤에만 사용 가능)",
};

function alive(players) { return players.filter((p) => p.alive); }

function NightSummaryBanner({ theme, state }) {
  const death = state.lastNightDeath ? state.players.find((p) => p.id === state.lastNightDeath) : null;
  return (
    <div style={{ borderRadius: 12, padding: "12px 14px", background: theme.accentSoft, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: theme.sub, marginBottom: 4, letterSpacing: 1 }}>📌 지난밤 소식</div>
      {death ? (
        <div style={{ fontSize: 13.5, color: theme.text }}>☠️ <b>{death.name}</b>님이 밤 사이 목숨을 잃었습니다</div>
      ) : state.veteranSurvivedName ? (
        <div style={{ fontSize: 13.5, color: theme.text }}>🪖 <b>{state.veteranSurvivedName}</b>님이 마피아의 공격에 맞서 싸워 살아남았습니다</div>
      ) : state.vampireFightResult ? (
        <div style={{ fontSize: 13.5, color: theme.text }}>⚔️ 뱀파이어와 마피아가 격돌해 서로 목숨을 잃었습니다</div>
      ) : state.nightSaveHappened ? (
        <div style={{ fontSize: 13.5, color: theme.text }}>🛡️ 누군가 습격당했지만 의사의 보호로 목숨을 건졌습니다</div>
      ) : (
        <div style={{ fontSize: 13.5, color: theme.text }}>🌤️ 평화로운 밤이었습니다</div>
      )}
      {state.reporterReveal && (
        <div style={{ fontSize: 13, color: theme.text, marginTop: 4 }}>
          📰 <b>{state.reporterReveal.name}</b>님의 직업이 <b>[{state.reporterReveal.roleLabel}]</b>(으)로 공개되었습니다
        </div>
      )}
    </div>
  );
}

function RevealView({ theme, state, socket }) {
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="reveal" label="직업 확인" />
      <p style={{ color: theme.sub, fontSize: 12.5, margin: "4px 0 16px" }}>
        {state.revealAckCount} / {state.revealTotal}명 확인 완료 · 다른 사람에게 화면을 보여주지 마세요.
      </p>
      <div style={{ borderRadius: 16, padding: "26px 20px", textAlign: "center", background: theme.accentSoft, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 26, fontWeight: 700, color: theme.text, margin: "6px 0" }}>{state.myRoleLabel}</div>
        <div style={{ fontSize: 13, color: theme.sub, lineHeight: 1.6 }}>{state.myRoleDesc}</div>
        {state.teammates.length > 0 && <div style={{ marginTop: 14, fontSize: 12.5, color: theme.accent }}>같은 팀: {state.teammates.map((t) => t.name).join(", ")}</div>}
        {state.partnerName && <div style={{ marginTop: 14, fontSize: 12.5, color: theme.accent }}>나의 연인: {state.partnerName}</div>}
      </div>
      <Button theme={theme} disabled={state.iHaveRevealAcked} onClick={() => socket.emit("game_action", { type: "REVEAL_ACK" })}>
        {state.iHaveRevealAcked ? "다른 사람을 기다리는 중..." : "확인했어요 →"}
      </Button>
    </Card>
  );
}

function NightView({ theme, state, socket }) {
  const targets = alive(state.players).filter((p) => {
    if (!state.myAbility) return false;
    if (p.id === state.myId) return state.myAbility.role === "doctor";
    if (state.myAbility.role === "mafia" || state.myAbility.role === "spy") {
      return !state.teammates.some((t) => t.id === p.id);
    }
    return true;
  });
  const vampireEligibleNight = state.dayNumber >= 3 && state.dayNumber % 2 === 1;
  const inVampireTeam = state.myRole === "vampire" || state.myIsThrall;

  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="night" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <div style={{ background: theme.accentSoft, borderRadius: 12, padding: "10px 14px", fontSize: 13, color: theme.text, margin: "14px 0 16px", textAlign: "center" }}>
        🌙 밤이 되었습니다. 직업이 있는 플레이어는 능력을 사용해주세요.
      </div>

      {!state.myAlive && (
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 6 }}>이미 사망하셨습니다. 아래 채팅으로 영매·다른 사망자와 대화를 나눠보세요.</p>
      )}

      {state.myRole === "veteran" && state.myAlive && (
        <RedactedNotice theme={theme}
          text={state.myUsedDefense ? "이미 방어 능력을 사용했습니다. 더 이상 마피아의 공격을 막을 수 없어요." : "당신은 단 한 번, 마피아의 공격을 자동으로 막아낼 수 있습니다. 아직 사용하지 않았어요 — 따로 지목할 필요 없이 공격받으면 자동 발동됩니다."} />
      )}

      {state.myAbility && state.myAlive && state.myAbility.role === "vampire" && !vampireEligibleNight && (
        <RedactedNotice theme={theme} text="뱀파이어의 능력은 1일차를 제외한 홀수일차 밤에만 사용할 수 있습니다." />
      )}

      {state.myAbility && state.myAlive && (state.myAbility.role !== "vampire" || vampireEligibleNight) && (
        <div style={{ marginBottom: 16 }}>
          {state.myAbility.role === "reporter" && targets.length === 0 && (
            <RedactedNotice theme={theme} text="기자의 능력은 2일차 밤부터, 단 한 번만 사용할 수 있습니다." />
          )}
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.accent, marginBottom: 8 }}>
            {state.myRoleLabel} 능력 — {NIGHT_ABILITY_LABELS[state.myAbility.role]}
          </div>
          {state.myAbility.role === "mafia" && (
            <p style={{ fontSize: 11.5, color: theme.sub, marginBottom: 8 }}>마피아 팀 전체의 표를 모아 최다 득표자가 제거됩니다. 동표면 무작위로 정해져요.</p>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {targets.map((p) => {
              const voteCount = state.myAbility.role === "mafia" ? state.mafiaVoteTally?.[p.id] || 0 : 0;
              return (
                <Chip key={p.id} theme={theme} label={voteCount > 0 ? `${p.name} (${voteCount}표)` : p.name}
                  selected={state.myAbility.selectedTargetId === p.id}
                  onClick={() => socket.emit("game_action", { type: "SET_NIGHT_TARGET", role: state.myAbility.role, targetId: p.id })} />
              );
            })}
          </div>
        </div>
      )}

      {!state.myAbility && state.myAlive && !["lover", "medium", "veteran", "vampire"].includes(state.myRole) && !state.myIsThrall && (
        <p style={{ fontSize: 13, color: theme.sub }}>이번 밤에 사용할 수 있는 능력이 없습니다. 마을이 무사하길 기다려주세요.</p>
      )}

      {state.myAlive && (state.myRole === "mafia" || state.myRole === "spy" || state.myRole === "framer" || state.myRole === "blocker" || state.myRole === "silencer") && (
        <ChatPanel theme={theme} title="🗡️ 마피아 팀 채팅" messages={state.chats.mafia} participants={state.chatParticipants?.mafia}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "mafia", text })} />
      )}
      {state.myAlive && state.myRole === "lover" && state.myPartnerId && !state.myIsThrall && (
        <ChatPanel theme={theme} title="💞 연인 채팅" messages={state.chats.lover} participants={state.chatParticipants?.lover}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "lover", text })} />
      )}
      {state.myAlive && inVampireTeam && (
        <ChatPanel theme={theme} title="🧛 뱀파이어 팀 채팅" messages={state.chats.vampire} participants={state.chatParticipants?.vampire}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "vampire", text })} />
      )}
      {(state.myRole === "medium" || !state.myAlive) && (
        <ChatPanel theme={theme} title="👻 영매 & 사망자 채팅" messages={state.chats.medium} participants={state.chatParticipants?.medium}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "medium", text })} />
      )}

      <AutoNote theme={theme} />
    </Card>
  );
}

function MorningView({ theme, state }) {
  const death = state.lastNightDeath ? state.players.find((p) => p.id === state.lastNightDeath) : null;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="morning" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <div style={{ borderRadius: 16, padding: "20px 18px", textAlign: "center", background: theme.accentSoft, margin: "14px 0" }}>
        {death ? (
          <>
            <div style={{ fontSize: 28 }}>☠️</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{death.name}님이 밤 사이 목숨을 잃었습니다</div>
          </>
        ) : state.veteranSurvivedName ? (
          <>
            <div style={{ fontSize: 28 }}>🪖</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{state.veteranSurvivedName}님이 마피아의 공격에 맞서 싸워 살아남았습니다!</div>
          </>
        ) : state.vampireFightResult ? (
          <>
            <div style={{ fontSize: 28 }}>⚔️</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>뱀파이어와 마피아가 격돌해 서로 목숨을 잃었습니다</div>
          </>
        ) : state.nightSaveHappened ? (
          <>
            <div style={{ fontSize: 28 }}>🛡️</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>누군가 밤사이 습격당했지만 목숨을 건졌습니다!</div>
            <div style={{ fontSize: 13, color: theme.sub }}>의사의 보호 덕분에 아무도 죽지 않았습니다</div>
          </>
        ) : (
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text }}>🌤️ 평화로운 아침입니다.</div>
        )}
      </div>
      {state.reporterReveal && (
        <NewsArticle theme={theme} dayNumber={state.dayNumber} name={state.reporterReveal.name} roleLabel={state.reporterReveal.roleLabel} />
      )}
      {state.isBlockedVoter && (
        <PrivateNote theme={theme}>🎖️ 당신은 밤사이 건달에게 협박당했습니다. 오늘은 투표를 할 수 없어요.</PrivateNote>
      )}
      {state.isBlockedChatter && (
        <PrivateNote theme={theme}>⛓️ 당신은 밤사이 유괴범에게 납치당했습니다. 오늘은 낮 채팅을 할 수 없어요.</PrivateNote>
      )}
      {state.myAbilityWasBlocked && (
        <PrivateNote theme={theme}>💋 마담의 유혹에 넘어가서, 이번 밤 당신의 능력이 발동되지 않았습니다.</PrivateNote>
      )}
      {state.mySpyCaughtByName && (
        <PrivateNote theme={theme}>🕵️ <b>{state.mySpyCaughtByName}</b>님이 스파이라는 사실을 알아챘습니다! (당신을 조사했다가 정체가 들켰어요)</PrivateNote>
      )}
      {typeof state.myCultistStacks === "number" && (
        <PrivateNote theme={theme}>😈 영혼 진행 상황: {state.myCultistStacks} / 6 {state.myCultistStacks >= 6 ? "— 소환 완료!" : ""}</PrivateNote>
      )}
      {state.myPoliceResult && <PrivateNote theme={theme}>🔍 조사 결과 (경찰 전용): <b>{state.myPoliceResult.targetName}</b>님은 마피아 팀{state.myPoliceResult.isMafia ? "입니다." : "이 아닙니다."}</PrivateNote>}
      {state.mySpyResult && <PrivateNote theme={theme}>🕵️ 조사 결과 (스파이 전용): <b>{state.mySpyResult.targetName}</b>님의 직업은 [{state.mySpyResult.roleLabel}] 입니다.</PrivateNote>}
      {state.myDetectiveResult && <PrivateNote theme={theme}>🧭 추적 결과 (탐정 전용): <b>{state.myDetectiveResult.actorName}</b>님은 {state.myDetectiveResult.actedOnName ? `${state.myDetectiveResult.actedOnName}님을 대상으로 능력을 사용했습니다.` : "이번 밤 능력을 사용하지 않았습니다."}</PrivateNote>}
      {state.myDoctorResult && (
        <PrivateNote theme={theme}>
          🩺 {state.myDoctorResult.saved ? "당신의 치료로 한 생명을 살렸습니다!" : "이번 밤은 당신의 보호가 필요하지 않았습니다."}
        </PrivateNote>
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function DiscussionView({ theme, state, socket }) {
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="discussion" label={PHASE_LABEL(state)} />
      <NightSummaryBanner theme={theme} state={state} />
      {state.myAlive && !state.isBlockedChatter ? (
        <>
          <p style={{ color: theme.sub, fontSize: 13, margin: "4px 0 10px" }}>
            치지직 채팅으로 대화하거나, 아래에서 바로 입력해도 똑같이 표시돼요.
          </p>
          <ChatPanel theme={theme} title="💬 채팅" messages={state.dayChat}
            onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "day", text })} />
        </>
      ) : (
        <>
          <p style={{ color: theme.sub, fontSize: 13, margin: "4px 0 10px" }}>
            {state.isBlockedChatter ? "유괴범에게 납치당해 오늘은 채팅을 칠 수 없어요. 대화는 지켜볼 수 있어요." : "사망하셨기 때문에 낮 채팅에는 참여할 수 없어요. 대화는 지켜볼 수 있어요."}
          </p>
          <LiveChatFeed theme={theme} title="💬 채팅 (읽기 전용)" messages={state.dayChat} />
        </>
      )}
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <AutoNote theme={theme} text="시간이 지나면 자동으로 투표가 시작됩니다." />
    </Card>
  );
}

function VoteView({ theme, state, socket }) {
  const targets = alive(state.players).filter((p) => p.id !== state.myId);
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="vote" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      {state.isBlockedVoter ? (
        <RedactedNotice theme={theme} text="지난밤 협박당해 오늘은 투표할 수 없습니다." />
      ) : (
        <>
          <p style={{ fontSize: 12.5, color: theme.sub, margin: "12px 0 8px" }}>
            처형할 대상을 지목하세요. {state.myRole === "politician" && "(정치인은 2표를 행사합니다)"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {targets.map((p) => (
              <Chip key={p.id} theme={theme} label={p.name} selected={state.myVoteTarget === p.id}
                onClick={() => socket.emit("game_action", { type: "CAST_VOTE", targetId: p.id })} />
            ))}
          </div>
        </>
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function DefenseView({ theme, state, socket }) {
  const nominee = state.players.find((p) => p.id === state.nominee);
  const isNominee = state.myId === state.nominee;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="defense" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <div style={{ textAlign: "center", margin: "14px 0" }}>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text }}>⚖️ {nominee?.name}님의 최후 변론 시간입니다</div>
        <p style={{ fontSize: 12.5, color: theme.sub, marginTop: 6 }}>
          {!state.myAlive
            ? "사망하셨기 때문에 채팅에 참여할 수 없어요. 변론은 지켜볼 수 있어요."
            : isNominee
            ? "치지직 채팅이나 아래 입력창으로 변론을 남겨주세요. 방송 화면에도 그대로 표시됩니다."
            : `${nominee?.name}님의 변론을 기다리는 중입니다.`}
        </p>
      </div>
      {state.myAlive && isNominee && !state.isBlockedChatter ? (
        <ChatPanel theme={theme} title="💬 채팅" messages={state.dayChat}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "day", text })} />
      ) : (
        <LiveChatFeed theme={theme} title="💬 채팅 (읽기 전용)" messages={state.dayChat} />
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function FinalVoteView({ theme, state, socket }) {
  const nominee = state.players.find((p) => p.id === state.nominee);
  const cannotVote = state.myId === state.nominee || state.isBlockedVoter;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="finalvote" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ textAlign: "center", fontSize: 14, color: theme.text, margin: "12px 0 16px" }}><b>{nominee?.name}</b>님을 마을에서 처형할까요?</p>
      {cannotVote ? (
        <RedactedNotice theme={theme} text={state.myId === state.nominee ? "본인은 이 투표에 참여할 수 없습니다." : "지난밤 협박당해 오늘은 투표할 수 없습니다."} />
      ) : (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }}>
          <Button theme={theme} variant={state.myFinalVote === "agree" ? "solid" : "subtle"} onClick={() => socket.emit("game_action", { type: "CAST_FINAL_VOTE", choice: "agree" })}>👍 찬성 (처형)</Button>
          <Button theme={theme} variant={state.myFinalVote === "disagree" ? "solid" : "subtle"} onClick={() => socket.emit("game_action", { type: "CAST_FINAL_VOTE", choice: "disagree" })}>👎 반대</Button>
        </div>
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function VoteResultView({ theme, state }) {
  const eliminated = state.lastEliminated ? state.players.find((p) => p.id === state.lastEliminated) : null;
  const nomineePlayer = state.nominee ? state.players.find((p) => p.id === state.nominee) : null;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="voteresult" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <div style={{ borderRadius: 16, padding: "20px 18px", textAlign: "center", background: theme.accentSoft, margin: "14px 0" }}>
        {eliminated ? (
          <>
            <div style={{ fontSize: 28 }}>⚖️</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{eliminated.name}님이 마을에서 처형되었습니다</div>
            <div style={{ fontSize: 13, color: theme.sub }}>{eliminated.isMafia ? "마피아였습니다" : "마피아가 아니었습니다"}</div>
            {state.terroristBombVictimName && (
              <div style={{ fontSize: 13, color: theme.text, marginTop: 8 }}>💣 테러리스트의 자폭으로 <b>{state.terroristBombVictimName}</b>님이 함께 목숨을 잃었습니다</div>
            )}
          </>
        ) : state.politicianSaved && nomineePlayer ? (
          <>
            <div style={{ fontSize: 28 }}>🎩</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{nomineePlayer.name}님은 정치인이라 처형되지 않았습니다!</div>
            <div style={{ fontSize: 13, color: theme.sub }}>과반수가 찬성했지만, 정치인은 투표로 처형할 수 없습니다</div>
          </>
        ) : (
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 17, fontWeight: 700, color: theme.text }}>아무도 처형되지 않았습니다</div>
        )}
      </div>
      <AutoNote theme={theme} text="시간이 지나면 자동으로 다음 밤이 시작됩니다." />
    </Card>
  );
}

const WINNER_LABEL = {
  mafia: { icon: "🗡️", text: "마피아 팀 승리" },
  citizen: { icon: "🌾", text: "시민 팀 승리" },
  cultist: { icon: "😈", text: "악마 숭배자 승리" },
  vampire: { icon: "🧛", text: "뱀파이어 팀 승리" },
};

function GameOverView({ theme, state, isAdmin, socket }) {
  const w = WINNER_LABEL[state.winner] || WINNER_LABEL.citizen;
  return (
    <Card theme={theme}>
      <div style={{ textAlign: "center", padding: "10px 0" }}>
        <div style={{ fontSize: 44 }}>{w.icon}</div>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 26, fontWeight: 700, color: theme.text, margin: "10px 0 4px" }}>
          {w.text}
        </div>
        <p style={{ color: theme.sub, fontSize: 13, marginBottom: 18 }}>모든 플레이어의 직업이 공개됩니다.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "left", marginBottom: 20 }}>
          {state.players.map((p) => <PlayerRow key={p.id} theme={theme} player={{ ...p, alive: true }} sub={p.roleLabel + (p.isThrall ? " (흡혈귀화)" : "") + (p.alive ? "" : " · 사망")} />)}
        </div>
        {isAdmin && <Button theme={theme} onClick={() => socket.emit("admin_reset_game")}>새 게임 준비하기</Button>}
      </div>
    </Card>
  );
}

export default function GamePage({ state, socket, isAdmin, streamerMode, testMode, viewingAsId, rosterForTest }) {
  const theme = themeForPhase(state.phase);
  const prevPhaseRef = useRef(null);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (prev === null || prev === state.phase) return; // 첫 렌더 또는 같은 단계 재렌더링이면 스킵

    if (state.phase === "night") {
      playNightFall();
    } else if (state.phase === "morning") {
      playDayBreak();
      if (state.lastNightDeath) {
        setTimeout(() => playMafiaKill(), 350);
      }
      if (state.nightSaveHappened) {
        setTimeout(() => playDoctorSave(), 500);
      }
    } else if (state.phase === "vote") {
      playVote();
    } else if (state.phase === "voteresult" && state.lastEliminated) {
      playElimination();
    }
  }, [state.phase]);

  return (
    <div style={{ minHeight: "100vh", background: theme.bg, transition: "background 0.8s ease", padding: "20px 16px 60px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600;700&family=Noto+Sans+KR:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        input, button, textarea { font-family: inherit; }
      `}</style>

      {isAdmin && testMode && (
        <div style={{ maxWidth: 640, margin: "0 auto 12px" }}>
          <div style={{ borderRadius: 14, padding: "12px 16px", background: theme.panel, border: `1px solid ${theme.panelBorder}`, backdropFilter: "blur(6px)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.sub, marginBottom: 8 }}>
              🧪 테스트 모드 · 시점 전환 {viewingAsId ? `(현재: ${rosterForTest?.find((p) => p.id === viewingAsId)?.name || "?"} 시점으로 조작 중)` : "(현재: 관리자 본인 시점)"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <Chip theme={theme} label="🎬 관리자 본인" selected={!viewingAsId} onClick={() => socket.emit("admin_set_test_perspective", null)} />
              {(rosterForTest || []).map((p) => (
                <Chip key={p.id} theme={theme} label={p.name} selected={viewingAsId === p.id}
                  onClick={() => socket.emit("admin_set_test_perspective", p.id)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div style={{ maxWidth: 640, margin: "0 auto 12px", display: "flex", justifyContent: "flex-end" }}>
          <Button theme={theme} variant="ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => socket.emit("admin_force_skip")}>⏭ 강제로 다음 단계</Button>
        </div>
      )}
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {state.phase === "reveal" && <RevealView theme={theme} state={state} socket={socket} />}
        {state.phase === "night" && <NightView theme={theme} state={state} socket={socket} />}
        {state.phase === "morning" && <MorningView theme={theme} state={state} />}
        {state.phase === "discussion" && <DiscussionView theme={theme} state={state} socket={socket} />}
        {state.phase === "vote" && <VoteView theme={theme} state={state} socket={socket} />}
        {state.phase === "defense" && <DefenseView theme={theme} state={state} socket={socket} />}
        {state.phase === "finalvote" && <FinalVoteView theme={theme} state={state} socket={socket} />}
        {state.phase === "voteresult" && <VoteResultView theme={theme} state={state} />}
        {state.phase === "gameover" && <GameOverView theme={theme} state={state} isAdmin={isAdmin} socket={socket} />}
      </div>

      {state.phase !== "reveal" && state.phase !== "gameover" && state.players && (
        <div style={{ maxWidth: 640, margin: "16px auto 0" }}>
          <Card theme={theme}>
            <PlayerRoster theme={theme} players={state.players} />
          </Card>
        </div>
      )}
    </div>
  );
}
