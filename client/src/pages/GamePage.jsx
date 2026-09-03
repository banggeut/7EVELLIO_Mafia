import React, { useEffect, useRef, useState } from "react";
import { Card, Button, Chip, PhaseHeader, RedactedNotice, PrivateNote, TimerDisplay, AutoNote, ChatPanel, LiveChatFeed, PlayerRow, NewsArticle, PlayerRoster } from "../components/ui.jsx";
import { THEMES, themeForPhase, PHASE_LABEL } from "../theme.js";
import { playNightFall, playDayBreak, playElimination, playMafiaKill, playDoctorSave, playVote } from "../sound.js";

const GEM_TYPES = ["다이아몬드", "루비", "사파이어", "에메랄드"];
const GEM_EMOJI = { "다이아몬드": "💎", "루비": "🔴", "사파이어": "🔷", "에메랄드": "🟢" };

// 플레이어 목록에서 다른 사람 옆에 "예상 직업"을 메모해두기 위한 선택지 (순전히 개인 메모용, 서버로 전송 안 됨)
const ROLE_CATALOG = {
  "🗡️ 마피아팀": ["마피아", "스파이", "해커", "마담", "유괴범", "테러리스트", "마녀"],
  "🌾 시민팀": ["시민", "경찰", "의사", "기자", "영매", "건달", "연인", "신혼부부", "정치인", "탐정", "장의사", "판사", "군인", "공무원", "성직자"],
  "😈 중립": ["악마 숭배자", "뱀파이어", "괴도", "늑대인간", "고양이"],
};

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
  avenger: "복수할 대상을 한 명 선택하세요. 그 사람을 죽이지만, 당신도 함께 목숨을 잃습니다. 게임당 단 한 번뿐이니 신중하게 사용하세요.",
  thief: "보석을 훔칠 대상을 한 명 선택하세요. 이미 훔친 사람에게는 다시 훔칠 수 없습니다.",
  werewolf: "습격할 대상을 한 명 선택하세요. 마피아와 정확히 같은 대상을 노리면, 그 밤 마피아팀과 동맹하게 됩니다.",
  priest: "부활시킬 죽은 사람을 한 명 선택하세요. 게임당 단 한 번만 사용할 수 있고, 부활 사실은 모두에게 공개됩니다.",
  cat: "집사로 삼을 사람을 한 명 선택하세요. 게임당 단 한 번뿐이고, 집사의 소속 팀에 그대로 편입됩니다. 정하지 않으면 승리할 수 없어요.",
  cat_detect: "이번 밤 무엇을 했는지 알아낼 사람을 한 명 선택하세요. 탐정과 동일한 방식으로 매일 밤 사용할 수 있습니다.",
  witch: "저주를 걸 대상을 한 명 선택하세요. 게임당 단 한 번만 사용할 수 있고, 저주에 걸린 사람은 3일 후 목숨을 잃습니다. 그 전에 마녀가 처형되면 저주는 풀립니다.",
  undertaker: "조사할 사망자를 한 명 선택하세요. 정확한 직업과 함께, 영혼을 빼앗겼는지·흡혈귀였는지도 알 수 있습니다.",
};

function alive(players) { return players.filter((p) => p.alive); }

function NightSummaryBanner({ theme, state }) {
  const death = state.lastNightDeath ? state.players.find((p) => p.id === state.lastNightDeath) : null;
  // 마피아의 공격과는 별개로 뜨는 사건들(늑대인간 습격, 마녀 저주 발동, 뱀파이어 격돌, 복수자 킬)이
  // 하나라도 있었다면, 그 밤은 절대 "평화로운 밤"이 아니다.
  const hadOtherEvent = !!(state.werewolfVictimName || state.curseVictimName || state.vampireFightResult || state.avengerKillResult || state.priestReviveName || state.catAppearedName);
  return (
    <div style={{ borderRadius: 12, padding: "12px 14px", background: theme.accentSoft, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: theme.sub, marginBottom: 4, letterSpacing: 1 }}>📌 지난밤 소식</div>
      {death ? (
        <div style={{ fontSize: 13.5, color: theme.text }}>☠️ <b>{death.name}</b>님이 밤 사이 목숨을 잃었습니다</div>
      ) : state.veteranSurvivedName ? (
        <div style={{ fontSize: 13.5, color: theme.text }}>🪖 <b>{state.veteranSurvivedName}</b>님이 마피아의 공격에 맞서 싸워 살아남았습니다</div>
      ) : state.nightSaveHappened ? (
        <div style={{ fontSize: 13.5, color: theme.text }}>🛡️ 누군가 습격당했지만 의사의 보호로 목숨을 건졌습니다</div>
      ) : !hadOtherEvent ? (
        <div style={{ fontSize: 13.5, color: theme.text }}>🌤️ 평화로운 밤이었습니다</div>
      ) : null}
      {state.vampireFightResult && (
        <div style={{ fontSize: 13.5, color: theme.text, marginTop: 4 }}>
          🩸 <b>{state.vampireFightResult.vampireName}</b>님과 <b>{state.vampireFightResult.mafiaName}</b>님이 어둠 속에서 격돌했습니다 — 치열한 사투 끝에 둘 다 쓰러졌습니다
        </div>
      )}
      {state.avengerKillResult && (
        <div style={{ fontSize: 13.5, color: theme.text, marginTop: 4 }}>
          ⚔️ <b>{state.avengerKillResult.avengerName}</b>님과 <b>{state.avengerKillResult.targetName}</b>님이 함께 사망한 채로 발견되었습니다
        </div>
      )}
      {state.werewolfVictimName && (
        <div style={{ fontSize: 13.5, color: theme.text, marginTop: 4 }}>
          🐺 <b>{state.werewolfVictimName}</b>님이 늑대인간에게 습격당해 목숨을 잃었습니다
        </div>
      )}
      {state.priestReviveName && (
        <div style={{ fontSize: 13.5, color: theme.text, marginTop: 4 }}>
          🕊️ <b>{state.priestReviveName}</b>님이 성직자에 의해 부활했습니다
        </div>
      )}
      {state.catAppearedName && (
        <div style={{ fontSize: 13.5, color: theme.text, marginTop: 4 }}>
          🐱 어느새 고양이 한 마리(<b>{state.catAppearedName}</b>)가 마을에 들어와 있었습니다
        </div>
      )}
      {state.reporterReveal && (
        <div style={{ fontSize: 13, color: theme.text, marginTop: 4 }}>
          📰 <b>{state.reporterReveal.name}</b>님의 직업이 <b>[{state.reporterReveal.roleLabel}]</b>(으)로 공개되었습니다
        </div>
      )}
      {state.curseCastName && (
        <div style={{ fontSize: 13, color: theme.text, marginTop: 4 }}>
          🔮 <b>{state.curseCastName}</b>님이 마녀의 저주를 받았습니다 (3일 후 발동)
        </div>
      )}
      {state.curseVictimName && (
        <div style={{ fontSize: 13.5, color: theme.text, marginTop: 4 }}>
          💀 <b>{state.curseVictimName}</b>님이 마녀의 저주가 발동해 목숨을 잃었습니다 (마피아의 습격과는 별개)
        </div>
      )}
    </div>
  );
}

function RevealView({ theme, state, socket }) {
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="reveal" label="직업 확인" />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ color: theme.sub, fontSize: 12.5, margin: "10px 0 16px" }}>
        {state.revealAckCount} / {state.revealTotal}명 확인 완료 · 시간이 지나면 자동으로 밤이 시작돼요. 다른 사람에게 화면을 보여주지 마세요.
      </p>
      <div style={{ borderRadius: 16, padding: "26px 20px", textAlign: "center", background: theme.accentSoft, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 26, fontWeight: 700, color: theme.text, margin: "6px 0" }}>{state.myRoleLabel || "관전 중"}</div>
        <div style={{ fontSize: 13, color: theme.sub, lineHeight: 1.6 }}>{state.myRoleDesc || "이번 게임의 플레이어로 참여하지 않으셨습니다."}</div>
        {(state.teammates?.length || 0) > 0 && <div style={{ marginTop: 14, fontSize: 12.5, color: theme.accent }}>같은 팀: {state.teammates.map((t) => t.name).join(", ")}</div>}
        {state.partnerName && <div style={{ marginTop: 14, fontSize: 12.5, color: theme.accent }}>나의 {state.myRole === "newlywed" ? "배우자" : "연인"}: {state.partnerName}</div>}
      </div>
      {state.myRoleLabel && (
        <Button theme={theme} disabled={state.iHaveRevealAcked} onClick={() => socket.emit("game_action", { type: "REVEAL_ACK" })}>
          {state.iHaveRevealAcked ? "다른 사람을 기다리는 중..." : "확인했어요 →"}
        </Button>
      )}
    </Card>
  );
}

function NightView({ theme, state, socket }) {
  const targets = (state.myAbility?.role === "undertaker" || state.myAbility?.role === "priest")
    ? state.players.filter((p) => !p.alive)
    : alive(state.players).filter((p) => {
        if (!state.myAbility) return false;
        if (p.id === state.myId) return state.myAbility.role === "doctor";
        // 마피아는 전략적으로 같은 팀원도 제거 대상으로 고를 수 있다 (배신 플레이 등). 스파이는 여전히 팀원은 조사 대상에서 제외.
        if (state.myAbility.role === "spy") {
          return !state.teammates.some((t) => t.id === p.id);
        }
        if (state.myAbility.role === "blocker" && p.id === state.myBlockerPrevTarget) return false;
        if (state.myAbility.role === "silencer" && p.id === state.mySilencerPrevTarget) return false;
        if (state.myAbility.role === "thief" && state.myStolenFrom?.[p.id]) return false;
        return true;
      });
  const blockerRepeatBlocked = state.myAbility?.role === "blocker" && state.myBlockerPrevTarget
    ? state.players.find((p) => p.id === state.myBlockerPrevTarget)
    : null;
  const silencerRepeatBlocked = state.myAbility?.role === "silencer" && state.mySilencerPrevTarget
    ? state.players.find((p) => p.id === state.mySilencerPrevTarget)
    : null;
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

      {state.myAbility && state.myAlive && state.myAbility.role === "witch" && state.myWitchUsed && (
        <RedactedNotice theme={theme} text="이미 저주 능력을 사용했습니다. 게임당 한 번뿐이라 더 이상 사용할 수 없어요." />
      )}

      {state.myAbility && state.myAlive && state.myAbility.role === "priest" && state.myPriestUsed && (
        <RedactedNotice theme={theme} text="이미 부활 능력을 사용했습니다. 게임당 한 번뿐이라 더 이상 사용할 수 없어요." />
      )}

      {state.myAbility && state.myAlive
        && (state.myAbility.role !== "vampire" || vampireEligibleNight)
        && (state.myAbility.role !== "witch" || !state.myWitchUsed)
        && (state.myAbility.role !== "priest" || !state.myPriestUsed) && (
        <div style={{ marginBottom: 16 }}>
          {state.myAbility.role === "reporter" && targets.length === 0 && (
            <RedactedNotice theme={theme} text="기자의 능력은 2일차 밤부터, 단 한 번만 사용할 수 있습니다." />
          )}
          {state.myAbility.role === "undertaker" && targets.length === 0 && (
            <RedactedNotice theme={theme} text="아직 죽은 사람이 없어서 조사할 대상이 없습니다." />
          )}
          {state.myAbility.role === "priest" && targets.length === 0 && (
            <RedactedNotice theme={theme} text="아직 죽은 사람이 없어서 부활시킬 대상이 없습니다." />
          )}
          {blockerRepeatBlocked && (
            <RedactedNotice theme={theme} text={`${blockerRepeatBlocked.name}님은 어젯밤 이미 유혹했기 때문에, 이틀 연속으로는 다시 고를 수 없습니다.`} />
          )}
          {silencerRepeatBlocked && (
            <RedactedNotice theme={theme} text={`${silencerRepeatBlocked.name}님은 어젯밤 이미 납치했기 때문에, 이틀 연속으로는 다시 고를 수 없습니다.`} />
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
              const alreadyInvestigated =
                (state.myAbility.role === "undertaker" && state.myUndertakerFindings?.[p.id]) ||
                (state.myAbility.role === "spy" && state.mySpyFindings?.[p.id]);
              const label = voteCount > 0 ? `${p.name} (${voteCount}표)` : alreadyInvestigated ? `${p.name} ✓` : p.name;
              return (
                <Chip key={p.id} theme={theme} label={label}
                  selected={state.myAbility.selectedTargetId === p.id}
                  onClick={() => socket.emit("game_action", { type: "SET_NIGHT_TARGET", role: state.myAbility.role, targetId: p.id })} />
              );
            })}
          </div>
        </div>
      )}

      {!state.myAbility && state.myAlive && !["lover", "newlywed", "medium", "veteran", "vampire", "cat"].includes(state.myRole) && !state.myIsThrall && (
        <p style={{ fontSize: 13, color: theme.sub }}>이번 밤에 사용할 수 있는 능력이 없습니다. 마을이 무사하길 기다려주세요.</p>
      )}

      {state.myRole === "cat" && state.myCatAlignment === "mafia" && (
        <RedactedNotice theme={theme} text="당신의 능력(투표권 제거)은 밤이 아니라 낮 토론 시간에 사용합니다." />
      )}

      {state.myAlive && (state.myTeam === "mafia" || state.myIsWolfAllied || state.myCatAlignment === "mafia") && (
        <ChatPanel theme={theme} title="🗡️ 마피아 팀 채팅" messages={state.chats.mafia} participants={state.chatParticipants?.mafia}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "mafia", text })} />
      )}
      {state.myAlive && ((state.myRole === "lover" || state.myRole === "newlywed") && state.myPartnerId && !state.myIsThrall
        || (state.myRole === "cat" && state.myCatAlignment === "citizen")
        || state.myIsCatOwner) && (
        <ChatPanel theme={theme} title={
          state.myRole === "newlywed" ? "💍 부부 채팅"
          : state.myRole === "lover" ? "💞 연인 채팅"
          : "🐱 집사와의 채팅"
        } messages={state.chats.lover} participants={state.chatParticipants?.lover}
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
  const hadOtherEvent = !!(state.werewolfVictimName || state.curseVictimName || state.vampireFightResult || state.avengerKillResult || state.priestReviveName || state.catAppearedName);
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
        ) : state.nightSaveHappened ? (
          <>
            <div style={{ fontSize: 28 }}>🛡️</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>누군가 밤사이 습격당했지만 목숨을 건졌습니다!</div>
            <div style={{ fontSize: 13, color: theme.sub }}>의사의 보호 덕분에 아무도 죽지 않았습니다</div>
          </>
        ) : !hadOtherEvent ? (
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text }}>🌤️ 평화로운 아침입니다.</div>
        ) : null}
      </div>
      {state.vampireFightResult && (
        <div style={{ borderRadius: 16, padding: "20px 18px", textAlign: "center", background: "rgba(142,76,107,0.16)", border: "1px solid rgba(142,76,107,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🩸</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            {state.vampireFightResult.vampireName}님과 {state.vampireFightResult.mafiaName}님이 어둠 속에서 격돌했습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>치열한 사투 끝에 둘 다 목숨을 잃었습니다</div>
        </div>
      )}
      {state.avengerKillResult && (
        <div style={{ borderRadius: 16, padding: "20px 18px", textAlign: "center", background: "rgba(142,76,107,0.16)", border: "1px solid rgba(142,76,107,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>⚔️</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            {state.avengerKillResult.avengerName}님과 {state.avengerKillResult.targetName}님이 함께 사망한 채로 발견되었습니다
          </div>
        </div>
      )}
      {state.werewolfVictimName && (
        <div style={{ borderRadius: 16, padding: "20px 18px", textAlign: "center", background: "rgba(60,58,90,0.22)", border: "1px solid rgba(140,150,220,0.35)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🌕🐺</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            {state.werewolfVictimName}님이 늑대인간에게 습격당했습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>날카로운 발톱과 이빨 자국이 남아있습니다</div>
        </div>
      )}
      {state.priestReviveName && (
        <div style={{ borderRadius: 16, padding: "20px 18px", textAlign: "center", background: "rgba(232,196,104,0.18)", border: "1px solid rgba(232,196,104,0.45)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🕊️</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            {state.priestReviveName}님이 성직자에 의해 부활했습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>따뜻한 빛이 마을에 다시 한 번의 기회를 내려주었습니다</div>
        </div>
      )}
      {state.catAppearedName && (
        <div style={{ borderRadius: 16, padding: "20px 18px", textAlign: "center", background: "rgba(232,180,120,0.16)", border: "1px solid rgba(232,180,120,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🐱</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            어느새 고양이 한 마리가 마을에 들어와 있었습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>이름은 {state.catAppearedName} — 아무도 언제부터인지 알지 못합니다</div>
        </div>
      )}
      {state.mySoloJobGranted && (
        <PrivateNote theme={theme}>
          🧾 짝을 찾지 못했던 당신에게 빈자리가 생겼습니다 — 이제부터 <b>[{state.mySoloJobGranted}]</b> 직업을 갖게 되었습니다.
        </PrivateNote>
      )}
      {state.curseCastName && (
        <div style={{ borderRadius: 16, padding: "16px 18px", textAlign: "center",
          background: "rgba(123,94,167,0.16)", border: "1px solid rgba(123,94,167,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 24 }}>🔮</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, fontWeight: 700, color: theme.text, margin: "4px 0 2px" }}>
            {state.curseCastName}님이 마녀에게 죽음의 저주를 받았습니다
          </div>
          <div style={{ fontSize: 12.5, color: theme.sub }}>3일 후 저주가 발동됩니다. 그 전에 마녀가 처형되면 저주는 풀립니다.</div>
        </div>
      )}
      {state.curseVictimName && (
        <div style={{ borderRadius: 16, padding: "16px 18px", textAlign: "center",
          background: "rgba(123,94,167,0.16)", border: "1px solid rgba(123,94,167,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 24 }}>💀</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, fontWeight: 700, color: theme.text, margin: "4px 0 0" }}>
            저주가 발동되어 {state.curseVictimName}님이 목숨을 잃었습니다
          </div>
        </div>
      )}
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
        <PrivateNote theme={theme}>😈 영혼 진행 상황: {state.myCultistStacks} / 4 {state.myCultistStacks >= 4 ? "— 소환 완료!" : ""}</PrivateNote>
      )}
      {state.myPoliceResult && <PrivateNote theme={theme}>🔍 조사 결과 (경찰 전용): <b>{state.myPoliceResult.targetName}</b>님은 마피아 팀{state.myPoliceResult.isMafia ? "입니다." : "이 아닙니다."}</PrivateNote>}
      {state.mySpyResult && <PrivateNote theme={theme}>🕵️ 조사 결과 (스파이 전용): <b>{state.mySpyResult.targetName}</b>님의 직업은 [{state.mySpyResult.roleLabel}] 입니다.</PrivateNote>}
      {state.myDetectiveResult && <PrivateNote theme={theme}>🧭 추적 결과 (탐정 전용): <b>{state.myDetectiveResult.actorName}</b>님은 {state.myDetectiveResult.actedOnName ? `${state.myDetectiveResult.actedOnName}님을 대상으로 능력을 사용했습니다.` : "이번 밤 능력을 사용하지 않았습니다."}</PrivateNote>}
      {state.myCatDetectResult && <PrivateNote theme={theme}>🐱 추적 결과: <b>{state.myCatDetectResult.actorName}</b>님은 {state.myCatDetectResult.actedOnName ? `${state.myCatDetectResult.actedOnName}님을 대상으로 능력을 사용했습니다.` : "이번 밤 능력을 사용하지 않았습니다."}</PrivateNote>}
      {state.myDoctorResult && (
        <PrivateNote theme={theme}>
          🩺 {state.myDoctorResult.saved ? "당신의 치료로 한 생명을 살렸습니다!" : "이번 밤은 당신의 보호가 필요하지 않았습니다."}
        </PrivateNote>
      )}
      {state.myUndertakerResult && (
        <PrivateNote theme={theme}>
          ⚰️ 부검 결과 (장의사 전용): <b>{state.myUndertakerResult.targetName}</b>님의 직업은 [{state.myUndertakerResult.roleLabel}] 였습니다.
          {state.myUndertakerResult.wasSoulHarvested && " 악마 숭배자에게 영혼을 빼앗겼던 흔적이 있습니다."}
          {state.myUndertakerResult.wasThrall && " 흡혈귀였던 흔적이 있습니다."}
        </PrivateNote>
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function DiscussionView({ theme, state, socket }) {
  const aliveCount = state.players.filter((p) => p.alive).length;
  const required = Math.ceil(aliveCount * 0.7);
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="discussion" label={PHASE_LABEL(state)} />
      <NightSummaryBanner theme={theme} state={state} />

      {state.myAlive && state.myRole === "cat" && state.myCatAlignment === "mafia" && (
        <div style={{ borderRadius: 12, padding: "12px 14px", background: theme.accentSoft, marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🐱 투표권 없애기</div>
          {state.myCatVoteRemovedName ? (
            <p style={{ fontSize: 12, color: theme.sub, margin: 0 }}><b>{state.myCatVoteRemovedName}</b>님의 투표권을 찢어버렸습니다. (오늘 하루만 유효)</p>
          ) : (
            <>
              <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 8px" }}>오늘 투표에서 한 명의 투표권을 없앨 수 있습니다.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {alive(state.players).filter((p) => p.id !== state.myId).map((p) => (
                  <Chip key={p.id} theme={theme} label={p.name}
                    onClick={() => socket.emit("game_action", { type: "CAT_REMOVE_VOTE", targetId: p.id })} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {state.myAlive && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          borderRadius: 12, padding: "10px 14px", background: theme.accentSoft, marginBottom: 14 }}>
          <span style={{ fontSize: 12.5, color: theme.text }}>
            ⏭ 회의 스킵 투표 · {state.skipVoteCount}/{aliveCount}명 ({required}명 이상이면 즉시 종료)
          </span>
          <Button theme={theme} variant={state.mySkippedVote ? "solid" : "subtle"} style={{ fontSize: 12, padding: "6px 14px" }}
            onClick={() => socket.emit("game_action", { type: "CAST_SKIP_VOTE" })}>
            {state.mySkippedVote ? "✓ 스킵 찬성함" : "스킵하기"}
          </Button>
        </div>
      )}

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
      ) : state.isCatVoteRemoved ? (
        <RedactedNotice theme={theme} text="고양이가 투표권을 찢어버렸습니다." />
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

function JudgeTiebreakView({ theme, state, socket }) {
  const candidates = (state.tiedNominees || []).map((id) => state.players.find((p) => p.id === id)).filter(Boolean);
  const isJudge = state.myRole === "judge" && state.myAlive;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="judgetiebreak" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ textAlign: "center", fontSize: 14, color: theme.text, margin: "12px 0 16px" }}>
        투표가 동점이 나왔습니다. {isJudge ? "판사인 당신이 한 명을 직접 지명해주세요." : "판사가 동점자 중 한 명을 지명하고 있습니다..."}
      </p>
      {isJudge ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 8 }}>
          {candidates.map((p) => (
            <Chip key={p.id} theme={theme} label={p.name}
              onClick={() => socket.emit("game_action", { type: "CAST_JUDGE_TIEBREAK", targetId: p.id })} />
          ))}
        </div>
      ) : (
        <RedactedNotice theme={theme} text={`동점자: ${candidates.map((p) => p.name).join(", ")}`} />
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function JudgeVerdictView({ theme, state, socket }) {
  const nominee = state.players.find((p) => p.id === state.nominee);
  const isJudge = state.myRole === "judge" && state.myAlive && state.myId !== state.nominee;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="judgeverdict" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ textAlign: "center", fontSize: 14, color: theme.text, margin: "12px 0 16px" }}>
        <b>{nominee?.name}</b>님의 처형 여부를 {isJudge ? "판사인 당신이 단독으로 결정합니다." : "판사가 심의하고 있습니다..."}
      </p>
      {isJudge ? (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }}>
          <Button theme={theme} onClick={() => socket.emit("game_action", { type: "CAST_JUDGE_VERDICT", choice: "agree" })}>🔨 처형</Button>
          <Button theme={theme} variant="subtle" onClick={() => socket.emit("game_action", { type: "CAST_JUDGE_VERDICT", choice: "disagree" })}>🕊️ 방면</Button>
        </div>
      ) : (
        <RedactedNotice theme={theme} text="결과는 판결이 끝나면 공개됩니다." />
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

const NEUTRAL_WINNERS = ["cultist", "vampire", "thief", "werewolf"];
function winnerLabel(winner) {
  if (winner === "mafia") return { icon: "🗡️", text: "마피아 팀 승리" };
  if (NEUTRAL_WINNERS.includes(winner)) return { icon: "🎭", text: "중립팀 승리" };
  return { icon: "🌾", text: "시민 팀 승리" };
}

function GameOverView({ theme, state, isAdmin, socket, honorGivenTo }) {
  const w = winnerLabel(state.winner);
  const honorTargetName = honorGivenTo ? state.players.find((p) => p.id === honorGivenTo)?.name : null;
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

        {state.myId && (
          <div style={{ borderRadius: 16, padding: "16px 18px", background: theme.accentSoft, marginBottom: 18, textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 4 }}>🏅 명예 선물하기</div>
            {honorGivenTo ? (
              <p style={{ fontSize: 12.5, color: theme.sub, margin: 0 }}>
                <b>{honorTargetName}</b>님에게 명예를 선물했습니다. 열심히 잘 플레이해주셔서 감사해요!
              </p>
            ) : (
              <>
                <p style={{ fontSize: 12, color: theme.sub, margin: "0 0 10px" }}>
                  이번 판을 열심히, 재미있게 플레이한 사람에게 명예 1점을 선물하세요. 게임당 한 명에게만 줄 수 있어요.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {state.players.filter((p) => p.id !== state.myId).map((p) => (
                    <Chip key={p.id} theme={theme} label={p.name}
                      onClick={() => socket.emit("give_honor", p.id)} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {isAdmin && <Button theme={theme} onClick={() => socket.emit("admin_reset_game")}>새 게임 준비하기</Button>}
      </div>
    </Card>
  );
}

export default function GamePage({ state, socket, isAdmin, streamerMode, testMode, viewingAsId, rosterForTest, honorGivenTo }) {
  const theme = themeForPhase(state.phase);
  const prevPhaseRef = useRef(null);
  const [guesses, setGuesses] = useState({}); // { [playerId]: "역할명" } - 개인 추측 메모, 새로고침하면 초기화됨
  const [guessTargetId, setGuessTargetId] = useState(null); // 지금 팝업이 열려있는 대상 플레이어 id

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
        <div style={{ maxWidth: 640, margin: "0 auto 12px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button theme={theme} variant="ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => socket.emit("admin_force_skip")}>⏭ 강제로 다음 단계</Button>
          {state.phase !== "gameover" && (
            <Button theme={theme} variant="ghost" style={{ fontSize: 12, padding: "6px 12px", borderColor: "#E85D5D", color: "#E85D5D" }}
              onClick={() => {
                if (window.confirm("게임을 지금 즉시 강제 종료할까요?\n모든 참여자가 대기실로 돌아가고, 진행 중인 게임 정보는 사라집니다.")) {
                  socket.emit("admin_reset_game");
                }
              }}>
              ⛔ 즉시 강제종료
            </Button>
          )}
        </div>
      )}
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {state.phase === "reveal" && <RevealView theme={theme} state={state} socket={socket} />}
        {state.phase === "night" && <NightView theme={theme} state={state} socket={socket} />}
        {state.phase === "morning" && <MorningView theme={theme} state={state} />}
        {state.phase === "discussion" && <DiscussionView theme={theme} state={state} socket={socket} />}
        {state.phase === "vote" && <VoteView theme={theme} state={state} socket={socket} />}
        {state.phase === "defense" && <DefenseView theme={theme} state={state} socket={socket} />}
        {state.phase === "judgetiebreak" && <JudgeTiebreakView theme={theme} state={state} socket={socket} />}
        {state.phase === "judgeverdict" && <JudgeVerdictView theme={theme} state={state} socket={socket} />}
        {state.phase === "finalvote" && <FinalVoteView theme={theme} state={state} socket={socket} />}
        {state.phase === "voteresult" && <VoteResultView theme={theme} state={state} />}
        {state.phase === "gameover" && <GameOverView theme={theme} state={state} isAdmin={isAdmin} socket={socket} honorGivenTo={honorGivenTo} />}
      </div>

      {state.myRole === "thief" && state.phase !== "reveal" && state.phase !== "gameover" && (
        <div style={{ maxWidth: 640, margin: "16px auto 0" }}>
          <Card theme={theme}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.accent, marginBottom: 10 }}>🎭 훔친 보석 현황</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {GEM_TYPES.map((gem) => {
                const owned = state.myStolenGemTypes?.includes(gem);
                return (
                  <div key={gem} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                    borderRadius: 999, background: owned ? theme.accentSoft : "rgba(120,120,120,0.12)",
                    border: `1px solid ${owned ? theme.accent : theme.panelBorder}`, opacity: owned ? 1 : 0.5 }}>
                    <span style={{ fontSize: 15 }}>{GEM_EMOJI[gem]}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: owned ? theme.text : theme.sub }}>{gem}</span>
                    {owned && <span style={{ fontSize: 11 }}>✓</span>}
                  </div>
                );
              })}
            </div>
            {(state.myStolenGemTypes?.length || 0) >= GEM_TYPES.length ? (
              <p style={{ fontSize: 11.5, color: theme.accent, marginTop: 10 }}>모든 보석을 다 모았습니다!</p>
            ) : (
              <p style={{ fontSize: 11.5, color: theme.sub, marginTop: 10 }}>네 가지 보석을 모두 모으면 승리합니다.</p>
            )}
          </Card>
        </div>
      )}

      {state.myRole === "official" && state.phase !== "reveal" && state.phase !== "gameover" && (
        <div style={{ maxWidth: 640, margin: "16px auto 0" }}>
          <Card theme={theme}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.accent, marginBottom: 10 }}>🗂️ 어제 낮 투표 열람</div>
            {(!state.myLastDayVotes || state.myLastDayVotes.length === 0) ? (
              <p style={{ fontSize: 12, color: theme.sub, margin: 0 }}>아직 열람할 낮 투표 기록이 없습니다.</p>
            ) : (
              <>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>지목 투표</div>
                <div style={{ display: "grid", gridTemplateRows: "repeat(5, auto)", gridAutoFlow: "column", columnGap: 20, rowGap: 5, marginBottom: 14, overflowX: "auto" }}>
                  {state.myLastDayVotes.map((v, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 12 }}>
                      <span title={v.voterName} style={{ display: "inline-block", width: 60, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700, color: theme.text }}>
                        {v.voterName}
                      </span>
                      {v.targetName ? (
                        <>
                          <span style={{ margin: "0 4px", color: theme.sub, flexShrink: 0 }}>→</span>
                          <span style={{ color: theme.text, whiteSpace: "nowrap" }}>{v.targetName}</span>
                        </>
                      ) : (
                        <span style={{ marginLeft: 4, color: theme.sub, whiteSpace: "nowrap" }}>미투표</span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>찬반 투표</div>
                {state.myLastDayJudgeDecided ? (
                  <p style={{ fontSize: 12, color: theme.sub, margin: 0 }}>이번엔 판사가 대신 처형 여부를 결정해서, 개별 찬반 결과가 없습니다.</p>
                ) : (state.myLastDayFinalVotes && state.myLastDayFinalVotes.length > 0) ? (
                  <div style={{ display: "grid", gridTemplateRows: "repeat(5, auto)", gridAutoFlow: "column", columnGap: 20, rowGap: 5, overflowX: "auto" }}>
                    {state.myLastDayFinalVotes.map((v, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", fontSize: 12 }}>
                        <span title={v.voterName} style={{ display: "inline-block", width: 60, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700, color: theme.text }}>
                          {v.voterName}
                        </span>
                        <span style={{ whiteSpace: "nowrap", color: v.choice ? theme.text : theme.sub }}>
                          {v.choice === "agree" ? "👍 찬성" : v.choice === "disagree" ? "👎 반대" : "미투표"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: theme.sub, margin: 0 }}>어제는 처형 찬반 투표가 진행되지 않았습니다.</p>
                )}
              </>
            )}
          </Card>
        </div>
      )}

      {state.phase !== "reveal" && state.phase !== "gameover" && state.players && (
        <div style={{ maxWidth: 640, margin: "16px auto 0" }}>
          <Card theme={theme}>
            <PlayerRoster theme={theme} players={
              state.players.map((p) => {
                let next = p;
                // 장의사 본인이 조사한 사망자 정보 (영혼 강탈/흡혈귀 여부 포함)
                if (state.myRole === "undertaker" && state.myUndertakerFindings?.[p.id]) {
                  const finding = state.myUndertakerFindings[p.id];
                  const note = [finding.wasSoulHarvested && "영혼 강탈됨", finding.wasThrall && "흡혈귀였음"].filter(Boolean).join(" · ");
                  // 이미 공개적으로 밝혀진 직업(기자 특종 등)이 있다면 그걸 그대로 두고, 없을 때만 장의사 본인 조사 결과로 채운다.
                  next = { ...next, roleLabel: next.roleLabel || finding.roleLabel, undertakerNote: note || undefined };
                }
                // 스파이 본인이 조사해서 알아낸 직업 (해커에게 조작당했다면 그 조작된 결과 그대로)
                if (state.myRole === "spy" && state.mySpyFindings?.[p.id]) {
                  next = { ...next, roleLabel: next.roleLabel || state.mySpyFindings[p.id] };
                }
                // 성직자가 마녀의 저주·뱀파이어의 습격을 막아내면서 알아낸 상대의 정체
                if (state.myRole === "priest" && state.myPriestFindings?.[p.id]) {
                  const finding = state.myPriestFindings[p.id];
                  next = { ...next, roleLabel: next.roleLabel || (finding.type === "witch" ? "마녀" : "뱀파이어") };
                }
                // 마피아팀끼리는 서로의 정확한 직업을 알아본다 (동맹한 늑대인간, 마피아 편입 고양이 포함).
                if (state.myTeam === "mafia" || state.myIsWolfAllied || state.myCatAlignment === "mafia") {
                  const teammate = state.teammates?.find((t) => t.id === p.id);
                  if (teammate) next = { ...next, roleLabel: next.roleLabel || teammate.roleLabel };
                }
                // 뱀파이어와 흡혈귀는 서로를 확실히 알아본다.
                if (state.myRole === "vampire" || state.myIsThrall) {
                  const vt = state.vampireTeammates?.find((t) => t.id === p.id);
                  if (vt) next = { ...next, vampireNote: vt.isVampire ? "🧛 뱀파이어" : "🩸 흡혈귀" };
                }
                // 괴도 본인 화면에서는, 훔친 사람 옆에 어떤 보석이었는지 표시한다 - 직업이 공개되어 있어도(roleLabel과) 함께 뜬다.
                if (state.myRole === "thief" && state.myStolenFrom?.[p.id]) {
                  const gem = state.myStolenFrom[p.id];
                  next = { ...next, gemNote: `${GEM_EMOJI[gem]} ${gem}` };
                }
                // 아직 직업이 공개되지 않은 사람에 한해, 내가 개인적으로 메모해둔 예상 직업을 붙인다.
                // 공개(roleLabel)되는 순간 이 추측은 화면에서 자동으로 사라지고 실제 직업으로 대체된다.
                if (!next.roleLabel && guesses[p.id]) {
                  next = { ...next, guessLabel: guesses[p.id] };
                }
                return next;
              })
            } teamCounts={state.teamCounts} onPlayerClick={setGuessTargetId} />
          </Card>
        </div>
      )}

      {guessTargetId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setGuessTargetId(null)}>
          <div style={{ width: "100%", maxWidth: 420, maxHeight: "80vh", overflowY: "auto", borderRadius: 18,
            background: theme.panel, border: `1px solid ${theme.panelBorder}`, padding: 20 }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: 16, color: theme.text, marginBottom: 4 }}>
              {state.players.find((p) => p.id === guessTargetId)?.name}님의 예상 직업
            </div>
            <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 14px" }}>
              나만 보이는 개인 메모예요. 실제로 직업이 공개되면 자동으로 사라지고 진짜 직업으로 바뀝니다.
            </p>
            {Object.entries(ROLE_CATALOG).map(([teamLabel, roles]) => (
              <div key={teamLabel} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.accent, marginBottom: 6 }}>{teamLabel}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {roles.map((role) => (
                    <Chip key={role} theme={theme} label={role}
                      selected={guesses[guessTargetId] === role}
                      onClick={() => { setGuesses((g) => ({ ...g, [guessTargetId]: role })); setGuessTargetId(null); }} />
                  ))}
                </div>
              </div>
            ))}
            {guesses[guessTargetId] && (
              <Button theme={theme} variant="ghost" style={{ marginTop: 4 }}
                onClick={() => { setGuesses((g) => { const next = { ...g }; delete next[guessTargetId]; return next; }); setGuessTargetId(null); }}>
                추측 지우기
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
