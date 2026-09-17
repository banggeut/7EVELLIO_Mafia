import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameLayoutContext, ChatRoomsContext, useGameLayout, useIsDesktop } from "../components/gameLayout.jsx";
import RoleGuide from "../components/RoleGuide.jsx";
import { useTimerSeconds } from "../timerStore.js";
import { ROLE_GUIDE } from "../roleGuide.js";
import { Card, Button, Chip, PhaseHeader, RedactedNotice, PrivateNote, TimerDisplay, AutoNote, ChatPanel, LiveChatFeed, PlayerRow, NewsArticle, PlayerRoster, PlayerAvatar } from "../components/ui.jsx";
import { THEMES, NOIR_THEMES, noirThemeForPhase, PHASE_LABEL } from "../theme.js";
import { playNightFall, playDayBreak, playElimination, playMafiaKill, playDoctorSave, playVote, playPhishingAlert, playSample, playPlayerSample, PLAYER_PHASE_GAIN } from "../sound.js";

// 방송용 페이즈 효과음 파일을 플레이어 화면에서는 조금 작게 재생한다.
const phaseSound = (name, fallback) => playSample(name, { gain: PLAYER_PHASE_GAIN, fallback });
const WIN_SOUNDS = { mafia: "win_mafia", citizen: "win_citizen", cultist: "win_cultist", vampire: "win_vampire", thief: "win_thief", werewolf: "win_werewolf", mercenary: "win_mercenary" };

const GEM_TYPES = ["다이아몬드", "루비", "사파이어", "에메랄드"];
const GEM_EMOJI = { "다이아몬드": "💎", "루비": "🔴", "사파이어": "🔷", "에메랄드": "🟢" };

// 플레이어 목록에서 다른 사람 옆에 "예상 직업"을 메모해두기 위한 선택지 (순전히 개인 메모용, 서버로 전송 안 됨)
const ROLE_CATALOG = {
  "🗡️ 마피아팀": ["마피아", "스파이", "해커", "마담", "유괴범", "테러리스트", "마녀", "사기꾼", "대부", "히트맨"],
  "🌾 시민팀": ["시민", "경찰", "의사", "기자", "영매", "건달", "연인", "정치인", "탐정", "장의사", "판사", "군인", "공무원", "성직자", "경호원", "백수", "교사", "학생", "상담원", "피싱", "검시관", "교도관"],
  "😈 중립": ["악마 숭배자", "뱀파이어", "괴도", "늑대인간", "고양이", "용병"],
};

// 히트맨의 직업 추측 버튼용 - 서버 role key와 정확히 일치해야 한다 (표시는 한글 라벨로).
const HITMAN_GUESS_ROLES = {
  "🗡️ 마피아팀": [["mafia", "마피아"], ["spy", "스파이"], ["framer", "해커"], ["blocker", "마담"], ["silencer", "유괴범"], ["terrorist", "테러리스트"], ["witch", "마녀"], ["conartist", "사기꾼"], ["godfather", "대부"]],
  "🌾 시민팀": [["citizen", "시민"], ["police", "경찰"], ["doctor", "의사"], ["reporter", "기자"], ["medium", "영매"], ["soldier", "건달"], ["newlywed", "연인"], ["politician", "정치인"], ["detective", "탐정"], ["undertaker", "장의사"], ["judge", "판사"], ["veteran", "군인"], ["official", "공무원"], ["priest", "성직자"], ["bodyguard", "경호원"], ["unemployed", "백수"], ["teacher", "교사"], ["student", "학생"], ["counselor", "상담원"], ["idol", "피싱"], ["coroner", "검시관"], ["warden", "교도관"]],
  "😈 중립": [["cultist", "악마 숭배자"], ["vampire", "뱀파이어"], ["thief", "괴도"], ["werewolf", "늑대인간"], ["cat", "고양이"], ["mercenary", "용병"]],
};

const TEACHABLE_FORCED = [["police", "경찰"], ["doctor", "의사"]];
const TEACHABLE_SPECIAL = [
  ["reporter", "기자"], ["medium", "영매"], ["soldier", "건달"], ["politician", "정치인"],
  ["detective", "탐정"], ["veteran", "군인"], ["undertaker", "장의사"], ["judge", "판사"], ["official", "공무원"],
  ["priest", "성직자"], ["bodyguard", "경호원"],
];
const TEACHABLE_GENERAL = [["counselor", "상담원"]];
const TEACHABLE_ROLE_LABEL = Object.fromEntries([...TEACHABLE_FORCED, ...TEACHABLE_SPECIAL, ...TEACHABLE_GENERAL]);
const TEACHABLE_REQUIRED = Object.fromEntries([
  ...TEACHABLE_FORCED.map(([k]) => [k, 7]),
  ...TEACHABLE_SPECIAL.map(([k]) => [k, 5]),
  ...TEACHABLE_GENERAL.map(([k]) => [k, 3]),
]);

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
  avenger: "[피의 복수] 대상을 한 명 선택하세요. 나 대신 죽은 연인의 원수를 갚습니다. 게임당 단 한 번뿐이니 신중하게 사용하세요.",
  medium: "성불시킬 죽은 사람을 한 명 선택하세요. 정확한 직업을 알게 되고, 그 영혼은 더 이상 영매 채팅에서 말할 수 없습니다.",
  official: "행정조사할 대상을 한 명 선택하세요. 마피아팀인지 시민팀인지 알 수 있습니다. (조사를 피하는 마피아팀도 드러납니다)",
  veteran: "[민간군사] 사살할 대상을 한 명 선택하세요. 게임당 단 한 번뿐이고, 선택한 사람은 오늘 밤 목숨을 잃습니다.",
  thief: "보석을 훔칠 대상을 한 명 선택하세요. 이미 훔친 사람에게는 다시 훔칠 수 없습니다.",
  werewolf: "습격할 대상을 한 명 선택하세요. 마피아와 정확히 같은 대상을 노리면, 그 밤 마피아팀과 동맹하게 됩니다.",
  priest: "부활시킬 죽은 사람을 한 명 선택하세요. 게임당 단 한 번만 사용할 수 있고, 부활 사실은 모두에게 공개됩니다.",
  judge: "감옥에 간 사람 중 사면할 한 명을 선택하세요. 게임당 단 한 번만 사용할 수 있고, 사면 사실은 모두에게 공개됩니다.",
  mercenary: "죽일 대상을 한 명 선택하세요. 매일 밤 사용할 수 있습니다.",
  soldierPaired: "죽일 대상을 한 명 선택하세요. 용병과 짝을 이루면서 기존 협박 능력 대신 매일 밤 사용할 수 있습니다.",
  conartist: "위장할 대상을 한 명 선택하세요. 게임당 단 한 번뿐이고, 그 순간부터 그 사람의 직업으로 영구히 위장합니다. 실제 능력은 얻지 못하고 겉모습만 바뀝니다.",
  bodyguard: "경호할 대상을 한 명 선택하세요. 그 사람이 밤에 공격당하면 당신이 대신 목숨을 잃지만, 공격한 쪽도 함께 쓰러집니다.",
  godfather: "마피아팀으로 영입할 대상을 한 명 선택하세요. 게임당 단 한 번뿐입니다. 대상이 경찰이면 영입은 실패하고 당신의 정체가 그 경찰에게 발각됩니다.",
  cat: "집사로 삼을 사람을 한 명 선택하세요. 게임당 단 한 번뿐이고, 집사의 소속 팀에 그대로 편입됩니다. 정하지 않으면 승리할 수 없어요.",
  cat_detect: "이번 밤 무엇을 했는지 알아낼 사람을 한 명 선택하세요. 탐정과 동일한 방식으로 매일 밤 사용할 수 있습니다.",
  witch: "저주를 걸 대상을 한 명 선택하세요. 게임당 단 한 번만 사용할 수 있고, 저주에 걸린 사람은 3일 후 목숨을 잃습니다. 그 전에 마녀가 처형되면 저주는 풀립니다.",
  undertaker: "조사할 사망자를 한 명 선택하세요. 정확한 직업과 함께, 영혼을 빼앗겼는지·흡혈귀였는지도 알 수 있습니다.",
};

function alive(players) { return players.filter((p) => p.alive); }

// [바이러스]로 능력을 잃었거나 [현혹]으로 봉인된 사람에게는 능력 관련 UI를 전부 숨긴다.
function withoutAbilities(state) {
  if (!state.myAbilityDisabled) return state;
  return { ...state, myAbility: null, myHitmanAbility: null, myPowerUpgrade: null, myConartistLegendRole: null, myWiretapMessages: null, myFramerWiretapMessages: null, myPossess: null };
}
function AbilityDisabledNotice({ theme, state }) {
  if (!state.myAlive || !state.myAbilityDisabled) return null;
  return (
    <RedactedNotice theme={theme} text={state.myAbilityDisabled === "lost"
      ? "💻 바이러스에 감염되어 직업 능력을 영구히 잃었습니다. 채팅과 투표는 그대로 할 수 있어요."
      : "💋 마담에게 현혹되어 직업 능력이 봉인되었습니다. 마담이 죽으면 다시 쓸 수 있어요."} />
  );
}

// 7일차 능력 카드에 따라 밤 능력 설명이 바뀌는 경우를 반영한다.
const UPGRADE_ABILITY_LABELS = {
  police_hitman: "사살할 대상을 한 명 선택하세요. 선택한 사람은 오늘 밤 목숨을 잃습니다.",
  police_double: "첫 번째 조사 대상을 선택하세요. 아래에서 두 번째 대상도 고를 수 있습니다.",
  police_warrant: "조사할 대상을 한 명 선택하세요. 이미 조사한 적 있는 사람을 다시 조사하면 정확한 직업을 알 수 있습니다.",
  spy_assassin: "암살할 대상을 한 명 선택하세요. 선택한 사람은 오늘 밤 목숨을 잃습니다.",
  spy_seduce: "조사할 대상을 한 명 선택하세요. 그 사람은 유혹당해 이번 밤 능력을 쓸 수 없습니다. (어젯밤과 같은 사람은 불가)",
  spy_autopsy: "직업을 조사할 대상을 한 명 선택하세요. 이제 죽은 사람도 조사할 수 있습니다.",
  framer_virus: "바이러스를 심을 대상을 한 명 선택하세요. 30% 확률로 그 사람의 직업 능력이 영구히 사라집니다. (한 번 고른 사람은 다시 고를 수 없음)",
  framer_proxy: "우회 대상을 한 명 선택하세요. 오늘 밤 누군가 당신에게 쓴 능력은 전부 이 사람에게 대신 적용됩니다.",
  blocker_charm: "현혹할 대상을 한 명 선택하세요. 그 사람은 당신이 죽을 때까지 직업 능력이 봉인됩니다. (게임당 1회)",
  blocker_spy: "유혹할 대상을 한 명 선택하세요. 그 사람의 능력을 막고, 직업도 알아냅니다. (어젯밤과 같은 사람은 불가)",
  blocker_host: "유혹할 대상을 한 명 선택하세요. 그 사람의 능력을 막고, 내일 그 사람의 투표권을 빼앗아 당신의 표에 더합니다. (어젯밤과 같은 사람은 불가)",
  witch_high: "저주를 걸 대상을 한 명 선택하세요. 게임당 최대 3번까지 걸 수 있고, 저주에 걸린 사람은 3일 후 목숨을 잃습니다.",
  witch_mindcontrol: "정신을 지배할 대상을 한 명 선택하세요. 그 사람은 오늘 밤 능력도, 채팅도 쓸 수 없습니다.",
  doctor_checkup: "보호할 대상을 한 명 선택하세요. 보호한 사람의 직업도 함께 알게 됩니다.",
  doctor_divine: "보호할 대상을 한 명 선택하세요. 모든 방해를 무시하고 치료가 반드시 성공합니다.",
  godfather_deal: "마피아팀으로 영입할 대상을 한 명 선택하세요. [어둠의 거래] 능력으로 게임당 두 번까지 영입할 수 있습니다.",
  priest_saint: "[성녀] 오늘 밤 보호할 사람을 한 명 선택하세요. 죽음에 이르는 공격으로부터 지켜냅니다. (자기 자신은 불가)",
  detective_identity: "[신원 조사] 직업을 알아낼 대상을 한 명 선택하세요. 결과는 플레이어 목록에도 기재됩니다.",
  reporter_abuse: "직업을 공개할 대상을 한 명 선택하세요. [어뷰징]으로 특종을 두 번까지 쓸 수 있습니다.",
  soldier_boss: "협박할 대상을 한 명 선택하세요. 협박에 성공하면 내일 당신의 투표는 2표가 됩니다.",
  bodyguard_elite: "경호할 대상을 한 명 선택하세요. [엘리트 요원]이라 공격을 막아내도 당신은 죽지 않습니다. (자기 자신은 불가)",
  conartist_master: "위장할 대상을 한 명 선택하세요. [변장의 달인] 능력으로 밤마다 새로 위장할 수 있습니다.",
};
function abilityLabel(state) {
  const role = state.myAbility?.role;
  if (role === "soldier" && state.myPairedWithMercenary) return NIGHT_ABILITY_LABELS.soldierPaired;
  const up = state.myPowerUpgrade;
  if (up && up.startsWith(role + "_") && UPGRADE_ABILITY_LABELS[up]) return UPGRADE_ABILITY_LABELS[up];
  return NIGHT_ABILITY_LABELS[role];
}

// 7일차 능력으로 추가된 개인 결과들 (아침 화면 & 낮 고정 패널 공용)
function powerResultRows(state) {
  const rows = [];
  const police = (r, key) => r && rows.push({ key, icon: "🔍", text: r.roleLabel
    ? <>영장 조사 결과: <b>{r.targetName}</b>님의 정확한 직업은 [{r.roleLabel}] 입니다.</>
    : <>조사 결과 (경찰 전용): <b>{r.targetName}</b>님은 마피아 팀{r.isMafia ? "입니다." : "이 아닙니다."}</> });
  police(state.myPoliceResult, "police");
  police(state.myPoliceSecondResult, "police2");
  if (state.mySpyResult) {
    rows.push({ key: "spy", icon: state.mySpyResult.seduced ? "💋" : "🕵️", text: state.mySpyResult.seduced
      ? <><b>{state.mySpyResult.targetName}</b>님을 유혹해 이번 밤 능력을 쓰지 못하게 했습니다.</>
      : <>조사 결과 (스파이 전용): <b>{state.mySpyResult.targetName}</b>님의 직업은 [{state.mySpyResult.roleLabel}] 입니다.</> });
  }
  if (state.myDoctorResult) {
    rows.push({ key: "doctor", icon: "🩺", text: <>{state.myDoctorResult.saved ? "당신의 치료로 한 생명을 살렸습니다!" : "이번 밤은 당신의 보호가 필요하지 않았습니다."}
      {state.myDoctorResult.roleLabel && <> 검진 결과 — <b>{state.myDoctorResult.targetName}</b>님의 직업은 [{state.myDoctorResult.roleLabel}] 입니다.</>}</> });
  }
  const cl = state.myConartistLegendResult;
  if (cl) {
    const n = <b>{cl.targetName}</b>;
    const text = {
      police: <>경찰 조사: {n}님은 마피아 팀{cl.isMafia ? "입니다." : "이 아닙니다."}</>,
      spy: <>스파이 조사: {n}님의 직업은 [{cl.roleLabel}] 입니다.</>,
      undertaker: <>부검: {n}님의 직업은 [{cl.roleLabel}] 였습니다.{cl.wasSoulHarvested && " 영혼을 빼앗겼던 흔적이 있습니다."}{cl.wasThrall && " 흡혈귀였던 흔적이 있습니다."}</>,
      detective: <>추적: {n}님은 {cl.actedOnName ? <>{cl.actedOnName}님을 대상으로 능력을 사용했습니다.</> : "이번 밤 능력을 사용하지 않았습니다."}</>,
      doctor: <>보호: {n}님을 {cl.saved ? "공격으로부터 살려냈습니다!" : "지켰습니다."}</>,
      reporter: cl.failed ? <>특종: 같은 날 다른 특종에 밀려 {n}님의 기사가 실리지 못했습니다. (기회는 남아 있습니다)</> : <>특종: {n}님의 직업 [{cl.roleLabel}]을(를) 공개했습니다.</>,
      soldier: <>협박: {n}님은 오늘 투표를 할 수 없습니다.</>,
      silencer: <>납치: {n}님은 오늘 낮 채팅을 칠 수 없습니다.</>,
      framer: <>조작: {n}님의 기록을 조작했습니다.</>,
      blocker: <>유혹: {n}님의 능력을 막았습니다.</>,
      bodyguard: <>경호: {n}님을 경호했습니다.</>,
      priest: <>부활: {n}님을 되살렸습니다.</>,
      judge: <>사면: {n}님을 감옥에서 풀어주었습니다.</>,
      witch: cl.failed ? <>저주: {n}님에게는 저주가 통하지 않았습니다.</> : <>저주: {n}님에게 저주를 걸었습니다. 3일 후 발동합니다.</>,
      godfather: cl.success ? <>영입: {n}님을 마피아팀으로 끌어들였습니다.</> : cl.caught ? <>영입 실패: {n}님은 경찰이었고, 당신의 정체를 들켰습니다.</> : <>영입 실패: {n}님은 어느 팀에도 속하지 않은 [{cl.neutralRoleLabel}]입니다.</>,
      hitman: <>암살: {n}님 — {cl.correct ? "✅ 직업 적중" : "❌ 빗나감"}</>,
    }[cl.role];
    if (text) rows.push({ key: "conartistLegend", icon: "🎭", text: <>전설의 사기꾼 · {text}</> });
  }
  if (state.myVirusResult) {
    rows.push({ key: "virus", icon: "💻", text: <>바이러스: <b>{state.myVirusResult.targetName}</b>님 — {state.myVirusResult.success ? "✅ 감염 성공, 직업 능력이 영구히 사라졌습니다." : "❌ 감염에 실패했습니다."}</> });
  }
  if (state.myFramerProxyResult) {
    rows.push({ key: "proxy", icon: "🛰️", text: state.myFramerProxyResult.redirected > 0
      ? <>프록시: 당신에게 쓰인 능력 {state.myFramerProxyResult.redirected}건이 <b>{state.myFramerProxyResult.targetName}</b>님에게 우회되었습니다.</>
      : <>프록시: 지난밤 당신에게 쓰인 능력은 없었습니다.</> });
  }
  if (state.myBlockerCharmResult) {
    rows.push({ key: "charm", icon: "💋", text: <>현혹: <b>{state.myBlockerCharmResult.targetName}</b>님의 직업 능력을 봉인했습니다. 당신이 살아있는 한 풀리지 않습니다.</> });
  }
  if (state.myBlockerSpyResult) {
    rows.push({ key: "blockerSpy", icon: "💋", text: <>밀정: <b>{state.myBlockerSpyResult.targetName}</b>님의 직업은 [{state.myBlockerSpyResult.roleLabel}] 입니다.</> });
  }
  if (state.myBlockerHostResult) {
    rows.push({ key: "blockerHost", icon: "🥂", text: <>접대: 오늘 <b>{state.myBlockerHostResult.targetName}</b>님의 투표권을 빼앗아 당신의 표에 더했습니다.</> });
  }
  const pr = state.myPossessResult;
  if (pr) {
    const n = <b>{pr.targetName}</b>;
    const text = {
      police: <>경찰 조사: {n}님은 마피아 팀{pr.isMafia ? "입니다." : "이 아닙니다."}</>,
      detective: <>추적: {n}님은 {pr.actedOnName ? <>{pr.actedOnName}님을 대상으로 능력을 사용했습니다.</> : "이번 밤 능력을 사용하지 않았습니다."}</>,
      undertaker: <>부검: {n}님의 직업은 [{pr.roleLabel}] 였습니다.{pr.wasSoulHarvested && " 영혼을 빼앗겼던 흔적이 있습니다."}{pr.wasThrall && " 흡혈귀였던 흔적이 있습니다."}</>,
      reporter: pr.failed ? <>특종: 같은 날 다른 특종에 밀려 {n}님의 기사가 실리지 못했습니다. (기회는 남아 있습니다)</> : <>특종: {n}님의 직업 [{pr.roleLabel}]을(를) 공개했습니다.</>,
      soldier: <>협박: {n}님은 오늘 투표를 할 수 없습니다.</>,
      doctor: <>보호: {n}님을 {pr.saved ? "공격으로부터 살려냈습니다!" : "지켰습니다."}</>,
      bodyguard: <>경호: {n}님을 경호했습니다.</>,
      priest: <>부활: {n}님을 되살렸습니다.</>,
      judge: <>사면: {n}님을 감옥에서 풀어주었습니다.</>,
    }[pr.role];
    if (text) rows.push({ key: "possess", icon: "👻", text: <>빌린 능력 · {text}</> });
  }
  if (state.myMediumExorciseResult) {
    rows.push({ key: "exorcise", icon: "🕯️", text: <>성불: <b>{state.myMediumExorciseResult.targetName}</b>님의 직업은 [{state.myMediumExorciseResult.roleLabel}] 였습니다. 영혼이 편히 잠들었습니다.</> });
  }
  if (state.myOfficialAuditResult) {
    const t = state.myOfficialAuditResult.team;
    rows.push({ key: "audit", icon: "🗂️", text: <>행정조사: <b>{state.myOfficialAuditResult.targetName}</b>님은 {t === "mafia" ? "마피아팀" : t === "citizen" ? "시민팀" : "어느 팀에도 속하지 않은 사람"}입니다.</> });
  }
  if (state.myDetectiveDeduceResult) {
    const d = state.myDetectiveDeduceResult;
    rows.push({ key: "deduce", icon: "🧠", text: <>명추리: <b>{d.targetName}</b>님을 죽인 사람은 {d.killerName ? <><b>{d.killerName}</b>{d.suicide ? " (스스로 목숨을 잃음)" : ""}</> : "끝내 알아낼 수 없었습니다"}.</> });
  }
  if (state.mySoldierBossActive) {
    rows.push({ key: "soldierBoss", icon: "🎖️", text: <>골목대장: 협박에 성공해 오늘 당신의 투표는 2표로 계산됩니다.</> });
  }
  if (state.mySilencerBrainwashOutcome) {
    const o = state.mySilencerBrainwashOutcome;
    rows.push({ key: "brainwash", icon: "🧠", text: o.success ? <><b>{o.targetName}</b>님을 세뇌해 마피아팀으로 끌어들였습니다.</> : <><b>{o.targetName}</b>님은 세뇌에 넘어가지 않았습니다.</> });
  }
  return rows;
}

// 7일차 이후 추가된 공개 사망 소식 (저주 여러 개 동시 발동, 고대 주술, 방화, 그 밖에 따로 안내되지 않은 밤사이 사망)
function extraMorningEvents(state) {
  const ev = [];
  (state.extraCurseVictimNames || []).forEach((n) => ev.push({ key: "curse-" + n, icon: "💀", text: <><b>{n}</b>님이 마녀의 저주가 발동해 목숨을 잃었습니다</> }));
  if (state.ancientCurseVictimNames?.length) ev.push({ key: "ancient", icon: "🔮", text: <>고대 주술이 발동해 <b>{state.ancientCurseVictimNames.join(", ")}</b>님이 목숨을 잃었습니다</> });
  if (state.arsonVictimNames?.length) ev.push({ key: "arson", icon: "🔥", text: <>밤사이 큰 불이 나 <b>{state.arsonVictimNames.join(", ")}</b>님이 목숨을 잃었습니다</> });
  const arson = new Set(state.arsonVictimNames || []);
  (state.extraNightDeaths || []).filter((d) => !arson.has(d.name)).forEach((d) => ev.push({ key: "extra-" + d.id, icon: "☠️", text: <><b>{d.name}</b>님이 사망한 채로 발견되었습니다</> }));
  return ev;
}

function Collapsible({ theme, title, badge, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ marginBottom: 10, border: `1px solid ${theme.panelBorder}`, borderRadius: 3, background: "rgba(0,0,0,0.22)" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
        background: "transparent", border: "none", color: theme.text, cursor: "pointer", fontSize: 12.5, fontWeight: 700, textAlign: "left" }}>
        <span style={{ flex: 1 }}>{title}</span>
        {badge != null && <span style={{ fontSize: 11, color: theme.sub, fontWeight: 400 }}>{badge}</span>}
        <span style={{ color: theme.accent, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && <div style={{ padding: "0 10px 10px" }}>{children}</div>}
    </div>
  );
}

// 지난밤 소식이 의미 있는 낮 단계들 (밤이 시작되면 지난밤 기록은 초기화된다)
const NEWS_PHASES = ["discussion", "powerSelection", "vote", "defense", "finalvote", "judgetiebreak", "officialPick", "judgeverdict", "voteresult",
  "sheriffElection", "sheriffElectionVote", "sheriffDefense", "sheriffVerdict"];

function NightSummaryBanner({ theme, state, inSidebar }) {
  const { mode } = useGameLayout();
  // PC에서는 채팅 바로 옆 정보 열에 늘 떠 있으므로 가운데 화면에서는 그리지 않는다.
  if (mode === "desktop" && !inSidebar) return null;
  if (mode !== "mobile" || inSidebar) return <NightSummaryBannerBody theme={theme} state={state} />;
  const deaths = [state.lastNightDeath, state.hitmanKillVictimName, state.soloKillVictimName, state.werewolfVictimName, state.curseVictimName].filter(Boolean).length + extraMorningEvents(state).length;
  return (
    <Collapsible theme={theme} title="📌 지난밤 소식" badge={deaths > 0 ? `사건 ${deaths}건` : "펼쳐보기"}>
      <NightSummaryBannerBody theme={theme} state={state} />
    </Collapsible>
  );
}

/** 지난밤 공개 소식을 한 줄씩 나눈 목록 */
function nightNewsItems(state) {
  const items = [];
  const push = (key, icon, text) => items.push({ key, icon, text });
  const death = state.lastNightDeath ? state.players.find((p) => p.id === state.lastNightDeath) : null;
  const extra = extraMorningEvents(state);
  const hadOtherEvent = !!(state.werewolfVictimName || state.curseVictimName || state.vampireFightResult || state.avengerKillResult || state.priestReviveName || state.catAppearedName || state.bodyguardSaveResult || state.judgePardonResult || state.veteranSurvivedName || state.nightLordResult || extra.length > 0);
  if (state.nightLordResult) push("nightLord", "👑", <>밤의 지배자가 깨어나, 지난밤 마피아팀을 제외한 모든 능력이 무력화되었습니다</>);
  if (death) push("death", "☠️", <><b>{death.name}</b>님이 사망한 채로 발견되었습니다</>);
  else if (!hadOtherEvent && !state.nightSaveHappened) push("peace", "🌤️", "평화로운 밤이었습니다");
  if (state.veteranSurvivedName) push("veteran", "🪖", <><b>{state.veteranSurvivedName}</b>님이 공격에 맞서 싸워 살아남았습니다</>);
  if (state.nightSaveHappened) push("save", "🛡️", <><b>{state.nightSavedName || "누군가"}</b>님이 습격당했지만 {saveByText(state)} 목숨을 건졌습니다</>);
  if (state.hitmanKillVictimName && state.hitmanKillVictimId !== state.lastNightDeath) push("hitman", "☠️", <><b>{state.hitmanKillVictimName}</b>님이 사망한 채로 발견되었습니다</>);
  if (state.soloKillVictimName && state.soloKillVictimId !== state.lastNightDeath && state.soloKillVictimId !== state.hitmanKillVictimId) push("solo", "☠️", <><b>{state.soloKillVictimName}</b>님이 사망한 채로 발견되었습니다</>);
  if (state.vampireFightResult) {
    push("vf1", "☠️", <><b>{state.vampireFightResult.vampireName}</b>님이 사망한 채로 발견되었습니다</>);
    push("vf2", "☠️", <><b>{state.vampireFightResult.mafiaName}</b>님이 사망한 채로 발견되었습니다</>);
  }
  if (state.avengerKillResult) push("avenger", "🩸", <><b>{state.avengerKillResult.targetName}</b>님이 피의 복수에 쓰러졌습니다</>);
  if (state.werewolfVictimName) push("wolf", "🐺", <><b>{state.werewolfVictimName}</b>님이 늑대인간에게 습격당해 목숨을 잃었습니다</>);
  if (state.priestReviveName) push("priest", "🕊️", <><b>{state.priestReviveName}</b>님이 성직자에 의해 부활했습니다</>);
  if (state.judgePardonResult) push("judge", "⚖️", <><b>{state.judgePardonResult.name}</b>님이 판사에 의해 사면되어 감옥에서 풀려났습니다</>);
  if (state.bodyguardSaveResult) push("bodyguard", "🛡️", <><b>{state.bodyguardSaveResult.bodyguardName}</b>님이 <b>{state.bodyguardSaveResult.targetName}</b>님을 지키다 목숨을 잃었습니다{state.bodyguardSaveResult.attackerName ? <>, <b>{state.bodyguardSaveResult.attackerName}</b>님도 함께 쓰러졌습니다</> : ""}</>);
  if (state.bodyguardLastWord) push("lastword", "📜", <>경호원 <b>{state.bodyguardLastWord.bodyguardName}</b>님의 결정적 유언 — 범인은 <b>{state.bodyguardLastWord.killerName}</b>님입니다</>);
  if (state.catAppearedName) push("cat", "🐱", <>어느새 고양이 한 마리(<b>{state.catAppearedName}</b>)가 마을에 들어와 있었습니다</>);
  if (state.reporterReveal) push("news", "📰", <><b>{state.reporterReveal.name}</b>님의 직업이 <b>[{state.reporterReveal.roleLabel}]</b>(으)로 공개되었습니다</>);
  if (state.curseCastName) push("curseCast", "🔮", <><b>{state.curseCastName}</b>님이 마녀의 저주를 받았습니다 (3일 후 발동)</>);
  if (state.curseVictimName) push("curse", "💀", <><b>{state.curseVictimName}</b>님이 마녀의 저주가 발동해 목숨을 잃었습니다</>);
  extra.forEach((e) => push(e.key, e.icon, e.text));
  if (state.dictatorResult) push("dictator", "🎩", <>정치인 <b>{state.dictatorResult.name}</b>님이 독재를 선포하고 보안관 자리를 차지했습니다</>);
  if (state.sheriffJustJailedName) push("jailed", "🚨", <>무고한 처형으로 <b>{state.sheriffJustJailedName}</b>님이 보안관 직위를 박탈당하고 감옥에 수감되었습니다</>);
  else if (state.sheriffExecutionResult) push("sheriffExec", state.sheriffExecutionResult.byPriest ? "✝️" : "⭐", <><b>{state.sheriffExecutionResult.targetName}</b>님이 {state.sheriffExecutionResult.byPriest ? "이단심판으로" : "보안관에 의해"} 처형되었습니다 — {state.sheriffExecutionResult.wasMafia ? "마피아팀이었습니다" : "마피아팀이 아니었습니다"}</>);
  if (state.terroristBombVictimName) push("bomb", "💣", <>테러리스트의 자폭으로 <b>{state.terroristBombVictimName}</b>님이 함께 목숨을 잃었습니다</>);
  return items;
}

/** 밤사이 누군가를 살린 보호의 출처 문구 */
function saveByText(state) {
  return state.nightSaveBy === "saint" ? "성녀의 가호로" : state.nightSaveBy === "bodyguard" ? "경호원의 경호로" : "의사의 보호로";
}

function NightSummaryBannerBody({ theme, state }) {
  return <NewsCarousel theme={theme} items={nightNewsItems(state)} />;
}

/** 좌우로 넘기는 소식 카드 - 한 번에 하나만, 버튼이나 스와이프로 다음 소식 */
function NewsCarousel({ theme, items, title = "📌 지난밤 소식" }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const count = items.length;
  const safe = count ? Math.min(index, count - 1) : 0;
  useEffect(() => { setIndex(0); }, [count]);
  const go = (d) => { if (count < 2) return; setDir(d); setIndex((i) => (Math.min(i, count - 1) + d + count) % count); };
  const swipe = useSwipe(() => go(-1), () => go(1));
  if (!count) return null;
  const item = items[safe];
  const arrow = (d) => (
    <button onClick={() => go(d)} disabled={count < 2} aria-label={d < 0 ? "이전 소식" : "다음 소식"}
      style={{ flexShrink: 0, width: 30, alignSelf: "stretch", border: "none", borderRadius: 2, cursor: count > 1 ? "pointer" : "default",
        background: "rgba(0,0,0,0.35)", color: theme.accent, fontSize: 14, opacity: count > 1 ? 1 : 0.25 }}>
      {d < 0 ? "◀" : "▶"}
    </button>
  );
  return (
    <div style={{ borderRadius: 3, background: theme.accentSoft, border: `1px solid ${theme.panelBorder}`, marginBottom: 10, padding: 6, flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 4px" }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: theme.sub, letterSpacing: 1 }}>{title}</span>
        <span style={{ fontSize: 10.5, color: theme.sub, fontFamily: "'Courier Prime', monospace" }}>{safe + 1} / {count}</span>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
        {arrow(-1)}
        <div {...swipe} style={{ flex: 1, minWidth: 0, minHeight: 52, overflow: "hidden", touchAction: "pan-y", display: "flex", alignItems: "center" }}>
          <div key={item.key + safe} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: theme.text, lineHeight: 1.45,
            animation: `${dir > 0 ? "noirSlideL" : "noirSlideR"} 0.22s ease-out` }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        </div>
        {arrow(1)}
      </div>
      {count > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 5 }}>
          {items.map((it, k) => (
            <span key={it.key + k} onClick={() => { setDir(k > safe ? 1 : -1); setIndex(k); }}
              style={{ width: k === safe ? 14 : 6, height: 6, borderRadius: 3, cursor: "pointer", transition: "width 0.2s", background: k === safe ? theme.accent : "rgba(255,255,255,0.2)" }} />
          ))}
        </div>
      )}
    </div>
  );
}

/** 터치로 좌우로 밀었는지 감지한다 (세로 스크롤은 방해하지 않음) */
function useSwipe(onPrev, onNext) {
  const start = useRef(null);
  return {
    onTouchStart: (e) => { const t = e.touches[0]; start.current = { x: t.clientX, y: t.clientY }; },
    onTouchEnd: (e) => {
      if (!start.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.current.x, dy = t.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) (dx < 0 ? onNext : onPrev)();
    },
  };
}

function RevealView({ theme, state, socket }) {
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="reveal" label="직업 확인" />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ color: theme.sub, fontSize: 12.5, margin: "10px 0 16px" }}>
        {state.revealAckCount} / {state.revealTotal}명 확인 완료 · 시간이 지나면 자동으로 밤이 시작돼요. 다른 사람에게 화면을 보여주지 마세요.
      </p>
      <div style={{ borderRadius: 5, padding: "26px 20px", textAlign: "center", background: theme.accentSoft, marginBottom: 16 }}>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 26, fontWeight: 700, color: theme.text, margin: "6px 0" }}>{state.myRoleLabel || "관전 중"}</div>
        <div style={{ fontSize: 13, color: theme.sub, lineHeight: 1.6 }}>{state.myRoleDesc || "이번 게임의 플레이어로 참여하지 않으셨습니다."}</div>
        {(state.teammates?.length || 0) > 0 && <div style={{ marginTop: 14, fontSize: 12.5, color: theme.accent }}>같은 팀: {state.teammates.map((t) => t.name).join(", ")}</div>}
        {state.partnerName && <div style={{ marginTop: 14, fontSize: 12.5, color: theme.accent }}>나의 연인: {state.partnerName}</div>}
      </div>
      {state.myRoleLabel && (
        <Button theme={theme} disabled={state.iHaveRevealAcked} onClick={() => socket.emit("game_action", { type: "REVEAL_ACK" })}>
          {state.iHaveRevealAcked ? "다른 사람을 기다리는 중..." : "확인했어요 →"}
        </Button>
      )}
    </Card>
  );
}

function PhishingPanel({ theme, state, socket }) {
  const [text, setText] = useState("");
  const submit = () => {
    if (text.trim()) {
      socket.emit("game_action", { type: "PHISHING_SEND", text: text.trim() });
      setText("");
    }
  };
  return (
    <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(120,170,232,0.12)", border: "1px solid rgba(120,170,232,0.35)", marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>📧 스팸 문자 보내기</div>
      <p style={{ fontSize: 11, color: theme.sub, margin: "0 0 8px" }}>
        입력하면 모두에게 발신자 없이 고정 공지로 표시됩니다. 새로 보내면 이전 문자는 사라져요.
      </p>
      {state.idolMessage && (
        <div style={{ fontSize: 11.5, color: theme.sub, marginBottom: 8 }}>
          현재 발송된 문자: <b style={{ color: theme.text }}>{state.idolMessage.text}</b>
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="스팸 문자 내용 입력..."
          onKeyDown={(e) => e.key === "Enter" && submit()} maxLength={120}
          style={{ flex: 1, padding: "7px 10px", borderRadius: 8, border: `1px solid ${theme.panelBorder}`,
            background: "rgba(255,255,255,0.04)", color: theme.text, fontSize: 12.5, outline: "none" }} />
        <Button theme={theme} onClick={submit} style={{ padding: "7px 14px", fontSize: 12.5 }}>발송</Button>
      </div>
    </div>
  );
}

const HITMAN_ROLE_LABEL_BY_KEY = Object.fromEntries(Object.values(HITMAN_GUESS_ROLES).flat());

function HitmanPickerModal({ theme, title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 380, maxHeight: "76vh", background: theme.bg, borderRadius: 5,
          border: `1px solid ${theme.panelBorder}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${theme.panelBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{title}</div>
          <button onClick={onClose}
            style={{ background: "transparent", border: "none", color: theme.sub, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>
            ✕
          </button>
        </div>
        <div style={{ padding: "12px 16px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function HitmanPanel({ theme, state, socket }) {
  const serverTargetId = state.myHitmanAbility?.selectedTargetId || null;
  const serverGuessedRole = state.myHitmanAbility?.selectedGuessedRole || null;
  const [selectedTarget, setSelectedTarget] = useState(serverTargetId);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const targets = alive(state.players).filter((p) => p.id !== state.myId);

  const targetName = targets.find((p) => p.id === selectedTarget)?.name || null;
  const currentGuessLabel = selectedTarget && selectedTarget === serverTargetId && serverGuessedRole
    ? HITMAN_ROLE_LABEL_BY_KEY[serverGuessedRole] : null;

  const pickTarget = (id) => { setSelectedTarget(id); setShowTargetModal(false); };
  const pickRole = (roleKey) => {
    if (!selectedTarget) return;
    socket.emit("game_action", { type: "SET_HITMAN_TARGET", targetId: selectedTarget, guessedRole: roleKey });
    setShowRoleModal(false);
  };

  return (
    <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(232,120,120,0.1)", border: "1px solid rgba(232,120,120,0.35)", marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>🎯 암살 대상 지목</div>
      <p style={{ fontSize: 11, color: theme.sub, margin: "0 0 8px" }}>
        대상과 그 사람의 직업을 함께 골라야 합니다. 정확히 맞히면 암살에 성공하고, 틀리면 아무 일도 일어나지 않습니다.
      </p>
      {state.myHitmanResult && (
        <div style={{ fontSize: 11.5, color: state.myHitmanResult.correct ? theme.accent : theme.sub, marginBottom: 10 }}>
          지난밤 결과 — <b>{state.myHitmanResult.targetName}</b>님 저격: {state.myHitmanResult.correct ? "✅ 성공" : "❌ 실패"}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setShowTargetModal(true)}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 4, cursor: "pointer", textAlign: "left",
            border: `1px solid ${selectedTarget ? theme.accent : theme.panelBorder}`,
            background: selectedTarget ? theme.accentSoft : "transparent", color: theme.text }}>
          <div style={{ fontSize: 10, color: theme.sub, marginBottom: 2 }}>대상</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{targetName || "선택하기"}</div>
        </button>
        <button onClick={() => selectedTarget && setShowRoleModal(true)} disabled={!selectedTarget}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 4, cursor: selectedTarget ? "pointer" : "default", textAlign: "left",
            border: `1px solid ${currentGuessLabel ? theme.accent : theme.panelBorder}`,
            background: currentGuessLabel ? theme.accentSoft : "transparent", color: selectedTarget ? theme.text : theme.sub, opacity: selectedTarget ? 1 : 0.5 }}>
          <div style={{ fontSize: 10, color: theme.sub, marginBottom: 2 }}>추측 직업</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{currentGuessLabel || "선택하기"}</div>
        </button>
      </div>

      {showTargetModal && (
        <HitmanPickerModal theme={theme} title="🎯 대상 선택" onClose={() => setShowTargetModal(false)}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {targets.map((p) => (
              <Chip key={p.id} theme={theme} label={p.name} selected={selectedTarget === p.id} onClick={() => pickTarget(p.id)} />
            ))}
          </div>
        </HitmanPickerModal>
      )}

      {showRoleModal && selectedTarget && (
        <HitmanPickerModal theme={theme} title={`🔍 ${targetName}님의 직업은?`} onClose={() => setShowRoleModal(false)}>
          {Object.entries(HITMAN_GUESS_ROLES).map(([group, roles]) => (
            <div key={group} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: theme.sub, marginBottom: 4 }}>{group}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {roles.map(([key, label]) => (
                  <Chip key={key} theme={theme} label={label}
                    selected={selectedTarget === serverTargetId && serverGuessedRole === key}
                    onClick={() => pickRole(key)} />
                ))}
              </div>
            </div>
          ))}
        </HitmanPickerModal>
      )}
    </div>
  );
}

// [전설의 사기꾼] - 위장한 직업의 능력을 그대로 빌려 쓰는 패널 (중립·일반직업·연인 제외)
const LEGEND_ROLE_TEXT = {
  police: "마피아 팀인지 조사할 대상을 고르세요.",
  spy: "직업을 조사할 대상을 고르세요.",
  undertaker: "직업을 조사할 죽은 사람을 고르세요.",
  doctor: "오늘 밤 보호할 대상을 고르세요. 자기 자신도 고를 수 있습니다.",
  reporter: "직업을 모두에게 공개할 대상을 고르세요. (게임당 1회)",
  soldier: "협박할 대상을 고르세요. 그 사람은 내일 투표를 할 수 없습니다.",
  detective: "이번 밤 누구에게 능력을 썼는지 추적할 대상을 고르세요.",
  priest: "부활시킬 죽은 사람을 고르세요. (게임당 1회)",
  judge: "감옥에서 사면할 사람을 고르세요. (게임당 1회) 또한 진짜 판사가 없으면 낮 처형 여부를 당신이 결정합니다.",
  bodyguard: "경호할 대상을 고르세요. 공격받으면 당신이 대신 목숨을 잃습니다.",
  mafia: "마피아의 습격 투표에 한 표를 보탭니다.",
  framer: "조작할 대상을 고르세요. 이번 밤 조사를 받으면 마피아로 보입니다.",
  blocker: "유혹할 대상을 고르세요. 그 사람은 이번 밤 능력을 쓸 수 없습니다.",
  silencer: "납치할 대상을 고르세요. 그 사람은 내일 낮 채팅을 칠 수 없습니다.",
  witch: "저주를 걸 대상을 고르세요. 3일 후 목숨을 잃습니다. (게임당 1회, 당신이 죽으면 풀립니다)",
  godfather: "마피아팀으로 영입할 대상을 고르세요. (게임당 1회, 경찰을 고르면 정체가 들킵니다)",
  hitman: "암살할 대상을 고르고 직업을 맞히세요. 맞히면 그 사람은 목숨을 잃습니다.",
};
const LEGEND_PASSIVE_TEXT = {
  medium: "영매로 위장해 죽은 사람들과 대화할 수 있습니다. 아래 영매 채팅을 이용하세요.",
  politician: "정치인으로 위장해 투표로 처형되지 않고, 투표할 때 표를 두 번 행사합니다.",
  veteran: "군인으로 위장해 공격을 한 번 막아낼 수 있습니다. 따로 고를 필요 없이 자동으로 발동합니다.",
  official: "공무원으로 위장해 어제 낮 투표 기록을 화면 아래에서 열람할 수 있습니다.",
  terrorist: "테러리스트로 위장해, 투표로 처형되면 마피아팀이 아닌 무작위 한 명과 함께 자폭합니다.",
};
const LEGEND_ONCE = ["reporter", "witch", "priest", "judge", "godfather"];

function LegendConartistPanel({ theme, state, socket }) {
  const role = state.myConartistLegendRole;
  const header = <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🎭 전설의 사기꾼{role ? ` — [${state.myDisguisedAs}] 능력` : ""}</div>;
  const wrap = (children) => (
    <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(184,76,92,0.12)", border: "1px solid rgba(184,76,92,0.4)", marginBottom: 14 }}>{header}{children}</div>
  );
  if (!role) {
    return wrap(<RedactedNotice theme={theme} text={state.myDisguisedAs
      ? `지금 위장한 직업 [${state.myDisguisedAs}]의 능력은 빌려 쓸 수 없습니다. (중립·일반직업·연인 제외)`
      : "먼저 위장을 해야 그 직업의 능력을 쓸 수 있습니다."} />);
  }
  if (LEGEND_PASSIVE_TEXT[role]) {
    const vetUsed = role === "veteran" && state.myUsedDefense;
    return wrap(<RedactedNotice theme={theme} text={vetUsed ? "이미 방어 능력을 사용했습니다." : LEGEND_PASSIVE_TEXT[role]} />);
  }
  if (LEGEND_ONCE.includes(role) && state.myConartistLegendOnceUsed?.[role]) {
    return wrap(<RedactedNotice theme={theme} text={`이미 [${state.myDisguisedAs}] 능력을 사용했습니다. 게임당 한 번뿐이에요.`} />);
  }
  const targets = role === "undertaker" || role === "priest"
    ? state.players.filter((p) => !p.alive)
    : role === "judge"
    ? state.players.filter((p) => p.inJail)
    : alive(state.players).filter((p) => !p.inJail && (p.id !== state.myId || role === "doctor"));
  const pickHitman = (p) => {
    const guess = window.prompt(`${p.name}님의 예상 직업을 정확히 입력하세요 (예: 시민, 마피아, 경찰 등)`);
    if (!guess) return;
    const roleKey = Object.keys(HITMAN_ROLE_LABEL_BY_KEY).find((k) => HITMAN_ROLE_LABEL_BY_KEY[k] === guess.trim());
    if (!roleKey) { alert("정확한 직업명을 입력해주세요."); return; }
    socket.emit("game_action", { type: "SET_NIGHT_TARGET", role, targetId: p.id, guessedRole: roleKey });
  };
  return wrap(
    <>
      <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>{LEGEND_ROLE_TEXT[role]}</p>
      {targets.length === 0 ? (
        <RedactedNotice theme={theme} text="지금은 고를 수 있는 대상이 없습니다." />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {targets.map((p) => (
            <Chip key={p.id} theme={theme}
              label={role === "hitman" && state.myConartistLegendTarget === p.id && state.myConartistLegendGuess ? `${p.name} (${HITMAN_ROLE_LABEL_BY_KEY[state.myConartistLegendGuess] || "?"})` : p.name}
              selected={state.myConartistLegendTarget === p.id}
              onClick={() => role === "hitman" ? pickHitman(p) : socket.emit("game_action", { type: "SET_NIGHT_TARGET", role, targetId: p.id })} />
          ))}
        </div>
      )}
    </>
  );
}

const POSSESS_TARGET_RULE = { undertaker: "dead", priest: "dead", judge: "jail" };
const POSSESS_HINT = {
  police: "조사할 대상", doctor: "보호할 대상 (자신 포함)", reporter: "특종으로 직업을 공개할 대상", soldier: "협박해 투표를 막을 대상",
  detective: "행동을 추적할 대상", undertaker: "조사할 사망자", judge: "사면할 수감자", priest: "부활시킬 사망자", bodyguard: "경호할 대상",
};
/** [빙의]·[유품수거] - 죽은 사람을 골라 능력을 빌리고, 원하는 밤에 한 번 사용한다 */
function PossessPanel({ theme, state, socket }) {
  const ps = state.myPossess;
  const isMedium = state.myRole === "medium";
  const name = isMedium ? "빙의" : "유품수거";
  const box = (children) => (
    <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(120,140,200,0.12)", border: "1px solid rgba(140,150,220,0.4)", marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>{isMedium ? "👻" : "⚰️"} {name}</div>
      {children}
    </div>
  );
  if (ps.used) return box(<RedactedNotice theme={theme} text={`${ps.fromName}님에게서 빌린 [${ps.roleLabel}] 능력을 이미 사용했습니다.`} />);
  if (ps.failed) return box(<RedactedNotice theme={theme} text={`${ps.fromName}님에게서는 빌릴 수 있는 능력이 없었습니다. (밤에 발동하는 시민팀 필수·특수직업만 가능)`} />);
  if (!ps.picked) {
    const dead = state.players.filter((p) => !p.alive);
    return box(<>
      <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>게임당 한 번, 죽은 사람을 골라 그 직업의 능력을 빌려둡니다. 빌린 능력은 원하는 밤에 한 번 쓸 수 있어요. (밤에 발동하는 시민팀 필수·특수직업의 기본 능력만 빌릴 수 있고, 아니면 기회만 사라집니다)</p>
      {dead.length === 0 ? <RedactedNotice theme={theme} text="아직 죽은 사람이 없습니다." /> : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {dead.map((p) => (
            <Chip key={p.id} theme={theme} label={p.name}
              onClick={() => { if (window.confirm(`${p.name}님에게 ${name}할까요? 게임당 단 한 번뿐입니다.`)) socket.emit("game_action", { type: "POSSESS_PICK", targetId: p.id }); }} />
          ))}
        </div>
      )}
    </>);
  }
  const rule = POSSESS_TARGET_RULE[ps.role];
  const cands = state.players.filter((p) => rule === "dead" ? !p.alive : rule === "jail" ? p.inJail : p.alive && !p.inJail && (p.id !== state.myId || ps.role === "doctor"));
  return box(<>
    <p style={{ fontSize: 11.5, color: theme.text, margin: "0 0 4px" }}><b>{ps.fromName}</b>님의 <b>[{ps.roleLabel}]</b> 능력을 빌려두었습니다.</p>
    <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>{POSSESS_HINT[ps.role]}을 고르면 오늘 밤이 끝날 때 한 번 발동하고 사라집니다. 고르지 않으면 다음 밤으로 미뤄집니다.</p>
    {cands.length === 0 ? <RedactedNotice theme={theme} text="지금은 이 능력을 쓸 대상이 없습니다." /> : (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {cands.map((p) => (
          <Chip key={p.id} theme={theme} label={p.name} selected={ps.selectedTargetId === p.id}
            onClick={() => socket.emit("game_action", { type: "POSSESS_USE", targetId: ps.selectedTargetId === p.id ? null : p.id })} />
        ))}
      </div>
    )}
  </>);
}

function NightView({ theme, state: rawState, socket }) {
  const state = withoutAbilities(rawState);
  const spyAutopsy = state.myAbility?.role === "spy" && state.myPowerUpgrade === "spy_autopsy";
  const priestSaint = state.myAbility?.role === "priest" && state.myPowerUpgrade === "priest_saint";
  const targets = state.myAbility?.role === "medium"
    ? state.players.filter((p) => !p.alive && !(state.myExorcisedIds || []).includes(p.id))
    : (state.myAbility?.role === "undertaker" || (state.myAbility?.role === "priest" && !priestSaint))
    ? state.players.filter((p) => !p.alive)
    : spyAutopsy
    ? state.players.filter((p) => p.id !== state.myId && !(p.alive && p.inJail) && !state.teammates.some((t) => t.id === p.id))
    : state.myAbility?.role === "judge"
    ? state.players.filter((p) => p.inJail)
    : alive(state.players).filter((p) => {
        if (!state.myAbility) return false;
        if (p.id === state.myId) return state.myAbility.role === "doctor";
        if (state.myAbility.role === "priest" && state.myPowerUpgrade === "priest_saint" && p.inJail) return false;
        // 마피아는 전략적으로 같은 팀원도 제거 대상으로 고를 수 있다 (배신 플레이 등). 스파이는 여전히 팀원은 조사 대상에서 제외.
        if (p.inJail) return false;
        if (state.myAbility.role === "spy") {
          if (p.id === state.spySeducePrevTarget) return false;
          return !state.teammates.some((t) => t.id === p.id);
        }
        if (state.myAbility.role === "godfather") {
          return !state.teammates.some((t) => t.id === p.id);
        }
        if (state.myAbility.role === "blocker" && p.id === state.myBlockerPrevTarget && state.myPowerUpgrade !== "blocker_charm") return false;
        if (state.myAbility.role === "framer" && state.myPowerUpgrade === "framer_virus" && (state.myFramerVirusTriedIds || []).includes(p.id)) return false;
        if (state.myAbility.role === "silencer" && p.id === state.mySilencerPrevTarget) return false;
        if (state.myAbility.role === "thief" && state.myStolenFrom?.[p.id]) return false;
        return true;
      });
  const blockerRepeatBlocked = state.myAbility?.role === "blocker" && state.myBlockerPrevTarget && state.myPowerUpgrade !== "blocker_charm"
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
      <div style={{ background: theme.accentSoft, borderRadius: 4, padding: "10px 14px", fontSize: 13, color: theme.text, margin: "14px 0 16px", textAlign: "center" }}>
        🌙 밤이 되었습니다. 직업이 있는 플레이어는 능력을 사용해주세요.
      </div>

      <AbilityDisabledNotice theme={theme} state={rawState} />
      {state.myAlive && state.myMindControlledTonight && (
        <div style={{ fontSize: 12.5, color: "#C9AEE0", background: "rgba(123,94,167,0.18)", border: "1px solid rgba(123,94,167,0.45)", borderRadius: 2, padding: "9px 12px", marginBottom: 12 }}>
          🔮 마녀에게 정신을 지배당했습니다. 오늘 밤은 어떤 채팅방에서도 채팅을 칠 수 없고, 능력도 발동하지 않습니다.
        </div>
      )}
      {!state.myAlive && (
        <p style={{ fontSize: 13, color: theme.sub, marginBottom: 6 }}>이미 사망하셨습니다. 아래 채팅으로 영매·다른 사망자와 대화를 나눠보세요.</p>
      )}

      {state.myAlive && (state.myRole === "veteran" || state.myPowerUpgrade === "soldier_grit") && (
        <RedactedNotice theme={theme}
          text={state.myDefenseLeft > 0 ? `밤에 죽음에 이르는 공격을 앞으로 ${state.myDefenseLeft}번 자동으로 버텨낼 수 있습니다 — 따로 지목할 필요 없이 공격받으면 자동 발동됩니다.` : "이미 방어 능력을 모두 사용했습니다. 더 이상 공격을 버텨낼 수 없어요."} />
      )}
      {state.myAlive && state.myRole === "godfather" && state.myPowerUpgrade === "godfather_nightlord" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(120,20,40,0.18)", border: "1px solid rgba(168,50,63,0.5)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>👑 밤의 지배자 (게임당 1회)</div>
          {state.myNightLordTonight ? (
            <RedactedNotice theme={theme} text="밤의 지배자가 깨어났습니다. 오늘 밤 마피아팀을 제외한 모든 능력이 무효가 됩니다." />
          ) : state.myNightLordUsed ? (
            <RedactedNotice theme={theme} text="이미 밤의 지배자를 발동했습니다." />
          ) : (
            <>
              <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>발동하면 오늘 밤 마피아팀이 아닌 모든 플레이어가 쓴 직업 능력이 전부 무효화됩니다. 아침에 모두에게 알려집니다.</p>
              <button onClick={() => { if (window.confirm("밤의 지배자를 발동할까요? 게임당 단 한 번만 쓸 수 있습니다.")) socket.emit("game_action", { type: "GODFATHER_NIGHTLORD" }); }}
                style={{ width: "100%", padding: "10px 0", borderRadius: 4, border: "1px solid #A8323F", background: "rgba(168,50,63,0.22)", color: "#F0B4BC", fontWeight: 700, cursor: "pointer" }}>
                👑 오늘 밤을 지배하기
              </button>
            </>
          )}
        </div>
      )}
      {state.myAlive && state.myPossess && <PossessPanel theme={theme} state={state} socket={socket} />}

      {state.myAbility && state.myAlive && state.myAbility.role === "vampire" && !vampireEligibleNight && (
        <RedactedNotice theme={theme} text="뱀파이어의 능력은 1일차를 제외한 홀수일차 밤에만 사용할 수 있습니다." />
      )}

      {state.myAbility && state.myAlive && state.myAbility.role === "witch" && state.myWitchUsed && (
        <RedactedNotice theme={theme} text={state.myPowerUpgrade === "witch_high" ? "저주 능력을 모두(3번) 사용했습니다. 더 이상 사용할 수 없어요." : "이미 저주 능력을 사용했습니다. 게임당 한 번뿐이라 더 이상 사용할 수 없어요."} />
      )}

      {state.myAbility && state.myAlive && state.myAbility.role === "priest" && state.myPriestUsed && !priestSaint && (
        <RedactedNotice theme={theme} text="이미 부활 능력을 사용했습니다. 게임당 한 번뿐이라 더 이상 사용할 수 없어요." />
      )}

      {state.myAbility && state.myAlive && state.myAbility.role === "conartist" && state.myConartistUsed && state.myPowerUpgrade !== "conartist_master" && (
        <RedactedNotice theme={theme} text="이미 위장 능력을 사용했습니다. 게임당 한 번뿐이라 더 이상 사용할 수 없어요." />
      )}

      {state.myAbility && state.myAlive && state.myAbility.role === "godfather" && state.myGodfatherUsed && (
        <RedactedNotice theme={theme} text={state.myPowerUpgrade === "godfather_deal" ? "영입 능력을 모두(2번) 사용했습니다. 더 이상 사용할 수 없어요." : "이미 영입 능력을 사용했습니다. 게임당 한 번뿐이라 더 이상 사용할 수 없어요."} />
      )}

      {state.myAbility && state.myAlive && state.myAbility.role === "reporter" && state.myReporterUsed && (
        <RedactedNotice theme={theme} text="특종을 모두 사용했습니다. 더 이상 사용할 수 없어요." />
      )}

      {state.myAbility && state.myAlive && state.myAbility.role === "judge" && state.myJudgePardonUsed && (
        <RedactedNotice theme={theme} text="이미 사면 능력을 사용했습니다. 게임당 한 번뿐이라 더 이상 사용할 수 없어요." />
      )}

      {state.myAbility && state.myAlive
        && (state.myAbility.role !== "vampire" || vampireEligibleNight)
        && (state.myAbility.role !== "witch" || !state.myWitchUsed)
        && (state.myAbility.role !== "priest" || !state.myPriestUsed || priestSaint)
        && (state.myAbility.role !== "reporter" || !state.myReporterUsed)
        && (state.myAbility.role !== "conartist" || !state.myConartistUsed || state.myPowerUpgrade === "conartist_master")
        && (state.myAbility.role !== "godfather" || !state.myGodfatherUsed)
        && (state.myAbility.role !== "judge" || !state.myJudgePardonUsed) && (
        <div style={{ marginBottom: 16 }}>
          {state.myAbility.role === "medium" && targets.length === 0 && (
            <RedactedNotice theme={theme} text="성불시킬 수 있는 죽은 사람이 없습니다." />
          )}
          {state.myAbility.role === "reporter" && targets.length === 0 && (
            <RedactedNotice theme={theme} text="기자의 능력은 2일차 밤부터, 단 한 번만 사용할 수 있습니다." />
          )}
          {state.myAbility.role === "undertaker" && targets.length === 0 && (
            <RedactedNotice theme={theme} text="아직 죽은 사람이 없어서 조사할 대상이 없습니다." />
          )}
          {state.myAbility.role === "judge" && targets.length === 0 && (
            <RedactedNotice theme={theme} text="아직 감옥에 간 사람이 없어서 사면할 대상이 없습니다." />
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
            {state.myRoleLabel} 능력 — {abilityLabel(state)}
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

      {!state.myAbility && state.myAlive && !state.myAbilityDisabled && !["lover", "newlywed", "medium", "veteran", "vampire", "cat", "teacher", "student", "counselor", "idol", "hitman", "coroner"].includes(state.myRole) && !state.myIsThrall
        && !["silencer_trafficking", "silencer_brainwash", "terrorist_arson", "doctor_hospitalize", "witch_ancient", "conartist_legend"].includes(state.myPowerUpgrade) && (
        <p style={{ fontSize: 13, color: theme.sub }}>이번 밤에 사용할 수 있는 능력이 없습니다. 마을이 무사하길 기다려주세요.</p>
      )}

      {state.myRole === "cat" && state.myCatAlignment === "mafia" && (
        <RedactedNotice theme={theme} text="당신의 능력(투표권 제거)은 밤이 아니라 낮 토론 시간에 사용합니다." />
      )}

      {state.myAlive && !state.myAbilityDisabled && state.myRole === "idol" && <PhishingPanel theme={theme} state={state} socket={socket} />}

      {state.myAlive && !state.myAbilityDisabled && state.myRole === "hitman" && state.myPowerUpgrade !== "hitman_poison" && <HitmanPanel theme={theme} state={state} socket={socket} />}
      {state.myAlive && !state.myAbilityDisabled && state.myRole === "hitman" && state.myPowerUpgrade === "hitman_multi" && state.phase === "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(232,120,120,0.1)", border: "1px solid rgba(232,120,120,0.35)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🎯 다중암살 — 두 번째 대상</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>두 대상 모두 직업을 맞혀야만 둘 다 죽습니다. 한 명만 맞으면 아무도 죽지 않습니다.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {alive(state.players).filter((p) => p.id !== state.myId && p.id !== state.hitmanTargetId).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                onClick={() => {
                  const guess = window.prompt(`${p.name}님의 예상 직업을 정확히 입력하세요 (예: 시민, 마피아, 경찰 등)`);
                  if (!guess) return;
                  const roleKey = Object.keys(HITMAN_ROLE_LABEL_BY_KEY).find((k) => HITMAN_ROLE_LABEL_BY_KEY[k] === guess.trim());
                  if (!roleKey) { alert("정확한 직업명을 입력해주세요."); return; }
                  socket.emit("game_action", { type: "SET_HITMAN_SECOND_TARGET", targetId: p.id, guessedRole: roleKey });
                }} />
            ))}
          </div>
          {state.myHitmanSecondResult && (
            <div style={{ fontSize: 11.5, color: theme.sub }}>지난밤 결과 — <b>{state.myHitmanSecondResult.targetName}</b>님: {state.myHitmanSecondResult.correct ? "✅ 성공" : "❌ 실패"}</div>
          )}
        </div>
      )}
      {state.myAlive && state.myRole === "framer" && state.myFramerWiretapMessages && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(143,191,106,0.12)", border: "1px solid rgba(143,191,106,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>📡 도청 — <b>{state.myFramerWiretapMessages.targetName}</b>님의 채팅방</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>누가 몇 명 있는지는 알 수 없고, 올라오는 대화 내용만 보입니다.</p>
          {state.myFramerWiretapMessages.messages.length === 0 ? (
            <div style={{ fontSize: 11.5, color: theme.sub }}>아직 들려오는 대화가 없습니다.</div>
          ) : (
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {state.myFramerWiretapMessages.messages.map((m, i) => (
                <div key={i} style={{ fontSize: 11.5, color: theme.text, marginBottom: 4 }}>{m.text}</div>
              ))}
            </div>
          )}
        </div>
      )}
      {state.myAlive && state.myRole === "police" && state.myWiretapMessages && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(91,155,240,0.12)", border: "1px solid rgba(91,155,240,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>📡 도청 — <b>{state.myWiretapMessages.targetName}</b>님의 채팅</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>어떤 채팅방인지, 누가 함께 있는지는 알 수 없고 대화 내용만 들립니다.</p>
          {state.myWiretapMessages.messages.length === 0 ? (
            <div style={{ fontSize: 11.5, color: theme.sub }}>아직 들려오는 대화가 없습니다.</div>
          ) : (
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {state.myWiretapMessages.messages.map((m, i) => (
                <div key={i} style={{ fontSize: 11.5, color: theme.text, marginBottom: 4 }}>{m.text}</div>
              ))}
            </div>
          )}
        </div>
      )}
      {state.myAlive && state.myRole === "police" && state.myPowerUpgrade === "police_double" && state.phase === "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(91,155,240,0.1)", border: "1px solid rgba(91,155,240,0.35)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🔍 강력 수사 — 두 번째 조사 대상</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId && !p.inJail && p.id !== state.policeTarget).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                selected={state.policeSecondTarget === p.id}
                onClick={() => socket.emit("game_action", { type: "SET_POLICE_SECOND_TARGET", targetId: p.id })} />
            ))}
          </div>
        </div>
      )}
      {state.myAlive && state.myRole === "terrorist" && state.myPowerUpgrade === "terrorist_arson" && state.phase === "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(217,123,62,0.14)", border: "1px solid rgba(217,123,62,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 4 }}>🔥 방화</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>밤마다 한 명에게 표식을 남기거나, 방화를 예약할 수 있습니다 (둘 중 하나만). 방화는 밤이 끝날 때 일어나며, 의사의 보호와 군인의 방어는 불길도 막아냅니다. 표식을 남긴 사람: {state.myTerroristMarkedNames?.join(", ") || "없음"}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {!state.myTerroristActedTonight && alive(state.players).filter((p) => p.id !== state.myId && !p.inJail && !(state.myTerroristMarkedNames || []).includes(p.name)).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                onClick={() => socket.emit("game_action", { type: "TERRORIST_MARK", targetId: p.id })} />
            ))}
          </div>
          {state.myTerroristActedTonight ? (
            <RedactedNotice theme={theme} text={state.myTerroristArsonPending ? "방화를 예약했습니다. 이번 밤이 끝나면 표식을 남긴 사람들과 함께 불길에 휩싸입니다." : "오늘 밤은 이미 표식을 남겼습니다. 표식이나 방화는 밤마다 한 번만 할 수 있어요."} />
          ) : (
          <button onClick={() => { if (window.confirm("정말 방화를 예약할까요? 이번 밤이 끝날 때 표식을 남긴 모든 사람과 함께 목숨을 잃습니다. (의사의 보호·군인의 방어를 받은 사람은 살아남습니다)")) socket.emit("game_action", { type: "TERRORIST_ARSON" }); }}
            style={{ width: "100%", padding: "10px 0", borderRadius: 4, border: "1px solid #E05F5F", background: "rgba(224,95,95,0.15)", color: "#E05F5F", fontWeight: 700, cursor: "pointer" }}>
            🔥 오늘 밤 방화 예약하기
          </button>
          )}
        </div>
      )}
      {state.myAlive && state.myRole === "doctor" && state.myPowerUpgrade === "doctor_hospitalize" && !state.myDoctorHospitalizeUsed && state.phase === "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(95,168,211,0.12)", border: "1px solid rgba(95,168,211,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🏥 강제 입원 (게임당 1회)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId && !p.inJail).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                onClick={() => { if (window.confirm(`${p.name}님을 강제로 입원시키겠습니까? 게임당 단 한 번만 쓸 수 있습니다.`)) socket.emit("game_action", { type: "DOCTOR_HOSPITALIZE", targetId: p.id }); }} />
            ))}
          </div>
        </div>
      )}
      {state.myAlive && state.myRole === "mafia" && state.mafiaHasOutlaw && state.phase === "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(184,76,92,0.12)", border: "1px solid rgba(184,76,92,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🗡️ 무법자 — 두 번째 습격 대상</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>첫 번째 습격 대상과는 완전히 별개로, 오늘 밤 함께 노릴 두 번째 대상에 투표합니다.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId && !p.inJail && p.id !== state.mafiaTarget).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                selected={state.mafiaSecondTarget === p.id}
                onClick={() => socket.emit("game_action", { type: "SET_MAFIA_SECOND_TARGET", targetId: p.id })} />
            ))}
          </div>
        </div>
      )}
      {state.myAlive && state.myRole === "witch" && state.myPowerUpgrade === "witch_ancient" && !state.myWitchAncientUsed && state.phase === "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(123,94,167,0.14)", border: "1px solid rgba(123,94,167,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🔮 고대 주술 (게임당 1회)</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>생존자 전원에게 개별적으로 30% 확률로 저주를 겁니다. 대상을 따로 고를 필요는 없습니다.</p>
          <button onClick={() => { if (window.confirm("고대 주술을 시전할까요? 게임당 단 한 번만 쓸 수 있습니다.")) socket.emit("game_action", { type: "WITCH_ANCIENT_CURSE" }); }}
            style={{ width: "100%", padding: "10px 0", borderRadius: 4, border: "1px solid #7B5EA7", background: "rgba(123,94,167,0.2)", color: "#C9AEE0", fontWeight: 700, cursor: "pointer" }}>
            🔮 지금 시전하기
          </button>
        </div>
      )}
      {state.myAlive && state.myRole === "godfather" && state.myGodfatherLegendEligible && state.phase === "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(168,50,63,0.14)", border: "1px solid rgba(168,50,63,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>👑 전설의 등장 — 직접 습격</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>다른 마피아가 모두 사라져, 이제 대부 본인이 직접 밤마다 한 명을 습격합니다.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                selected={state.mafiaVoteTargetId === p.id}
                onClick={() => socket.emit("game_action", { type: "SET_NIGHT_TARGET", role: "mafia", targetId: p.id })} />
            ))}
          </div>
        </div>
      )}
      {state.myAlive && state.myRole === "silencer" && state.myPowerUpgrade === "silencer_trafficking" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(184,76,92,0.12)", border: "1px solid rgba(184,76,92,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>⛓️ 인신매매 (게임당 1회)</div>
          {state.mySilencerTraffickingUsed ? (
            <RedactedNotice theme={theme} text="이미 인신매매 능력을 사용했습니다." />
          ) : (
            <>
              <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>선택한 플레이어는 즉시 게임에서 제외됩니다 (죽지는 않으며, 보안관의 감옥과 비슷합니다).</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {alive(state.players).filter((p) => p.id !== state.myId && !p.inJail).map((p) => (
                  <Chip key={p.id} theme={theme} label={p.name}
                    onClick={() => { if (window.confirm(`${p.name}님을 팔아넘기겠습니까? 게임당 단 한 번만 쓸 수 있습니다.`)) socket.emit("game_action", { type: "SILENCER_TRAFFICKING", targetId: p.id }); }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {state.myAlive && state.myRole === "silencer" && state.myPowerUpgrade === "silencer_brainwash" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(184,76,92,0.12)", border: "1px solid rgba(184,76,92,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🧠 세뇌 (게임당 1회)</div>
          {state.mySilencerBrainwashOutcome ? (
            <RedactedNotice theme={theme} text={state.mySilencerBrainwashOutcome.success
              ? `${state.mySilencerBrainwashOutcome.targetName}님을 세뇌해 마피아팀으로 끌어들였습니다.`
              : `${state.mySilencerBrainwashOutcome.targetName}님은 세뇌에 넘어가지 않았습니다. (중립은 세뇌할 수 없습니다)`} />
          ) : state.mySilencerBrainwashUsed ? (
            <RedactedNotice theme={theme} text="이미 세뇌 능력을 사용했습니다." />
          ) : (
            <>
              <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>선택한 플레이어를 마피아팀으로 영입합니다. 경찰도 영입할 수 있지만, 중립을 고르면 실패하고 기회만 사라집니다.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {alive(state.players).filter((p) => p.id !== state.myId && !p.inJail && !state.teammates.some((t) => t.id === p.id)).map((p) => (
                  <Chip key={p.id} theme={theme} label={p.name}
                    onClick={() => { if (window.confirm(`${p.name}님을 세뇌하겠습니까? 게임당 단 한 번만 쓸 수 있습니다.`)) socket.emit("game_action", { type: "SILENCER_BRAINWASH", targetId: p.id }); }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {state.myAlive && state.myRole === "conartist" && state.myPowerUpgrade === "conartist_legend" && (
        <LegendConartistPanel theme={theme} state={state} socket={socket} />
      )}
      {state.myAlive && (state.myTeam === "mafia" || state.myIsWolfAllied || state.myCatAlignment === "mafia" || state.myRecruitedToMafia || (state.myRole === "mercenary" && state.myMercenaryContactedBy === "mafia")) && (
        <ChatPanel theme={theme} players={state.players} title="🗡️ 마피아 팀 채팅" messages={state.chats.mafia} participants={state.chatParticipants?.mafia}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "mafia", text })} />
      )}
      {(state.myLoverChatOpen || (state.myAlive && ((state.myRole === "cat" && state.myCatAlignment === "citizen") || state.myIsCatOwner))) && (
        <ChatPanel theme={theme} players={state.players} title={
          state.myRole === "newlywed" ? (state.myAlive ? "💞 연인 채팅" : "💞 연인 채팅 (영혼 결혼식)")
          : "🐱 집사와의 채팅"
        } messages={state.chats.lover} participants={state.chatParticipants?.lover}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "lover", text })} />
      )}
      {state.myAlive && (state.chatParticipants?.teacherStudent?.length > 0) && (
        <ChatPanel theme={theme} players={state.players} title="🍎 교사 & 학생 채팅" messages={state.chats.teacherStudent} participants={state.chatParticipants?.teacherStudent}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "teacherStudent", text })} />
      )}
      {state.myAlive && (state.chatParticipants?.counselor?.length > 0) && (
        <ChatPanel theme={theme} players={state.players} title="💬 상담 채팅" messages={state.chats.counselor} participants={state.chatParticipants?.counselor}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "counselor", text })} />
      )}
      {state.myAlive && (state.chatParticipants?.mercenaryContact?.length > 0) && (
        <ChatPanel theme={theme} players={state.players} title="🗡️ 접선 채팅" messages={state.chats.mercenaryContact} participants={state.chatParticipants?.mercenaryContact}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "mercenaryContact", text })} />
      )}
      {state.myAlive && (state.chatParticipants?.wardenChat?.length > 0) && (
        <ChatPanel theme={theme} players={state.players} title="🔑 교도관 면회" messages={state.chats.wardenChat} participants={state.chatParticipants?.wardenChat}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "wardenChat", text })} />
      )}
      {state.myAlive && !state.myAbilityDisabled && state.myRole === "teacher" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: theme.accentSoft, marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>🍎 오늘 밤 수업하기</div>
          <p style={{ fontSize: 11, color: theme.sub, margin: "0 0 10px" }}>
            같은 직업을 필요한 횟수만큼 수업하면 학생이 그 직업을 갖게 돼요. 필수직업은 7회, 특수직업은 5회, 일반직업은 3회 필요해요.
          </p>
          {state.myTeacherLessonChoice ? (
            <RedactedNotice theme={theme} text={`오늘 밤은 이미 [${TEACHABLE_ROLE_LABEL[state.myTeacherLessonChoice] || state.myTeacherLessonChoice}] 수업을 선택했습니다.`} />
          ) : (
            <>
              {[["필수직업 (7회)", TEACHABLE_FORCED], ["특수직업 (5회)", TEACHABLE_SPECIAL], ["일반직업 (3회)", TEACHABLE_GENERAL]].map(([groupLabel, roles]) => (
                <div key={groupLabel} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, color: theme.sub, marginBottom: 4 }}>{groupLabel}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {roles.map(([key, label]) => (
                      <Chip key={key} theme={theme} label={`${label} (${state.myTeachingProgress?.[key] || 0})`}
                        onClick={() => socket.emit("game_action", { type: "TEACHER_TEACH", roleKey: key })} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {state.myAlive && state.myRole === "student" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: theme.accentSoft, marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 6 }}>🎒 지금까지의 수업 진행도</div>
          {Object.keys(state.myTeachingProgress || {}).length === 0 ? (
            <p style={{ fontSize: 11.5, color: theme.sub, margin: 0 }}>아직 교사에게 수업을 받지 않았어요.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(state.myTeachingProgress).map(([key, count]) => (
                <span key={key} style={{ fontSize: 11.5, color: theme.text, background: "rgba(0,0,0,0.08)", borderRadius: 999, padding: "3px 9px" }}>
                  {TEACHABLE_ROLE_LABEL[key] || key} {count}/{TEACHABLE_REQUIRED[key] || "?"}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {state.myAlive && inVampireTeam && (
        <ChatPanel theme={theme} players={state.players} title="🧛 뱀파이어 팀 채팅" messages={state.chats.vampire} participants={state.chatParticipants?.vampire}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "vampire", text })} />
      )}
      {(state.myRole === "medium" || state.myConartistLegendRole === "medium" || !state.myAlive) && (state.myMediumChatReadOnly ? (
        <LiveChatFeed theme={theme} players={state.players} title="영매 & 사망자 채팅 (성불되어 말할 수 없음)" messages={state.chats.medium} emptyText="아직 대화가 없습니다." />
      ) : (
        <ChatPanel theme={theme} players={state.players} title="👻 영매 & 사망자 채팅" messages={state.chats.medium} participants={state.chatParticipants?.medium}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "medium", text })} />
      ))}

      <AutoNote theme={theme} />
    </Card>
  );
}

function MorningView({ theme, state }) {
  const death = state.lastNightDeath ? state.players.find((p) => p.id === state.lastNightDeath) : null;
  const hadOtherEvent = !!(state.werewolfVictimName || state.curseVictimName || state.vampireFightResult || state.avengerKillResult || state.priestReviveName || state.catAppearedName || state.bodyguardSaveResult || state.judgePardonResult || state.veteranSurvivedName || state.nightLordResult || extraMorningEvents(state).length > 0);
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="morning" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      {state.nightLordResult && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: "rgba(90,10,25,0.35)", border: "1px solid rgba(168,50,63,0.6)", margin: "14px 0 0" }}>
          <div style={{ fontSize: 28 }}>👑🌑</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>밤의 지배자가 깨어났습니다</div>
          <div style={{ fontSize: 13, color: theme.sub }}>지난밤, 마피아팀을 제외한 모든 능력이 어둠에 삼켜져 무력화되었습니다</div>
        </div>
      )}
      {(death || (!hadOtherEvent && !state.nightSaveHappened)) && <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: theme.accentSoft, margin: "14px 0" }}>
        {death ? (
          <>
            <div style={{ fontSize: 28 }}>☠️</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{death.name}님이 사망한 채로 발견되었습니다</div>
          </>
        ) : (!hadOtherEvent && !state.nightSaveHappened) ? (
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text }}>🌤️ 평화로운 아침입니다.</div>
        ) : null}
      </div>}
      {state.veteranSurvivedName && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: theme.accentSoft, marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🪖</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{state.veteranSurvivedName}님이 공격에 맞서 싸워 살아남았습니다!</div>
        </div>
      )}
      {state.nightSaveHappened && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: "rgba(127,168,140,0.16)", border: "1px solid rgba(127,168,140,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🛡️</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{state.nightSavedName || "누군가"}님이 밤사이 습격당했지만 목숨을 건졌습니다!</div>
          <div style={{ fontSize: 13, color: theme.sub }}>{saveByText(state)} 목숨을 잃지 않았습니다</div>
        </div>
      )}
      {state.hitmanKillVictimName && state.hitmanKillVictimId !== state.lastNightDeath && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: theme.accentSoft, marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>☠️</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{state.hitmanKillVictimName}님이 사망한 채로 발견되었습니다</div>
        </div>
      )}
      {state.soloKillVictimName && state.soloKillVictimId !== state.lastNightDeath && state.soloKillVictimId !== state.hitmanKillVictimId && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: theme.accentSoft, marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>☠️</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{state.soloKillVictimName}님이 사망한 채로 발견되었습니다</div>
        </div>
      )}
      {state.vampireFightResult && (
        <>
          <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: theme.accentSoft, marginBottom: 14 }}>
            <div style={{ fontSize: 28 }}>☠️</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{state.vampireFightResult.vampireName}님이 사망한 채로 발견되었습니다</div>
          </div>
          <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: theme.accentSoft, marginBottom: 14 }}>
            <div style={{ fontSize: 28 }}>☠️</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{state.vampireFightResult.mafiaName}님이 사망한 채로 발견되었습니다</div>
          </div>
        </>
      )}
      {state.avengerKillResult && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: "rgba(142,40,70,0.18)", border: "1px solid rgba(180,50,80,0.45)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🩸💞</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            {state.avengerKillResult.targetName}님이 피의 복수에 쓰러졌습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>사랑하는 이를 잃은 누군가가 끝내 원수를 갚았습니다</div>
        </div>
      )}
      {state.werewolfVictimName && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: "rgba(60,58,90,0.22)", border: "1px solid rgba(140,150,220,0.35)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🌕🐺</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            {state.werewolfVictimName}님이 늑대인간에게 습격당했습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>날카로운 발톱과 이빨 자국이 남아있습니다</div>
        </div>
      )}
      {state.priestReviveName && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: "rgba(232,196,104,0.18)", border: "1px solid rgba(232,196,104,0.45)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🕊️</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            {state.priestReviveName}님이 성직자에 의해 부활했습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>따뜻한 빛이 마을에 다시 한 번의 기회를 내려주었습니다</div>
        </div>
      )}
      {state.judgePardonResult && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: "rgba(91,155,240,0.14)", border: "1px solid rgba(91,155,240,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>⚖️</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            {state.judgePardonResult.name}님이 판사에 의해 사면되었습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>감옥에서 풀려나 다시 게임에 참여할 수 있게 되었습니다</div>
        </div>
      )}
      {state.bodyguardSaveResult && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: "rgba(91,155,240,0.14)", border: "1px solid rgba(91,155,240,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🛡️</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            {state.bodyguardSaveResult.bodyguardName}님이 {state.bodyguardSaveResult.targetName}님을 지키다 목숨을 잃었습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>
            {state.bodyguardSaveResult.attackerName ? `${state.bodyguardSaveResult.attackerName}님도 함께 쓰러졌습니다` : "몸을 던져 지켜냈습니다"}
          </div>
        </div>
      )}
      {state.bodyguardLastWord && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: "rgba(232,210,160,0.14)", border: "1px solid rgba(232,210,160,0.45)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>📜</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            경호원 {state.bodyguardLastWord.bodyguardName}님의 결정적 유언
          </div>
          <div style={{ fontSize: 14, color: theme.text }}>"나를 죽인 건… <b>{state.bodyguardLastWord.killerName}</b>님이다"</div>
        </div>
      )}
      {state.catAppearedName && (
        <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: "rgba(232,180,120,0.16)", border: "1px solid rgba(232,180,120,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 28 }}>🐱</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>
            어느새 고양이 한 마리가 마을에 들어와 있었습니다
          </div>
          <div style={{ fontSize: 13, color: theme.sub }}>이름은 {state.catAppearedName} — 아무도 언제부터인지 알지 못합니다</div>
        </div>
      )}
      {state.myUnemployedJobGranted && (
        <PrivateNote theme={theme}>
          🛋️ 마침 빈자리가 생겨서, 당신은 이제부터 <b>[{state.myUnemployedJobGranted}]</b> 직업을 갖게 되었습니다.
        </PrivateNote>
      )}
      {state.curseCastName && (
        <div style={{ borderRadius: 5, padding: "16px 18px", textAlign: "center",
          background: "rgba(123,94,167,0.16)", border: "1px solid rgba(123,94,167,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 24 }}>🔮</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, fontWeight: 700, color: theme.text, margin: "4px 0 2px" }}>
            {state.curseCastName}님이 마녀에게 죽음의 저주를 받았습니다
          </div>
          <div style={{ fontSize: 12.5, color: theme.sub }}>3일 후 저주가 발동됩니다. 그 전에 마녀가 처형되면 저주는 풀립니다.</div>
        </div>
      )}
      {state.curseVictimName && (
        <div style={{ borderRadius: 5, padding: "16px 18px", textAlign: "center",
          background: "rgba(123,94,167,0.16)", border: "1px solid rgba(123,94,167,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 24 }}>💀</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, fontWeight: 700, color: theme.text, margin: "4px 0 0" }}>
            저주가 발동되어 {state.curseVictimName}님이 목숨을 잃었습니다
          </div>
        </div>
      )}
      {extraMorningEvents(state).map((e) => (
        <div key={e.key} style={{ borderRadius: 5, padding: "16px 18px", textAlign: "center", background: theme.accentSoft, marginBottom: 14 }}>
          <div style={{ fontSize: 24 }}>{e.icon}</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, fontWeight: 700, color: theme.text, margin: "4px 0 0" }}>{e.text}</div>
        </div>
      ))}
      {state.reporterReveal && (
        <NewsArticle theme={theme} dayNumber={state.dayNumber} name={state.reporterReveal.name} roleLabel={state.reporterReveal.roleLabel} />
      )}
      {state.isBlockedVoter && (
        <PrivateNote theme={theme}>{state.isHostedVoter
          ? "🥂 당신은 밤사이 마담의 접대에 넘어가 투표권을 빼앗겼습니다. 오늘은 투표를 할 수 없어요."
          : "🎖️ 당신은 밤사이 건달에게 협박당했습니다. 오늘은 투표를 할 수 없어요."}</PrivateNote>
      )}
      {state.myAbilityLostTonight && (
        <PrivateNote theme={theme}>💻 밤사이 기기가 바이러스에 감염되어, 직업 능력을 영구히 잃었습니다.</PrivateNote>
      )}
      {state.myAbilitySealedTonight && (
        <PrivateNote theme={theme}>💋 밤사이 마담에게 현혹되어, 마담이 죽을 때까지 직업 능력이 봉인되었습니다.</PrivateNote>
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
      {powerResultRows(state).map((r) => <PrivateNote key={r.key} theme={theme}>{r.icon} {r.text}</PrivateNote>)}
      {state.myGodfatherCaughtName && <PrivateNote theme={theme}>🚨 누군가 당신을 마피아팀으로 영입하려 했지만, 경찰인 당신은 그 정체를 알아챘습니다 — 바로 <b>{state.myGodfatherCaughtName}</b>입니다.</PrivateNote>}
      {state.myGodfatherNeutralEncounterResult && (
        <PrivateNote theme={theme}>👑 <b>{state.myGodfatherNeutralEncounterResult.targetName}</b>님을 영입하려 했지만, 어느 팀에도 속하지 않은 [{state.myGodfatherNeutralEncounterResult.targetRoleLabel}]이라 영입에 실패했습니다. 대신 서로의 정체를 알게 되었습니다.</PrivateNote>
      )}
      {state.myGodfatherNeutralCaughtName && (
        <PrivateNote theme={theme}>👑 <b>{state.myGodfatherNeutralCaughtName}</b>님(대부)이 당신을 영입하려 했지만 실패했습니다. 서로의 정체를 알게 되었습니다.</PrivateNote>
      )}
      {state.wasRecruitedToMafia && <PrivateNote theme={theme}>👑 지난밤, 누군가 은밀히 접근해 당신을 마피아팀으로 끌어들였습니다. 기존 직업 능력은 그대로지만, 이제 마피아팀 소속입니다.</PrivateNote>}
      {state.myGodfatherRecruitedName && <PrivateNote theme={theme}>👑 <b>{state.myGodfatherRecruitedName}</b>님을 마피아팀으로 영입하는 데 성공했습니다.</PrivateNote>}
      {state.myDetectiveResult && <PrivateNote theme={theme}>🧭 추적 결과 (탐정 전용): <b>{state.myDetectiveResult.actorName}</b>님은 {state.myDetectiveResult.actedOnName ? `${state.myDetectiveResult.actedOnName}님을 대상으로 능력을 사용했습니다.` : "이번 밤 능력을 사용하지 않았습니다."}</PrivateNote>}
      {state.myCatDetectResult && <PrivateNote theme={theme}>🐱 추적 결과: <b>{state.myCatDetectResult.actorName}</b>님은 {state.myCatDetectResult.actedOnName ? `${state.myCatDetectResult.actedOnName}님을 대상으로 능력을 사용했습니다.` : "이번 밤 능력을 사용하지 않았습니다."}</PrivateNote>}
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

// 지난밤 능력을 사용한 결과(누구를 대상으로 했고 어떤 결과였는지)를, 밤/아침에만 잠깐 보여주고 마는 게 아니라
// 낮 회의시간 내내 개인 화면에 고정으로 띄워주는 패널. 특히 조사류 직업(경찰/스파이/탐정/장의사/검시관 등)이
// "내가 뭘 알아냈는지" 채팅하면서도 계속 참고할 수 있어야 하므로, 토론/보안관선출 화면 상단에 넣는다.
function MyAbilityResultsPanel({ theme, state, inSidebar }) {
  const { mode } = useGameLayout();
  // PC에서는 왼쪽 "내 정보" 열에 늘 떠 있으므로, 가운데 화면에서는 중복으로 그리지 않는다.
  if (mode === "desktop" && !inSidebar) return null;
  const rows = abilityResultRows(state);
  if (rows.length === 0) return null;
  const list = rows.map((r) => (
    <div key={r.key} style={{ fontSize: 12.5, color: theme.text, marginBottom: 4, lineHeight: 1.5 }}>{r.icon} {r.text}</div>
  ));
  if (mode === "mobile" && !inSidebar) {
    return <Collapsible theme={theme} title="🌙 지난밤 내 능력 결과" badge={`${rows.length}건`}>{list}</Collapsible>;
  }
  return (
    <div style={{ borderRadius: 4, padding: "10px 14px", background: "rgba(0,0,0,0.1)", border: `1px dashed ${theme.panelBorder}`, marginBottom: 10 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.sub, marginBottom: 6 }}>🌙 지난밤 내 능력 결과</div>
      {list}
    </div>
  );
}

function abilityResultRows(state) {
  const rows = powerResultRows(state);
  if (state.myDetectiveResult) {
    rows.push({ key: "detective", icon: "🧭", text: state.myDetectiveResult.identity
      ? <>신원 조사: <b>{state.myDetectiveResult.actorName}</b>님의 직업은 [{state.myDetectiveResult.roleLabel}] 입니다.</>
      : <>추적 결과 (탐정 전용): <b>{state.myDetectiveResult.actorName}</b>님은 {state.myDetectiveResult.actedOnName ? <>{state.myDetectiveResult.actedOnName}님을 대상으로 능력을 사용했습니다.</> : "이번 밤 능력을 사용하지 않았습니다."}</> });
  }
  if (state.myCatDetectResult) {
    rows.push({ key: "catDetect", icon: "🐱", text: <>추적 결과: <b>{state.myCatDetectResult.actorName}</b>님은 {state.myCatDetectResult.actedOnName ? <>{state.myCatDetectResult.actedOnName}님을 대상으로 능력을 사용했습니다.</> : "이번 밤 능력을 사용하지 않았습니다."}</> });
  }
  if (state.myUndertakerResult) {
    rows.push({ key: "undertaker", icon: "⚰️", text: <>부검 결과 (장의사 전용): <b>{state.myUndertakerResult.targetName}</b>님의 직업은 [{state.myUndertakerResult.roleLabel}] 였습니다.{state.myUndertakerResult.wasSoulHarvested && " 악마 숭배자에게 영혼을 빼앗겼던 흔적이 있습니다."}{state.myUndertakerResult.wasThrall && " 흡혈귀였던 흔적이 있습니다."}{state.myUndertakerResult.causeFlavor && <> 사법부검 — "{state.myUndertakerResult.causeFlavor}"</>}</> });
  }
  if (state.myCoronerResult) {
    rows.push({ key: "coroner", icon: "🔬", text: <>부검 결과 (검시관 전용): <b>{state.myCoronerResult.targetName}</b>님을 부검한 결과 — "{state.myCoronerResult.flavor}"</> });
  }
  if (state.myHitmanResult) {
    rows.push({ key: "hitman", icon: "🎯", text: <>암살 결과 — <b>{state.myHitmanResult.targetName}</b>님 저격: {state.myHitmanResult.correct ? "✅ 성공" : "❌ 실패"}</> });
  }
  if (state.mySpyCaughtByName) {
    rows.push({ key: "spyCaught", icon: "🕵️", text: <><b>{state.mySpyCaughtByName}</b>님이 스파이라는 사실을 알아챘습니다! (당신을 조사했다가 정체가 들켰어요)</> });
  }
  if (state.myGodfatherCaughtName) {
    rows.push({ key: "godfatherCaught", icon: "🚨", text: <>누군가 당신을 마피아팀으로 영입하려 했지만, 그 정체를 알아챘습니다 — 바로 <b>{state.myGodfatherCaughtName}</b>입니다.</> });
  }
  if (state.myGodfatherNeutralEncounterResult) {
    rows.push({ key: "godfatherNeutralEncounter", icon: "👑", text: <><b>{state.myGodfatherNeutralEncounterResult.targetName}</b>님을 영입하려 했지만, 어느 팀에도 속하지 않은 [{state.myGodfatherNeutralEncounterResult.targetRoleLabel}]이라 실패했습니다. 서로의 정체를 알게 되었습니다.</> });
  }
  if (state.myGodfatherNeutralCaughtName) {
    rows.push({ key: "godfatherNeutralCaught", icon: "👑", text: <><b>{state.myGodfatherNeutralCaughtName}</b>님(대부)이 당신을 영입하려 했지만 실패했습니다. 서로의 정체를 알게 되었습니다.</> });
  }
  if (state.myMafiaApprenticeReveal) {
    rows.push({ key: "mafiaApprentice", icon: "🗡️", text: <>수습 — <b>{state.myMafiaApprenticeReveal.targetName}</b>님을 처치하면서 직업이 [{state.myMafiaApprenticeReveal.roleLabel}]임을 알게 되었습니다.</> });
  }
  return rows;
}

// 7일차 능력 중 "낮에 쓰는" 것들 - 토론 화면과 보안관 선출 화면에서 똑같이 보여준다.
function DayPowerPanels({ theme, state: rawState, socket }) {
  const state = withoutAbilities(rawState);
  return (
    <>
      <AbilityDisabledNotice theme={theme} state={rawState} />
      {state.myAlive && state.myRole === "framer" && state.myPowerUpgrade === "framer_wiretap" && state.phase !== "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(143,191,106,0.12)", border: "1px solid rgba(143,191,106,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>📡 도청 대상 지정</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>오늘 밤, 이 사람이 속한 비밀 채팅방의 대화를 엿볼 수 있습니다. 밤이 되기 전까지 바꿀 수 있어요.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                selected={state.myFramerWiretapTargetId === p.id}
                onClick={() => socket.emit("game_action", { type: "SET_FRAMER_WIRETAP_TARGET", targetId: p.id })} />
            ))}
          </div>
        </div>
      )}
      {state.myAlive && state.myRole === "terrorist" && state.myPowerUpgrade === "terrorist_selfdestruct" && state.phase !== "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(217,123,62,0.14)", border: "1px solid rgba(217,123,62,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>💣 자폭 대상 지정</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>처형당하면 이 대상과 무조건 함께 죽습니다. 언제든 바꿀 수 있습니다.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                selected={state.terroristSelfdestructTarget === p.id}
                onClick={() => socket.emit("game_action", { type: "SET_TERRORIST_SELFDESTRUCT_TARGET", targetId: p.id })} />
            ))}
          </div>
        </div>
      )}
      {state.myAlive && state.myRole === "conartist" && state.myPowerUpgrade === "conartist_rig" && state.phase !== "night" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(184,76,92,0.12)", border: "1px solid rgba(184,76,92,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🗳️ 투표 조작</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>이 대상에게 가는 낮 투표는 전부 무효 처리됩니다. 언제든 바꿀 수 있습니다.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                selected={state.conartistRiggedTargetId === p.id}
                onClick={() => socket.emit("game_action", { type: "SET_CONARTIST_RIG_TARGET", targetId: p.id })} />
            ))}
          </div>
        </div>
      )}
      {state.myAlive && !state.myAbilityDisabled && state.myRole === "hitman" && state.myPowerUpgrade === "hitman_poison" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(232,120,120,0.1)", border: "1px solid rgba(232,120,120,0.35)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>☠️ 독살 — 낮에 독을 먹일 대상</div>
          <p style={{ fontSize: 10.5, color: theme.sub, margin: "0 0 8px" }}>독을 먹은 대상은 오늘 밤이 지나고 아침에 목숨을 잃습니다. 하루에 한 명, 밤이 되기 전까지 바꿀 수 있습니다.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                selected={state.myHitmanPoisonTargetId === p.id}
                onClick={() => { if (window.confirm(`${p.name}님에게 독을 먹이겠습니까?`)) socket.emit("game_action", { type: "HITMAN_POISON", targetId: p.id }); }} />
            ))}
          </div>
        </div>
      )}

    </>
  );
}

/** 낮(토론) 동안 쓰는 직업 능력 창들 - 토론 화면과 모바일 "행동" 탭에서 같이 쓴다 */
function DayAbilityPanels({ theme, state, socket }) {
  if (state.phase !== "discussion") return <DayPowerPanels theme={theme} state={state} socket={socket} />;
  return (
    <>
      {state.myAlive && state.myRole === "mercenary" && state.myMercenaryPendingContacts?.length > 0 && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(183,90,90,0.14)", border: "1px solid rgba(183,90,90,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🗡️ 여러 곳에서 동시에 접선 요청이 왔습니다</div>
          <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 8px" }}>
            지난밤 한꺼번에 여러 곳에서 의뢰가 들어왔습니다. 하나만 받아들일 수 있어요.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {state.myMercenaryPendingContacts.map((c) => {
              const label = c.type === "mafia" ? "🗡️ 마피아" : c.type === "police" ? "🚨 경찰" : "🎖️ 건달";
              return (
                <Chip key={c.type} theme={theme} label={label}
                  onClick={() => socket.emit("game_action", { type: "CHOOSE_MERCENARY_CONTACT", contactType: c.type })} />
              );
            })}
          </div>
        </div>
      )}

      {state.myAlive && !state.myAbilityDisabled && state.myRole === "counselor" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(91,155,240,0.14)", border: "1px solid rgba(91,155,240,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>💬 오늘 밤 상담할 사람 고르기</div>
          <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 8px" }}>하루짜리 선택이라 오늘 안 고르면 오늘 밤은 그냥 지나가요.</p>
          {state.myCounselorTarget ? (
            <RedactedNotice theme={theme} text={`오늘 밤은 ${state.players.find((p) => p.id === state.myCounselorTarget)?.name}님과 상담합니다.`} />
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {alive(state.players).filter((p) => p.id !== state.myId).map((p) => (
                <Chip key={p.id} theme={theme} label={p.name}
                  onClick={() => socket.emit("game_action", { type: "COUNSELOR_SELECT", targetId: p.id })} />
              ))}
            </div>
          )}
        </div>
      )}

      <DayPowerPanels theme={theme} state={state} socket={socket} />
      {state.myAlive && !state.myAbilityDisabled && state.myRole === "coroner" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(143,191,106,0.14)", border: "1px solid rgba(143,191,106,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🔬 부검하기</div>
          {state.myCoronerUsedToday ? (
            state.myCoronerResult ? (
              <RedactedNotice theme={theme} text={`${state.myCoronerResult.targetName}님을 부검한 결과 — "${state.myCoronerResult.flavor}"`} />
            ) : (
              <RedactedNotice theme={theme} text="오늘은 이미 부검 능력을 사용했습니다." />
            )
          ) : (
            <>
              <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 8px" }}>
                죽은 사람 중 한 명을 골라 사망 원인을 알아낼 수 있습니다. 누가 죽였는지는 알 수 없고, 하루에 한 번만 가능해요.
              </p>
              {state.players.filter((p) => !p.alive).length === 0 ? (
                <RedactedNotice theme={theme} text="아직 죽은 사람이 없어서 부검할 대상이 없습니다." />
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {state.players.filter((p) => !p.alive).map((p) => (
                    <Chip key={p.id} theme={theme} label={p.name}
                      onClick={() => socket.emit("game_action", { type: "CORONER_INVESTIGATE", targetId: p.id })} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {state.myAlive && !state.myAbilityDisabled && state.myRole === "detective" && state.myPowerUpgrade === "detective_deduce" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(143,191,106,0.12)", border: "1px solid rgba(143,191,106,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>🧠 명추리 (게임당 1회)</div>
          {state.myDetectiveDeduceUsed ? (
            <RedactedNotice theme={theme} text={state.myDetectiveDeduceResult ? `${state.myDetectiveDeduceResult.targetName}님을 죽인 사람은 ${state.myDetectiveDeduceResult.killerName || "알 수 없었습니다"}${state.myDetectiveDeduceResult.killerName ? "님입니다." : ""}` : "이미 명추리를 사용했습니다."} />
          ) : (state.myDeduceCandidateIds || []).length === 0 ? (
            <RedactedNotice theme={theme} text="어젯밤 죽은 사람이 없어 추리할 대상이 없습니다." />
          ) : (
            <>
              <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 8px" }}>어젯밤 죽은 사람 중 한 명을 고르면, 누가 그 사람을 죽였는지 알아냅니다.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {state.players.filter((p) => state.myDeduceCandidateIds.includes(p.id)).map((p) => (
                  <Chip key={p.id} theme={theme} label={p.name}
                    onClick={() => { if (window.confirm(`${p.name}님의 죽음을 추리할까요? 게임당 단 한 번뿐입니다.`)) socket.emit("game_action", { type: "DETECTIVE_DEDUCE", targetId: p.id }); }} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {state.myAlive && !state.myAbilityDisabled && state.myRole === "priest" && state.myPowerUpgrade === "priest_inquisition" && !state.myInquisitionUsed && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(232,210,150,0.12)", border: "1px solid rgba(232,210,150,0.45)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>✝️ 이단심판 (게임당 1회)</div>
          <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 8px" }}>
            한 명을 이단으로 고발하면 토론이 즉시 끝나고, 최후 변론 뒤 당신이 처형 여부를 결정합니다. 무고한 사람이어도 감옥에 가지 않습니다.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId && !p.inJail).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                onClick={() => { if (window.confirm(`${p.name}님을 이단으로 고발할까요? 게임당 단 한 번뿐이고, 모두에게 공개됩니다.`)) socket.emit("game_action", { type: "PRIEST_INQUISITION", targetId: p.id }); }} />
            ))}
          </div>
        </div>
      )}

      {state.myAlive && state.myIsSheriff && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(232,196,104,0.14)", border: "1px solid rgba(232,196,104,0.4)", marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.text, marginBottom: 8 }}>⭐ 처형대에 세우기</div>
          <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 8px" }}>
            한 명을 지목하면 토론이 즉시 종료되고, 그 사람의 최후 변론 뒤 당신이 처형 여부를 결정합니다.{state.myPowerUpgrade === "politician_dictator" && " (독재 중이라 무고한 사람을 처형해도 감옥에 가지 않습니다)"}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {alive(state.players).filter((p) => p.id !== state.myId).map((p) => (
              <Chip key={p.id} theme={theme} label={p.name}
                onClick={() => socket.emit("game_action", { type: "SHERIFF_DESIGNATE", targetId: p.id })} />
            ))}
          </div>
        </div>
      )}

      {state.myAlive && !state.myAbilityDisabled && state.myRole === "cat" && state.myCatAlignment === "mafia" && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: theme.accentSoft, marginBottom: 14 }}>
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

    </>
  );
}

function DiscussionView({ theme, state, socket }) {
  const aliveCount = state.players.filter((p) => p.alive).length;
  const required = Math.ceil(aliveCount * 0.7);
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="discussion" label={PHASE_LABEL(state)} />
      <MyAbilityResultsPanel theme={theme} state={state} />
      {state.sheriffElectedName && (
        <div style={{ borderRadius: 4, padding: "14px", background: "rgba(232,196,104,0.18)", marginBottom: 10, textAlign: "center" }}>
          <div style={{ fontSize: 22 }}>⭐</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}><b>{state.sheriffElectedName}</b>님이 보안관으로 선출되었습니다!</div>
        </div>
      )}
      {state.sheriffJustJailedName ? (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(224,95,95,0.16)", marginBottom: 10, textAlign: "center", color: "#E05F5F", fontWeight: 700 }}>
          🚨 무고한 처형으로 <b>{state.sheriffJustJailedName}</b>님이 보안관 직위를 박탈당하고 감옥에 수감되었습니다.
        </div>
      ) : state.sheriffExecutionResult && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(232,196,104,0.14)", marginBottom: 10, textAlign: "center" }}>
          <b>{state.sheriffExecutionResult.targetName}</b>님이 {state.sheriffExecutionResult.byPriest ? "성직자의 이단심판으로" : "보안관에 의해"} 처형되었습니다 —
          {state.sheriffExecutionResult.wasMafia ? " 마피아팀이었습니다." : " 마피아팀이 아니었습니다."}
        </div>
      )}
      {state.dictatorResult && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(201,162,75,0.16)", marginBottom: 10, textAlign: "center" }}>
          🎩 정치인 <b>{state.dictatorResult.name}</b>님이 독재를 선포하고 보안관 자리를 차지했습니다.
        </div>
      )}
      {state.terroristBombVictimName && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(217,123,62,0.14)", marginBottom: 10, textAlign: "center" }}>
          💣 테러리스트의 자폭으로 <b>{state.terroristBombVictimName}</b>님이 함께 목숨을 잃었습니다
        </div>
      )}
      <NightSummaryBanner theme={theme} state={state} />

      <DayAbilityPanels theme={theme} state={state} socket={socket} />

      {state.myAlive && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          borderRadius: 4, padding: "10px 14px", background: theme.accentSoft, marginBottom: 14 }}>
          <span style={{ fontSize: 12.5, color: theme.text }}>
            ⏭ 회의 스킵 투표 · {state.skipVoteCount}/{aliveCount}명 ({required}명 이상이면 즉시 종료)
          </span>
          <Button theme={theme} variant={state.mySkippedVote ? "solid" : "subtle"} style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap", flexShrink: 0 }}
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
          <ChatPanel theme={theme} players={state.players} title="💬 채팅" messages={state.dayChat}
            onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "day", text })} />
        </>
      ) : (
        <>
          <p style={{ color: theme.sub, fontSize: 13, margin: "4px 0 10px" }}>
            {state.isBlockedChatter ? "유괴범에게 납치당해 오늘은 채팅을 칠 수 없어요. 대화는 지켜볼 수 있어요." : "사망하셨기 때문에 낮 채팅에는 참여할 수 없어요. 대화는 지켜볼 수 있어요."}
          </p>
          <LiveChatFeed theme={theme} players={state.players} title="💬 채팅 (읽기 전용)" messages={state.dayChat} />
        </>
      )}
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <AutoNote theme={theme} text="시간이 지나면 자동으로 투표가 시작됩니다." />
    </Card>
  );
}

function VoteView({ theme, state, socket }) {
  const targets = alive(state.players).filter((p) => p.id !== state.myId && !p.inJail);
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
          <p style={{ fontSize: 13, color: theme.sub, margin: "12px 0 10px" }}>
            처형할 대상을 지목하세요. 투표 전까지 몇 번이든 바꿀 수 있어요. {state.myRole === "politician" && "(정치인은 2표를 행사합니다)"}{state.myPowerUpgrade === "politician_incite" && " · [선동] 당신이 찍은 사람의 표는 두 배가 됩니다"}{state.mySoldierBossActive && "(골목대장 - 오늘은 2표를 행사합니다)"}
          </p>
          <VoteTileGrid theme={theme} players={targets} selectedId={state.myVoteTarget}
            onPick={(p) => socket.emit("game_action", { type: "CAST_VOTE", targetId: p.id })} />
          {state.myVoteTarget && (
            <div style={{ marginTop: 12, fontSize: 13, color: theme.text, textAlign: "center" }}>
              🗳️ 지금 <b style={{ color: theme.accent }}>{state.players.find((p) => p.id === state.myVoteTarget)?.name}</b>님에게 투표했습니다
            </div>
          )}
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
        <ChatPanel theme={theme} players={state.players} title="💬 채팅" messages={state.dayChat}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "day", text })} />
      ) : (
        <LiveChatFeed theme={theme} players={state.players} title="💬 채팅 (읽기 전용)" messages={state.dayChat} />
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
        <BigChoice theme={theme} selected={state.myFinalVote}
          options={[["agree", "👍", "찬성", "처형합니다"], ["disagree", "👎", "반대", "살려둡니다"]]}
          onPick={(choice) => socket.emit("game_action", { type: "CAST_FINAL_VOTE", choice })} />
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function JudgeTiebreakView({ theme, state, socket }) {
  const candidates = (state.tiedNominees || []).map((id) => state.players.find((p) => p.id === id)).filter(Boolean);
  const isJudge = !!state.iAmActingJudge;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="judgetiebreak" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ textAlign: "center", fontSize: 14, color: theme.text, margin: "12px 0 16px" }}>
        투표가 동점이 나왔습니다. {isJudge ? "판사인 당신이 한 명을 직접 지명해주세요." : "판사가 동점자 중 한 명을 지명하고 있습니다..."}
      </p>
      {isJudge ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 8 }}>
          <VoteTileGrid theme={theme} players={candidates}
            onPick={(p) => socket.emit("game_action", { type: "CAST_JUDGE_TIEBREAK", targetId: p.id })} />
        </div>
      ) : (
        <RedactedNotice theme={theme} text={`동점자: ${candidates.map((p) => p.name).join(", ")}`} />
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function OfficialPickView({ theme, state, socket }) {
  const candidates = (state.myOfficialPickCandidates || []).map((id) => state.players.find((p) => p.id === id)).filter(Boolean);
  const isOfficial = candidates.length > 0;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="officialPick" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ textAlign: "center", fontSize: 14, color: theme.text, margin: "12px 0 16px" }}>
        {isOfficial ? "🗂️ [부정투표] 득표 상위 두 명 중, 최후 변론에 세울 사람을 직접 고르세요." : "🗂️ 개표가 진행되고 있습니다..."}
      </p>
      {isOfficial ? (
        <>
          <VoteTileGrid theme={theme} players={candidates} onPick={(p) => socket.emit("game_action", { type: "CAST_OFFICIAL_PICK", targetId: p.id })} />
          <p style={{ fontSize: 11.5, color: theme.sub, textAlign: "center", marginTop: 10 }}>
            {candidates.map((p) => `${p.name} ${state.myOfficialPickTally?.[p.id] ?? "?"}표`).join(" · ")} — 시간 안에 고르지 않으면 원래 투표 결과대로 진행됩니다.
          </p>
        </>
      ) : (
        <RedactedNotice theme={theme} text="잠시 후 결과가 발표됩니다." />
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function JudgeVerdictView({ theme, state, socket }) {
  const nominee = state.players.find((p) => p.id === state.nominee);
  const isJudge = !!state.iAmActingJudge;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="judgeverdict" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ textAlign: "center", fontSize: 14, color: theme.text, margin: "12px 0 16px" }}>
        <b>{nominee?.name}</b>님의 처형 여부를 {isJudge ? "판사인 당신이 단독으로 결정합니다." : "판사가 심의하고 있습니다..."}
      </p>
      {isJudge ? (
        <BigChoice theme={theme}
          options={[["agree", "🔨", "처형", "판사의 이름으로"], ["disagree", "🕊️", "방면", "이번엔 살려둡니다"]]}
          onPick={(choice) => socket.emit("game_action", { type: "CAST_JUDGE_VERDICT", choice })} />
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
      <div style={{ borderRadius: 5, padding: "20px 18px", textAlign: "center", background: theme.accentSoft, margin: "14px 0" }}>
        {eliminated ? (
          <>
            <div style={{ fontSize: 28 }}>⚖️</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>{eliminated.name}님이 마을에서 처형되었습니다</div>
            <div style={{ fontSize: 13, color: theme.sub }}>{eliminated.isMafia ? "마피아였습니다" : "마피아가 아니었습니다"}</div>
            {state.judgeRulingResult && (
              <div style={{ fontSize: 13, color: theme.text, marginTop: 8 }}>📜 판결문 — <b>{state.judgeRulingResult.name}</b>님의 직업은 <b>[{state.judgeRulingResult.roleLabel}]</b>였습니다</div>
            )}
            {state.terroristBombVictimName && (
              <div style={{ fontSize: 13, color: theme.text, marginTop: 8 }}>💣 테러리스트의 자폭으로 <b>{state.terroristBombVictimName}</b>님이 함께 목숨을 잃었습니다</div>
            )}
          </>
        ) : state.judgePleaResult ? (
          <>
            <div style={{ fontSize: 28 }}>⚖️🔒</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text, margin: "6px 0 2px" }}>사법거래 — {state.judgePleaResult.jailedName}님은 처형 대신 감옥에 수감되었습니다</div>
            <div style={{ fontSize: 13, color: theme.sub }}>{state.judgePleaResult.exposedName ? <>그 대가로 <b>{state.judgePleaResult.exposedName}</b>님의 정체 <b>[{state.judgePleaResult.exposedRoleLabel}]</b>가 공개되었습니다</> : "털어놓을 동료가 남아있지 않았습니다"}</div>
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

// 카드 슬라이드 애니메이션에 쓰는 keyframes - 방향키를 누를 때 카드가 옆으로 빠지고 새 카드가 반대편에서 들어온다.
const POWER_CARD_CSS = `
  @keyframes powerCardEnterRight { 0% { transform: translateX(60px) rotateY(25deg); opacity: 0; } 100% { transform: translateX(0) rotateY(0deg); opacity: 1; } }
  @keyframes powerCardEnterLeft { 0% { transform: translateX(-60px) rotateY(-25deg); opacity: 0; } 100% { transform: translateX(0) rotateY(0deg); opacity: 1; } }
  @keyframes powerCardGlow { 0%,100% { box-shadow: 0 0 24px rgba(232,196,104,0.35), 0 12px 40px rgba(0,0,0,0.5); } 50% { box-shadow: 0 0 38px rgba(232,196,104,0.6), 0 12px 40px rgba(0,0,0,0.5); } }
  @keyframes powerSealSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes powerModalPop { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
`;

function PowerSelectionView({ theme, state, socket }) {
  const cards = state.myPowerCardsOffered || [];
  const already = state.myPowerUpgrade;
  const [index, setIndex] = useState(0);
  const [enterDir, setEnterDir] = useState("right");
  const [confirmCard, setConfirmCard] = useState(null);

  const go = (delta) => {
    setEnterDir(delta > 0 ? "right" : "left");
    setIndex((i) => (i + delta + cards.length) % cards.length);
  };

  if (!cards.length) {
    return (
      <Card theme={theme}>
        <style>{POWER_CARD_CSS}</style>
        <PhaseHeader theme={theme} phase="powerSelection" label={PHASE_LABEL(state)} />
        <TimerDisplay theme={theme} seconds={state.timerSeconds} />
        <RedactedNotice theme={theme} text={state.myAlive && !state.isInJail ? "당신의 직업은 이번에 새로운 능력을 선택할 수 없습니다. 잠시만 기다려주세요." : "생존자들이 새로운 능력을 선택하는 중입니다. 잠시만 기다려주세요."} />
      </Card>
    );
  }

  if (already) {
    const chosen = cards.find((c) => c.id === already);
    return (
      <Card theme={theme}>
        <style>{POWER_CARD_CSS}</style>
        <PhaseHeader theme={theme} phase="powerSelection" label={PHASE_LABEL(state)} />
        <TimerDisplay theme={theme} seconds={state.timerSeconds} />
        <div style={{ textAlign: "center", padding: "18px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✨</div>
          <div style={{ fontSize: 13, color: theme.sub, marginBottom: 6 }}>새로운 능력을 확정했습니다</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 22, fontWeight: 800, color: "#E8C468" }}>{chosen?.title || "??"}</div>
          {chosen && <div style={{ fontSize: 12.5, color: theme.text, marginTop: 8, lineHeight: 1.6 }}>{chosen.desc}</div>}
        </div>
      </Card>
    );
  }

  const card = cards[index];

  return (
    <Card theme={theme}>
      <style>{POWER_CARD_CSS}</style>
      <PhaseHeader theme={theme} phase="powerSelection" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ fontSize: 12, color: theme.sub, textAlign: "center", margin: "4px 0 18px" }}>
        시간 안에 고르지 못하면 무작위로 하나가 자동 선택됩니다.
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, perspective: 900 }}>
        <button onClick={() => go(-1)} disabled={cards.length < 2}
          style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${theme.panelBorder}`,
            background: "rgba(0,0,0,0.25)", color: "#E8C468", fontSize: 18, cursor: cards.length > 1 ? "pointer" : "default",
            opacity: cards.length > 1 ? 1 : 0.3, flexShrink: 0 }}>
          ◀
        </button>

        <div key={card.id} style={{
          width: 260, minHeight: 300, borderRadius: 6, padding: "26px 20px", position: "relative", flexShrink: 0,
          background: "linear-gradient(160deg, #0e0c0b 0%, #1d1714 55%, #0e0c0b 100%)",
          border: "1.5px solid rgba(232,196,104,0.55)",
          animation: `powerCardGlow 2.6s ease-in-out infinite, ${enterDir === "right" ? "powerCardEnterRight" : "powerCardEnterLeft"} 0.35s ease-out`,
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", border: "1.5px dashed rgba(232,196,104,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14,
            animation: "powerSealSpin 12s linear infinite" }}>
            🃏
          </div>
          <div style={{ fontSize: 10.5, letterSpacing: 3, color: "rgba(232,196,104,0.7)", marginBottom: 6 }}>NEW POWER</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 21, fontWeight: 800, color: "#F1DFA8", marginBottom: 14 }}>
            {card.title}
          </div>
          <div style={{ height: 1, width: "60%", background: "rgba(232,196,104,0.35)", marginBottom: 14 }} />
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.7, flex: 1 }}>
            {card.desc}
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", marginTop: 14 }}>{index + 1} / {cards.length}</div>
          <button onClick={() => setConfirmCard(card)}
            style={{ marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 4, border: "1px solid rgba(232,196,104,0.7)",
              background: "rgba(232,196,104,0.14)", color: "#F1DFA8", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            이 능력 선택하기
          </button>
        </div>

        <button onClick={() => go(1)} disabled={cards.length < 2}
          style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${theme.panelBorder}`,
            background: "rgba(0,0,0,0.25)", color: "#E8C468", fontSize: 18, cursor: cards.length > 1 ? "pointer" : "default",
            opacity: cards.length > 1 ? 1 : 0.3, flexShrink: 0 }}>
          ▶
        </button>
      </div>

      {confirmCard && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setConfirmCard(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: "100%", maxWidth: 320, borderRadius: 5, padding: "24px 22px", textAlign: "center",
            background: "linear-gradient(160deg, #0e0c0b, #1d1714)", border: "1.5px solid rgba(232,196,104,0.6)",
            animation: "powerModalPop 0.18s ease-out",
          }}>
            <div style={{ fontSize: 15, color: "#fff", marginBottom: 18, lineHeight: 1.6 }}>
              [<b style={{ color: "#F1DFA8" }}>{confirmCard.title}</b>]을 선택하겠습니까?
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmCard(null)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 4, border: "1px solid rgba(255,255,255,0.25)",
                  background: "transparent", color: "rgba(255,255,255,0.75)", fontWeight: 700, cursor: "pointer" }}>
                거절
              </button>
              <button
                onClick={() => { socket.emit("game_action", { type: "CHOOSE_POWER_CARD", cardId: confirmCard.id }); setConfirmCard(null); }}
                style={{ flex: 1, padding: "10px 0", borderRadius: 4, border: "1px solid rgba(232,196,104,0.8)",
                  background: "rgba(232,196,104,0.85)", color: "#0e0c0b", fontWeight: 800, cursor: "pointer" }}>
                수락
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function SheriffElectionView({ theme, state, socket }) {
  const aliveCount = state.players.filter((p) => p.alive).length;
  const required = Math.ceil(aliveCount * 0.7);
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="sheriffElection" label={PHASE_LABEL(state)} />
      <MyAbilityResultsPanel theme={theme} state={state} />
      {state.sheriffJustJailedName ? (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(224,95,95,0.16)", marginBottom: 10, textAlign: "center", color: "#E05F5F", fontWeight: 700 }}>
          🚨 무고한 처형으로 <b>{state.sheriffJustJailedName}</b>님이 보안관 직위를 박탈당하고 감옥에 수감되었습니다.
        </div>
      ) : state.sheriffExecutionResult && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(232,196,104,0.14)", marginBottom: 10, textAlign: "center" }}>
          <b>{state.sheriffExecutionResult.targetName}</b>님이 {state.sheriffExecutionResult.byPriest ? "성직자의 이단심판으로" : "보안관에 의해"} 처형되었습니다 —
          {state.sheriffExecutionResult.wasMafia ? " 마피아팀이었습니다." : " 마피아팀이 아니었습니다."}
        </div>
      )}
      {state.dictatorResult && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(201,162,75,0.16)", marginBottom: 10, textAlign: "center" }}>
          🎩 정치인 <b>{state.dictatorResult.name}</b>님이 독재를 선포하고 보안관 자리를 차지했습니다.
        </div>
      )}
      {state.terroristBombVictimName && (
        <div style={{ borderRadius: 4, padding: "12px 14px", background: "rgba(217,123,62,0.14)", marginBottom: 10, textAlign: "center" }}>
          💣 테러리스트의 자폭으로 <b>{state.terroristBombVictimName}</b>님이 함께 목숨을 잃었습니다
        </div>
      )}
      <DayPowerPanels theme={theme} state={state} socket={socket} />
      <div style={{ textAlign: "center", margin: "10px 0 14px" }}>
        <div style={{ fontSize: 26 }}>⭐</div>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 16, fontWeight: 700, color: theme.text }}>
          마을에 보안관이 없습니다 — 보안관을 선출해야 합니다
        </div>
        <p style={{ fontSize: 12, color: theme.sub, marginTop: 4 }}>토론 후 투표로 보안관을 뽑습니다. 보안관은 낮에 한 명을 처형할 수 있는 권한을 갖게 돼요.</p>
      </div>
      {state.myAlive && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          borderRadius: 4, padding: "10px 14px", background: theme.accentSoft, marginBottom: 14 }}>
          <span style={{ fontSize: 12.5, color: theme.text }}>
            ⏭ 스킵 투표 · {state.skipVoteCount}/{aliveCount}명 ({required}명 이상이면 즉시 종료)
          </span>
          <Button theme={theme} variant={state.mySkippedVote ? "solid" : "subtle"} style={{ fontSize: 12, padding: "6px 14px", whiteSpace: "nowrap", flexShrink: 0 }}
            onClick={() => socket.emit("game_action", { type: "CAST_SKIP_VOTE" })}>
            {state.mySkippedVote ? "✓ 스킵 찬성함" : "스킵하기"}
          </Button>
        </div>
      )}
      {state.myAlive && !state.isBlockedChatter ? (
        <ChatPanel theme={theme} players={state.players} title="💬 채팅" messages={state.dayChat}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "day", text })} />
      ) : (
        <LiveChatFeed theme={theme} players={state.players} title="💬 채팅 (읽기 전용)" messages={state.dayChat} />
      )}
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <AutoNote theme={theme} text="시간이 지나면 자동으로 보안관 선출 투표가 시작됩니다." />
    </Card>
  );
}

function SheriffElectionVoteView({ theme, state, socket }) {
  const isRunoff = state.sheriffRunoffCandidates && state.sheriffRunoffCandidates.length > 0;
  const candidates = isRunoff
    ? alive(state.players).filter((p) => state.sheriffRunoffCandidates.includes(p.id))
    : alive(state.players);
  const voteEntries = Object.entries(state.sheriffElectionVotes || {});
  const votersFor = (targetId) => voteEntries
    .filter(([, t]) => t === targetId)
    .map(([voterId]) => state.players.find((p) => p.id === voterId))
    .filter(Boolean);
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="sheriffElectionVote" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      {isRunoff && (
        <div style={{ borderRadius: 4, padding: "10px 14px", background: "rgba(232,196,104,0.16)", margin: "10px 0", textAlign: "center" }}>
          <b>동점이 나와 재투표합니다</b> — 동점자만 후보로 남아요.
        </div>
      )}
      <p style={{ fontSize: 12.5, color: theme.sub, margin: "12px 0 8px", textAlign: "center" }}>
        보안관으로 뽑고 싶은 사람에게 투표하세요. (이 투표는 익명이 아니에요 — 누가 투표했는지 아래에 표시돼요)
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {candidates.map((p) => {
          const voters = votersFor(p.id);
          const selected = state.mySheriffElectionVote === p.id;
          return (
            <button key={p.id} onClick={() => socket.emit("game_action", { type: "CAST_SHERIFF_ELECTION_VOTE", targetId: p.id })}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                minWidth: 84, padding: "10px 12px", borderRadius: 5, cursor: "pointer",
                background: selected ? theme.accent : theme.accentSoft,
                border: `1.5px solid ${selected ? theme.accent : theme.panelBorder}`,
              }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: selected ? "#fff" : theme.text }}>{p.name}</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center", minHeight: 18 }}>
                {voters.map((v) => (
                  <PlayerAvatar key={v.id} theme={theme} player={v} size={18} />
                ))}
              </div>
              <span style={{ fontSize: 10.5, color: selected ? "rgba(255,255,255,0.85)" : theme.sub }}>{voters.length}표</span>
            </button>
          );
        })}
      </div>
      <AutoNote theme={theme} />
    </Card>
  );
}

function SheriffDefenseView({ theme, state, socket }) {
  const target = state.players.find((p) => p.id === state.sheriffDesignatedTarget);
  const isTarget = state.myId === state.sheriffDesignatedTarget;
  const canChat = isTarget || state.iAmVerdictActor;
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="sheriffDefense" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <div style={{ textAlign: "center", margin: "14px 0" }}>
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 18, fontWeight: 700, color: theme.text }}>{state.verdictByPriest ? "✝️" : "⚖️"} {target?.name}님의 최후 변론 시간입니다{state.verdictByPriest ? " (이단심판)" : ""}</div>
        <p style={{ fontSize: 12.5, color: theme.sub, marginTop: 6 }}>
          {!state.myAlive
            ? "사망하셨기 때문에 채팅에 참여할 수 없어요. 변론은 지켜볼 수 있어요."
            : canChat
            ? "치지직 채팅이나 아래 입력창으로 대화를 남겨주세요. 방송 화면에도 그대로 표시됩니다."
            : `${target?.name}님의 변론을 기다리는 중입니다.`}
        </p>
      </div>
      {state.myAlive && canChat && !state.isBlockedChatter ? (
        <ChatPanel theme={theme} players={state.players} title="💬 채팅" messages={state.dayChat}
          onSend={(text) => socket.emit("game_action", { type: "CHAT_SEND", channel: "day", text })} />
      ) : (
        <LiveChatFeed theme={theme} players={state.players} title="💬 채팅 (읽기 전용)" messages={state.dayChat} />
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

function SheriffVerdictView({ theme, state, socket }) {
  const target = state.players.find((p) => p.id === state.sheriffDesignatedTarget);
  return (
    <Card theme={theme}>
      <PhaseHeader theme={theme} phase="sheriffVerdict" label={PHASE_LABEL(state)} />
      <TimerDisplay theme={theme} seconds={state.timerSeconds} />
      <p style={{ textAlign: "center", fontSize: 14, color: theme.text, margin: "12px 0 16px" }}>
        <b>{target?.name}</b>님의 처형 여부를 {state.iAmVerdictActor ? "당신이 단독으로 결정합니다." : state.verdictByPriest ? "성직자가 이단심판하고 있습니다..." : "보안관이 심판하고 있습니다..."}
      </p>
      {state.iAmVerdictActor && state.myAlive ? (
        <>
          <p style={{ fontSize: 11.5, color: theme.sub, textAlign: "center", marginBottom: 10 }}>
            {state.verdictByPriest || state.myPowerUpgrade === "politician_dictator"
              ? "무고한 사람을 처형해도 당신은 감옥에 가지 않습니다."
              : "⚠️ 만약 이 사람이 마피아팀이 아니라면, 당신은 즉시 직위에서 해제되어 감옥에 갇히게 됩니다."}
          </p>
          <BigChoice theme={theme}
            options={[["execute", state.verdictByPriest ? "✝️" : "⭐", "처형", state.verdictByPriest ? "신의 이름으로" : "보안관의 권한으로"], ["release", "🕊️", "방면", "이번엔 살려둡니다"]]}
            onPick={(choice) => socket.emit("game_action", { type: "CAST_SHERIFF_VERDICT", choice })} />
        </>
      ) : (
        <RedactedNotice theme={theme} text="결과는 심판이 끝나면 공개됩니다." />
      )}
      <AutoNote theme={theme} />
    </Card>
  );
}

const NEUTRAL_WINNERS = ["cultist", "vampire", "thief", "werewolf"];
function winnerLabel(winner) {
  if (winner === "mafia") return { icon: "🗡️", text: "마피아 팀 승리" };
  if (winner === "mercenary") return { icon: "🗡️", text: "용병 & 건달 동맹 승리" };
  if (NEUTRAL_WINNERS.includes(winner)) return { icon: "🎭", text: "중립팀 승리" };
  return { icon: "🌾", text: "시민 팀 승리" };
}

const LABEL_TEAM = Object.fromEntries(Object.values(ROLE_GUIDE).map((r) => [r.label, r.team]));

/** 서버의 didPlayerWin과 같은 기준으로 "내가 이겼는지"를 판정한다 (전적 기록과 일치하도록). */
function didIWin(state) {
  const w = state.winner;
  if (!w || !state.myRole) return null;
  if (state.myIsThrall) return w === "vampire";
  if (state.myRole === "vampire") return w === "vampire";
  if (state.myRole === "cultist" || state.myRole === "thief") return state.myRole === w;
  if (state.myRole === "werewolf") return state.myIsWolfAllied ? w === "mafia" : w === "werewolf";
  if (state.myRole === "cat") return state.myCatAlignment ? w === state.myCatAlignment : false;
  if (state.myRole === "mercenary") {
    const c = state.myMercenaryContactedBy;
    return c === "mafia" ? w === "mafia" : c === "police" ? w === "citizen" : c === "soldier" ? w === "mercenary" : false;
  }
  if (state.myRole === "soldier" && state.myPairedWithMercenary) return w === "mercenary";
  if (state.myTeam === "mafia") return w === "mafia";
  if (state.myTeam === "citizen") return w === "citizen";
  return false;
}

function GameOverView({ theme, state, isAdmin, socket, honorGivenTo, warnedPlayerIds }) {
  const { mode } = useGameLayout();
  const desktop = mode === "desktop";
  const w = winnerLabel(state.winner);
  const honorTargetName = honorGivenTo ? state.players.find((p) => p.id === honorGivenTo)?.name : null;
  const iWon = didIWin(state);
  const groups = [
    ["mafia", "🗡️ 마피아팀", "#C4323A"], ["citizen", "🌾 시민팀", "#6E9FD8"], ["neutral", "😈 중립", "#9C7BC9"],
  ].map(([key, title, color]) => ({
    key, title, color,
    players: state.players.filter((p) => (p.isThrall ? "neutral" : LABEL_TEAM[p.roleLabel] || "citizen") === key),
  })).filter((g) => g.players.length > 0);
  const aliveCount = state.players.filter((p) => p.alive && !p.inJail).length;

  const hero = (
    <Card theme={theme} style={{ padding: desktop ? "22px 26px" : "18px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 120% at 12% 50%, ${theme.accentSoft}, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: desktop ? 22 : 14, flexWrap: "wrap" }}>
        <div style={{ fontSize: desktop ? 64 : 46, filter: "drop-shadow(0 0 16px rgba(0,0,0,0.9))" }}>{w.icon}</div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 11, letterSpacing: "0.3em", color: theme.accent }}>■ CASE CLOSED · {state.dayNumber}일차</div>
          <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: desktop ? 36 : 26, fontWeight: 900, color: theme.text, lineHeight: 1.2 }}>{w.text}</div>
          <div style={{ fontSize: 12.5, color: theme.sub, marginTop: 4 }}>모든 플레이어의 직업이 공개되었습니다 · 생존 {aliveCount}명 / {state.players.length}명</div>
        </div>
        {iWon !== null && (
          <div style={{ textAlign: "center", padding: desktop ? "12px 22px" : "8px 14px", borderRadius: 3,
            border: `2px solid ${iWon ? "#E8C468" : "rgba(160,160,160,0.5)"}`, background: iWon ? "rgba(232,196,104,0.14)" : "rgba(0,0,0,0.35)",
            transform: "rotate(-3deg)" }}>
            <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10.5, letterSpacing: "0.25em", color: iWon ? "#E8C468" : theme.sub }}>MY RESULT</div>
            <div style={{ fontFamily: "'Noto Serif KR', serif", fontSize: desktop ? 30 : 22, fontWeight: 900, color: iWon ? "#F1DFA8" : theme.sub }}>{iWon ? "승리" : "패배"}</div>
            <div style={{ fontSize: 11.5, color: theme.sub }}>{state.myRoleLabel}</div>
          </div>
        )}
      </div>
    </Card>
  );

  const roster = (
    <Card theme={theme} style={{ padding: "14px 16px", ...(desktop ? { flex: 1, minHeight: 0, overflowY: "auto" } : {}) }}>
      <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10.5, letterSpacing: "0.25em", color: theme.accent, marginBottom: 10 }}>FINAL REPORT · 최종 명단</div>
      <div style={{ display: "grid", gridTemplateColumns: desktop ? `repeat(${groups.length}, minmax(0, 1fr))` : "1fr", gap: 12 }}>
        {groups.map((g) => (
          <div key={g.key}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 800, color: theme.text, borderBottom: `2px solid ${g.color}`, paddingBottom: 4, marginBottom: 6 }}>
              <span>{g.title}</span><span style={{ color: theme.sub, fontWeight: 400 }}>{g.players.length}명</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {g.players.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 2,
                  background: p.id === state.myId ? theme.accentSoft : "rgba(0,0,0,0.3)", borderLeft: `2px solid ${g.color}` }}>
                  <PlayerAvatar theme={theme} player={{ ...p, alive: true }} size={28} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}{p.id === state.myId && <span style={{ color: theme.sub, fontWeight: 400 }}> (나)</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: g.color, fontWeight: 700 }}>{p.roleLabel}{p.isThrall ? " · 흡혈귀화" : ""}</div>
                  </div>
                  <span style={{ fontSize: 10.5, color: p.alive && !p.inJail ? "#8FBF6A" : theme.sub, whiteSpace: "nowrap" }}>
                    {p.inJail ? "🔒 감옥" : p.alive ? "생존" : "💀 사망"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const honor = state.myId ? (
    <Card theme={theme} style={{ padding: "14px 16px" }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: theme.text, marginBottom: 4 }}>🏅 명예 선물하기</div>
      {honorGivenTo ? (
        <p style={{ fontSize: 12.5, color: theme.sub, margin: 0 }}>
          <b style={{ color: theme.text }}>{honorTargetName}</b>님에게 명예를 선물했습니다. 열심히 잘 플레이해주셔서 감사해요!
        </p>
      ) : (
        <>
          <p style={{ fontSize: 12, color: theme.sub, margin: "0 0 10px" }}>이번 판을 열심히, 재미있게 플레이한 사람에게 명예 1점을 선물하세요. 게임당 한 명에게만 줄 수 있어요.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: 6 }}>
            {state.players.filter((p) => p.id !== state.myId).map((p) => (
              <button key={p.id} onClick={() => socket.emit("give_honor", p.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px",
                borderRadius: 2, cursor: "pointer", color: theme.text, background: "rgba(0,0,0,0.3)", border: `1px solid ${theme.panelBorder}` }}>
                <PlayerAvatar theme={theme} player={{ ...p, alive: true }} size={30} />
                <span style={{ fontSize: 12, fontWeight: 700, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  ) : null;

  const admin = isAdmin ? (
    <Card theme={theme} style={{ padding: "14px 16px", border: "1px solid rgba(224,95,95,0.35)" }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: theme.text, marginBottom: 4 }}>🚨 경고 주기 <span style={{ fontSize: 11, color: theme.sub, fontWeight: 400 }}>(관리자 전용)</span></div>
      <p style={{ fontSize: 12, color: theme.sub, margin: "0 0 10px" }}>문제를 일으킨 참여자에게 경고를 줄 수 있어요. 경고가 3회 누적되면 게임 참여가 제한됩니다.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {state.players.map((p) => {
          const alreadyWarned = warnedPlayerIds?.includes(p.id);
          return (
            <Chip key={p.id} theme={theme} label={alreadyWarned ? `${p.name} ✓ 경고함` : p.name}
              selected={alreadyWarned} onClick={alreadyWarned ? undefined : () => socket.emit("give_warning", p.id)} />
          );
        })}
      </div>
      <Button theme={theme} onClick={() => socket.emit("admin_reset_game")} style={{ width: "100%", padding: "12px 0", fontSize: 15 }}>🎬 새 게임 준비하기</Button>
    </Card>
  ) : null;

  if (desktop) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
        {hero}
        <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 30%)", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>{roster}</div>
          <div className="noir-col" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {honor}
            {admin}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {hero}
      {honor}
      {roster}
      {admin}
    </div>
  );
}

export default function GamePage({ state, socket, isAdmin, streamerMode, testMode, viewingAsId, rosterForTest, honorGivenTo, warnedPlayerIds }) {
  const theme = noirThemeForPhase(state.phase);
  const prevPhaseRef = useRef(null);
  const [guesses, setGuesses] = useState({}); // { [playerId]: "역할명" } - 개인 추측 메모, 새로고침하면 초기화됨
  const [guessTargetId, setGuessTargetId] = useState(null); // 지금 팝업이 열려있는 대상 플레이어 id

  const prevIdolMessageRef = useRef(state.idolMessage?.text || null);
  useEffect(() => {
    const prevText = prevIdolMessageRef.current;
    const nextText = state.idolMessage?.text || null;
    prevIdolMessageRef.current = nextText;
    if (nextText && nextText !== prevText) phaseSound("phishing", playPhishingAlert);
  }, [state.idolMessage?.text]);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    // 게임이 막 시작돼 직업 확인 화면이 처음 뜰 때는 이전 단계가 없어도 연출음을 울린다.
    if (prev === null && state.phase === "reveal") { playPlayerSample("role_reveal"); return; }
    if (prev === null || prev === state.phase) return; // 첫 렌더 또는 같은 단계 재렌더링이면 스킵

    const p = state.phase;
    if (p === "reveal") {
      playPlayerSample("role_reveal");
    } else if (p === "night") {
      phaseSound("night_fall", playNightFall);
    } else if (p === "morning") {
      phaseSound("day_break", playDayBreak);
      // 아침 종소리가 어느 정도 울린 뒤에 밤사이 사건 소리를 이어 붙인다.
      if (state.lastNightDeath) setTimeout(() => phaseSound("night_death", playMafiaKill), 1500);
      else if (state.nightSaveHappened) setTimeout(() => phaseSound("doctor_save", playDoctorSave), 1500);
    } else if (p === "powerSelection") {
      playPlayerSample("power_select");
    } else if (p === "sheriffElection") {
      phaseSound("sheriff_needed");
    } else if (p === "vote" || p === "finalvote" || p === "sheriffElectionVote") {
      phaseSound("vote_start", playVote);
    } else if (p === "defense" || p === "sheriffDefense") {
      playPlayerSample("defense_start");
    } else if (p === "judgetiebreak" || p === "officialPick" || p === "judgeverdict" || p === "sheriffVerdict") {
      playPlayerSample("final_agree", { gain: 0.8 });
    } else if (p === "voteresult") {
      if (state.lastEliminated) phaseSound("execution", playElimination);
      else phaseSound("vote_result");
    } else if (p === "gameover") {
      phaseSound(WIN_SOUNDS[state.winner] || "win_citizen");
    }
  }, [state.phase]);

  const isDesktop = useIsDesktop();
  const [chatEl, setChatEl] = useState(null);
  const [chatCount, setChatCount] = useState(0);
  const [tab, setTab] = useState("action");
  const focusPhase = state.phase === "reveal" || state.phase === "gameover";
  // 투표처럼 채팅 없이 한 가지 행동에 집중하는 단계 - 채팅창 자리를 행동 화면이 통째로 차지한다.
  const mobileActionShowsPhaseView = ["night", "powerSelection"].includes(state.phase);
  const fullActionPhase = ["vote", "finalvote", "sheriffElectionVote", "judgetiebreak", "officialPick", "judgeverdict", "sheriffVerdict", "voteresult", "morning", "powerSelection"].includes(state.phase);
  // [정신 지배]를 당한 밤에는 모든 채팅방의 입력창을 막고 이유를 보여준다.
  const chatDisabledReason = state.phase === "night" && state.myMindControlledTonight
    ? "마녀에게 정신을 지배당해 오늘 밤은 어떤 채팅도 칠 수 없습니다. 대화는 읽을 수 있어요." : null;
  const mobileChatShowsPhaseView = fullActionPhase && state.phase !== "powerSelection";
  const layoutValue = useMemo(() => ({ mode: isDesktop ? "desktop" : "mobile", chatEl: focusPhase ? null : chatEl, topTimer: true, chatDisabledReason }),
    [isDesktop, chatEl, focusPhase, chatDisabledReason]);

  // ── 채팅방 탭: 채팅창들이 스스로 등록하고, 여러 개면 탭으로 한 방씩 보여준다 ──
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [seenCounts, setSeenCounts] = useState({});
  const upsertRoom = useCallback((key, title, count) => setRooms((rs) => {
    const i = rs.findIndex((r) => r.key === key);
    if (i < 0) return [...rs, { key, title, count }];
    if (rs[i].count === count && rs[i].title === title) return rs;
    const next = [...rs]; next[i] = { key, title, count }; return next;
  }), []);
  const removeRoom = useCallback((key) => setRooms((rs) => (rs.some((r) => r.key === key) ? rs.filter((r) => r.key !== key) : rs)), []);
  const currentRoom = rooms.some((r) => r.key === activeRoom) ? activeRoom : rooms[0]?.key || null;
  const isRoomVisible = useCallback((key) => rooms.length <= 1 || (isDesktop && showAllRooms) || key === currentRoom, [rooms.length, isDesktop, showAllRooms, currentRoom]);
  const chatAreaOnScreen = !focusPhase && (isDesktop || tab === "chat");
  useEffect(() => {
    setSeenCounts((seen) => {
      let changed = false;
      const next = { ...seen };
      rooms.forEach((r) => {
        // 처음 나타난 방은 기존 대화를 "읽음"으로 시작하고, 지금 화면에 보이는 방은 계속 읽음 처리한다.
        if (next[r.key] === undefined || (chatAreaOnScreen && isRoomVisible(r.key) && next[r.key] !== r.count)) {
          if (next[r.key] !== r.count) { next[r.key] = r.count; changed = true; }
        }
      });
      return changed ? next : seen;
    });
  }, [rooms, chatAreaOnScreen, isRoomVisible]);
  const unreadOf = (r) => Math.max(0, r.count - (seenCounts[r.key] ?? r.count));
  const roomsValue = useMemo(() => ({ upsert: upsertRoom, remove: removeRoom, isVisible: isRoomVisible }), [upsertRoom, removeRoom, isRoomVisible]);

  // 채팅 영역에 실제로 몇 개의 채팅창이 들어와 있는지 추적한다 (없으면 안내 + 낮 채팅 기록을 대신 보여준다).
  useEffect(() => {
    if (!chatEl) { setChatCount(0); return undefined; }
    const update = () => setChatCount(chatEl.childElementCount);
    update();
    const mo = new MutationObserver(update);
    mo.observe(chatEl, { childList: true });
    return () => mo.disconnect();
  }, [chatEl]);

  // 모바일: 단계가 바뀌면 "행동" 탭으로 돌아가고, 안 읽은 채팅이 있으면 채팅 탭에 표시한다.
  // 모바일: 밤·능력 선택은 "행동" 탭, 그 밖의 낮 진행(토론·투표·결과)은 "채팅" 탭으로 자동 이동한다.
  useEffect(() => { setTab(["night", "powerSelection", "reveal", "gameover"].includes(state.phase) ? "action" : "chat"); }, [state.phase]);
  const history = useAbilityHistory(state);
  const unreadChat = tab !== "chat" && rooms.some((r) => unreadOf(r) > 0);

  const rosterPlayers = useMemo(() => (state.players ? state.players.map((p) => {
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
                // 경찰이 대부의 영입 시도를 막아내며 발각한 정체
                if (state.myRole === "police" && state.myPoliceFindings?.[p.id]) {
                  next = { ...next, roleLabel: next.roleLabel || state.myPoliceFindings[p.id] };
                }
                // 용병과 접선한(경찰/건달) 사람은 용병의 정체를 확실히 알아본다.
                if (state.myMercenaryFindings?.[p.id]) {
                  next = { ...next, roleLabel: next.roleLabel || state.myMercenaryFindings[p.id] };
                }
                // 마피아팀끼리는 서로의 정확한 직업을 알아본다 (동맹한 늑대인간, 마피아 편입 고양이 포함).
                if (state.myTeam === "mafia" || state.myIsWolfAllied || state.myCatAlignment === "mafia" || state.myRecruitedToMafia) {
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
              }) : []), // 채팅만 바뀔 때는 목록을 다시 만들지 않도록, 실제로 쓰는 필드만 의존한다
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [state.myCatAlignment, state.myIsThrall, state.myIsWolfAllied, state.myMercenaryFindings, state.myPoliceFindings, state.myPriestFindings, state.myRecruitedToMafia, state.myRole, state.mySpyFindings, state.myStolenFrom, state.myTeam, state.myUndertakerFindings, state.players, state.teammates, state.vampireTeammates, guesses]);
  const roster = <PlayerRoster theme={theme} variant="list" players={rosterPlayers} teamCounts={state.teamCounts} onPlayerClick={setGuessTargetId} />;
  const rosterGrid = <PlayerRoster theme={theme} variant="grid" players={rosterPlayers} teamCounts={state.teamCounts} onPlayerClick={setGuessTargetId} />;

  const phaseView = (
    <>
        {state.phase === "reveal" && <RevealView theme={theme} state={state} socket={socket} />}
        {state.phase === "night" && <NightView theme={theme} state={state} socket={socket} />}
        {state.phase === "morning" && <MorningView theme={theme} state={state} />}
        {state.phase === "powerSelection" && <PowerSelectionView theme={theme} state={state} socket={socket} />}
        {state.phase === "discussion" && <DiscussionView theme={theme} state={state} socket={socket} />}
        {state.phase === "vote" && <VoteView theme={theme} state={state} socket={socket} />}
        {state.phase === "defense" && <DefenseView theme={theme} state={state} socket={socket} />}
        {state.phase === "judgetiebreak" && <JudgeTiebreakView theme={theme} state={state} socket={socket} />}
        {state.phase === "officialPick" && <OfficialPickView theme={theme} state={state} socket={socket} />}
        {state.phase === "judgeverdict" && <JudgeVerdictView theme={theme} state={state} socket={socket} />}
        {state.phase === "finalvote" && <FinalVoteView theme={theme} state={state} socket={socket} />}
        {state.phase === "voteresult" && <VoteResultView theme={theme} state={state} />}
        {state.phase === "sheriffElection" && <SheriffElectionView theme={theme} state={state} socket={socket} />}
        {state.phase === "sheriffElectionVote" && <SheriffElectionVoteView theme={theme} state={state} socket={socket} />}
        {state.phase === "sheriffDefense" && <SheriffDefenseView theme={theme} state={state} socket={socket} />}
        {state.phase === "sheriffVerdict" && <SheriffVerdictView theme={theme} state={state} socket={socket} />}
        {state.phase === "gameover" && <GameOverView theme={theme} state={state} isAdmin={isAdmin} socket={socket} honorGivenTo={honorGivenTo} warnedPlayerIds={warnedPlayerIds} />}
    </>
  );

  const newsPanel = isDesktop && NEWS_PHASES.includes(state.phase) ? <NightSummaryBanner theme={theme} state={state} inSidebar /> : null;
  const myInfo = (
    <MyInfoPanel theme={theme} state={state} news={newsPanel} hideResults={!isDesktop}>
      {state.myRole === "conartist" && state.myDisguisedAs && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: "rgba(232,196,104,0.14)", border: "1px solid rgba(232,196,104,0.4)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.text, marginBottom: 4 }}>🎭 현재 위장 상태 (게임 내내 고정)</div>
            {state.myConartistDisguiseResult && (
              <p style={{ fontSize: 11.5, color: theme.sub, margin: "0 0 4px" }}>
                <b style={{ color: theme.text }}>{state.myConartistDisguiseResult.targetName}</b>님의 정체를 확인하고 그 모습으로 위장했습니다.
              </p>
            )}
            <p style={{ fontSize: 14, color: theme.text, fontWeight: 600, margin: 0 }}>
              지금 당신은 <b>[{state.myDisguisedAs}]</b>(으)로 위장한 상태입니다.
            </p>
          </div>
        </div>
      )}
      {state.myRole === "mercenary" && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: "rgba(183,90,90,0.14)", border: "1px solid rgba(183,90,90,0.4)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.text, marginBottom: 4 }}>🗡️ 용병 상태</div>
            <p style={{ fontSize: 14, color: theme.text, fontWeight: 600, margin: 0 }}>
              {!state.myMercenaryContactedBy && state.myMercenaryPendingContacts?.length > 0
                ? "여러 곳에서 동시에 접선 요청이 왔습니다. 낮에 그중 하나를 직접 고를 수 있어요."
                : !state.myMercenaryContactedBy
                ? "아직 아무에게도 의뢰를 받지 못했습니다. 경찰의 조사, 마피아의 습격, 건달의 협박 중 하나를 받으면 접선하게 됩니다."
                : state.myMercenaryContactedBy === "mafia"
                ? "마피아와 접선했습니다. 이제 마피아팀 소속이며, 매일 밤 한 명씩 죽일 수 있습니다."
                : state.myMercenaryContactedBy === "police"
                ? "경찰과 접선했습니다. 이제 시민팀 소속이며, 매일 밤 한 명씩 죽일 수 있습니다."
                : "건달과 접선했습니다. 이제 건달과 함께 중립으로 활동하며, 매일 밤 한 명씩 죽일 수 있습니다."}
            </p>
          </div>
        </div>
      )}
      {state.myRole === "soldier" && state.myPairedWithMercenary && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: "rgba(183,90,90,0.14)", border: "1px solid rgba(183,90,90,0.4)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.text, marginBottom: 4 }}>🗡️ 건달 상태</div>
            <p style={{ fontSize: 14, color: theme.text, fontWeight: 600, margin: 0 }}>
              용병과 접선해 중립으로 전향했습니다. 기존 협박 능력 대신, 매일 밤 한 명씩 죽일 수 있습니다.
            </p>
          </div>
        </div>
      )}
      {state.myPowerUpgradeCard && state.phase !== "powerSelection" && state.phase !== "gameover" && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: "rgba(232,196,104,0.1)", border: "1px solid rgba(232,196,104,0.4)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#E8C468", marginBottom: 4 }}>🃏 새로운 능력 · {state.myPowerUpgradeCard.title}</div>
            <p style={{ fontSize: 12.5, color: theme.text, margin: 0, lineHeight: 1.6 }}>{state.myPowerUpgradeCard.desc}</p>
          </div>
        </div>
      )}
      {state.myRole === "thief" && state.phase !== "reveal" && state.phase !== "gameover" && (
        <div style={{ marginTop: 10 }}>
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

      {(state.myRole === "official" || state.myConartistLegendRole === "official") && state.phase !== "reveal" && state.phase !== "gameover" && (
        <div style={{ marginTop: 10 }}>
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

    </MyInfoPanel>
  );

  const adminButtons = isAdmin && (
    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
      <Button theme={theme} variant="ghost" style={{ fontSize: 11.5, padding: "5px 10px" }} onClick={() => socket.emit("admin_force_skip")}>⏭{isDesktop ? " 다음 단계" : ""}</Button>
      {state.phase !== "gameover" && (
        <Button theme={theme} variant="ghost" style={{ fontSize: 11.5, padding: "5px 10px", borderColor: "#E85D5D", color: "#E85D5D" }}
          onClick={() => {
            if (window.confirm("게임을 지금 즉시 강제 종료할까요?\n모든 참여자가 대기실로 돌아가고, 진행 중인 게임 정보는 사라집니다.")) {
              socket.emit("admin_reset_game");
            }
          }}>
          ⛔{isDesktop ? " 강제종료" : ""}
        </Button>
      )}
    </div>
  );

  const chatColumn = (
    <>
      {rooms.length > 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8, alignItems: "center" }}>
          {rooms.map((r) => {
            const active = !(isDesktop && showAllRooms) && r.key === currentRoom;
            const unread = unreadOf(r);
            return (
              <button key={r.key} onClick={() => { setActiveRoom(r.key); setShowAllRooms(false); }}
                style={{ position: "relative", padding: "6px 10px", borderRadius: 2, fontSize: 12, fontWeight: active ? 800 : 600, cursor: "pointer",
                  color: active ? theme.text : theme.sub, background: active ? theme.accentSoft : "rgba(0,0,0,0.35)",
                  border: `1px solid ${active ? theme.accent : theme.panelBorder}`, whiteSpace: "nowrap" }}>
                {r.title.replace(/ 채팅$/, "")}
                {unread > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: "#fff", background: "#C4323A", borderRadius: 8, padding: "0 5px" }}>{unread > 99 ? "99+" : unread}</span>
                )}
              </button>
            );
          })}
          {isDesktop && (
            <button onClick={() => setShowAllRooms((v) => !v)} style={{ marginLeft: "auto", padding: "5px 8px", fontSize: 11, cursor: "pointer", borderRadius: 2,
              color: showAllRooms ? theme.text : theme.sub, background: "transparent", border: `1px dashed ${theme.panelBorder}` }}>
              {showAllRooms ? "하나씩 보기" : "모두 펼치기"}
            </button>
          )}
        </div>
      )}
      <div ref={setChatEl} style={{ display: chatCount > 0 ? "flex" : "none", flexDirection: "column", gap: 10, flex: 1, minHeight: 0 }} />
      {chatCount === 0 && (
        <>
          <div style={{ fontSize: 12, color: theme.sub, padding: "10px 12px", border: `1px dashed ${theme.panelBorder}`, borderRadius: 2, marginBottom: 10, background: "rgba(0,0,0,0.25)" }}>
            💬 지금은 참여할 수 있는 채팅방이 없어요. 아래는 낮 채팅 기록입니다.
          </div>
          <LiveChatFeed theme={theme} players={state.players} title="낮 채팅 기록" messages={state.dayChat || []} emptyText="아직 채팅이 없습니다." inline="fill" />
        </>
      )}
    </>
  );

  const shellStyle = { background: theme.bg, backgroundAttachment: "fixed", transition: "background 0.8s ease" };
  const globalCss = (
    <style>{`
      * { box-sizing: border-box; }
      input, button, textarea { font-family: inherit; }
      .noir-col { overflow-y: auto; min-height: 0; scrollbar-width: thin; scrollbar-color: rgba(200,165,90,0.25) transparent; }
      .noir-col::-webkit-scrollbar { width: 6px; } .noir-col::-webkit-scrollbar-thumb { background: rgba(200,165,90,0.25); border-radius: 3px; }
      .noir-roster-row:hover { background: rgba(255,255,255,0.05) !important; }
      .noir-fill > .noir-card:last-child { flex: 1 0 auto; }
      @keyframes noirSlideL { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
      @keyframes noirSlideR { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: none; } }
    `}</style>
  );

  // 30초 알림은 매초 바뀌는 남은 시간을 구독해야 하므로, 화면 전체가 아니라 이 작은 컴포넌트만 다시 그려지게 따로 뺐다.
  const chatReminderBanner = <ChatReminderBanner state={state} showGo={!isDesktop} onGo={() => setTab("action")} />;

  const topBar = (
    <GameTopBar theme={theme} state={state} compact={!isDesktop} right={adminButtons} />
  );

  return (
    <GameLayoutContext.Provider value={layoutValue}>
    <ChatRoomsContext.Provider value={roomsValue}>
      {globalCss}
      {isDesktop ? (
        <div style={{ ...shellStyle, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {topBar}
          {focusPhase ? (
            <div className={state.phase === "gameover" ? undefined : "noir-col"} style={{ flex: 1, minHeight: 0, padding: state.phase === "gameover" ? "12px 14px 14px" : "20px 24px 40px", display: "flex", flexDirection: "column" }}>
              <div style={state.phase === "gameover" ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" } : { maxWidth: 760, margin: "0 auto", width: "100%" }}>
      {isAdmin && testMode && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: theme.panel, border: `1px solid ${theme.panelBorder}`, backdropFilter: "blur(6px)" }}>
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

                {phaseView}
              </div>
            </div>
          ) : (
            <div className="noir-desk" style={{ flex: 1, minHeight: 0, width: "100%", padding: "12px 14px 14px",
              display: "grid", gap: 12, gridTemplateColumns: "minmax(260px, 20%) minmax(0, 1fr) minmax(340px, 26%)" }}>
              <aside className="noir-col noir-fill" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {myInfo}
                <Card theme={theme} style={{ padding: "12px 12px" }}>{roster}</Card>
              </aside>
              <div style={{ display: "flex", flexDirection: "column", minHeight: 0, gap: 12 }}>
                {fullActionPhase ? (
                  <main className="noir-col noir-fill" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {isAdmin && testMode && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: theme.panel, border: `1px solid ${theme.panelBorder}`, backdropFilter: "blur(6px)" }}>
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

      {state.idolMessage && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: "rgba(120,170,232,0.14)", border: "1px solid rgba(120,170,232,0.4)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#78AAE8", marginBottom: 4 }}>📧 알 수 없는 발신번호</div>
            <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{state.idolMessage.text}</div>
          </div>
        </div>
      )}
                    {phaseView}
                  </main>
                ) : (
                  <>
                    <main className="noir-col" style={{ flex: "0 1 auto", maxHeight: "58%", display: "flex", flexDirection: "column" }}>
      {isAdmin && testMode && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: theme.panel, border: `1px solid ${theme.panelBorder}`, backdropFilter: "blur(6px)" }}>
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

      {state.idolMessage && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: "rgba(120,170,232,0.14)", border: "1px solid rgba(120,170,232,0.4)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#78AAE8", marginBottom: 4 }}>📧 알 수 없는 발신번호</div>
            <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{state.idolMessage.text}</div>
          </div>
        </div>
      )}
                      {phaseView}
                    </main>
                    <section style={{ flex: "1 1 0", minHeight: 240, display: "flex", flexDirection: "column" }}>
                      {chatReminderBanner}
                      {chatColumn}
                    </section>
                  </>
                )}
              </div>
              <aside style={{ minHeight: 0, display: "flex" }}>
                <Card theme={theme} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "12px 12px" }}>
                  <RoleGuide theme={theme} myRole={state.myRole} style={{ flex: 1 }} />
                </Card>
              </aside>
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...shellStyle, minHeight: "100vh", paddingBottom: focusPhase ? 40 : 84 }}>
          {topBar}
          <div style={{ padding: "12px 12px 0" }}>
            <div style={{ display: focusPhase || tab === "action" ? "block" : "none" }}>
      {isAdmin && testMode && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: theme.panel, border: `1px solid ${theme.panelBorder}`, backdropFilter: "blur(6px)" }}>
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

      {state.idolMessage && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ borderRadius: 5, padding: "12px 16px", background: "rgba(120,170,232,0.14)", border: "1px solid rgba(120,170,232,0.4)" }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#78AAE8", marginBottom: 4 }}>📧 알 수 없는 발신번호</div>
            <div style={{ fontSize: 14, color: theme.text, fontWeight: 600 }}>{state.idolMessage.text}</div>
          </div>
        </div>
      )}
              {focusPhase ? phaseView : (
                <>
                  {myInfo}
                  <MyAbilityStatus theme={theme} state={state} history={history} />
                  {mobileActionShowsPhaseView ? phaseView : (state.phase === "discussion" || state.phase === "sheriffElection") ? (
                    <Card theme={theme} style={{ padding: "14px 14px" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.accent, marginBottom: 10 }}>🎯 오늘 낮에 쓸 수 있는 능력</div>
                      <DayAbilityPanels theme={theme} state={state} socket={socket} />
                      <DayAbilityEmptyNote theme={theme} state={state} />
                    </Card>
                  ) : (
                    <div style={{ fontSize: 12.5, color: theme.sub, textAlign: "center", padding: "18px 10px", border: `1px dashed ${theme.panelBorder}`, borderRadius: 3 }}>
                      지금은 사용할 수 있는 직업 능력이 없어요. 투표와 진행 상황은 💬 채팅 탭에서 확인하세요.
                    </div>
                  )}
                </>
              )}
            </div>
            {!focusPhase && (
              <>
                <div style={{ display: tab === "chat" ? "flex" : "none", flexDirection: "column", height: mobileChatShowsPhaseView ? "auto" : "calc(100dvh - 150px)", minHeight: 320 }}>
                  {chatReminderBanner}
                  {NEWS_PHASES.includes(state.phase) && <NewsCarousel theme={theme} items={nightNewsItems(state)} />}
                  {(state.phase === "defense" || state.phase === "sheriffDefense") && <DefenseBanner theme={theme} state={state} />}
                  <IntelDrawer theme={theme} state={state} rosterPlayers={rosterPlayers} onPlayerClick={setGuessTargetId} />
                  {(state.phase === "discussion" || state.phase === "sheriffElection") && state.myAlive && !state.isInJail && (
                    <SkipVoteBar theme={theme} state={state} socket={socket} />
                  )}
                  {mobileChatShowsPhaseView ? phaseView : chatColumn}
                </div>
                <div style={{ display: tab === "guide" ? "block" : "none" }}>
                  <Card theme={theme} style={{ padding: "12px 12px", height: "calc(100dvh - 150px)", display: "flex", flexDirection: "column" }}>
                    <RoleGuide theme={theme} myRole={state.myRole} style={{ flex: 1 }} />
                  </Card>
                </div>
                {/* 채팅창은 각 단계 화면 안에서 만들어져 채팅 탭으로 옮겨지므로, 행동 탭에 그리지 않는 단계에도 화면 자체는 숨겨서 붙여 둔다 */}
                {!mobileActionShowsPhaseView && !mobileChatShowsPhaseView && <div style={{ display: "none" }}>{phaseView}</div>}
              </>
            )}
          </div>
          {!focusPhase && <MobileTabBar theme={theme} tab={tab} setTab={setTab} unreadChat={unreadChat} state={state} />}
        </div>
      )}

      <ActionReminderLayer theme={theme} state={state} showGo={!isDesktop && tab !== "action"} onGo={() => setTab("action")} />
      {guessTargetId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 60,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setGuessTargetId(null)}>
          <div style={{ width: "100%", maxWidth: 420, maxHeight: "80vh", overflowY: "auto", borderRadius: 6,
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
    </ChatRoomsContext.Provider>
    </GameLayoutContext.Provider>
  );
}

/** 모든 단계에서 맨 위에 붙어 있는 상단 바 - 날짜/단계, 남은 시간, 내 직업을 한눈에 */
function GameTopBar({ theme, state, compact, right }) {
  const statusLabel = !state.myRoleLabel ? "관전" : state.isInJail ? "🔒 감옥" : !state.myAlive ? "💀 사망" : null;
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, display: "flex", alignItems: "center", gap: compact ? 8 : 16,
      padding: compact ? "8px 58px 8px 12px" : "10px 72px 10px 22px", background: "linear-gradient(180deg, rgba(8,7,6,0.97), rgba(8,7,6,0.9))",
      borderBottom: `1px solid ${theme.panelBorder}` }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        {!compact && <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 10, letterSpacing: "0.3em", color: theme.accent }}>■ 7EVELLIO</div>}
        <div style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 800, fontSize: compact ? 14.5 : 17, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {PHASE_LABEL(state)}
        </div>
      </div>
      {state.phase !== "gameover" && <TimerDisplay theme={theme} seconds={state.timerSeconds} compact />}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, minWidth: 0 }}>
        {state.myRoleLabel && !compact && (
          <div style={{ textAlign: "right", minWidth: 0 }}>
            <div style={{ fontSize: 10, color: theme.sub }}>내 직업</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: theme.accent, whiteSpace: "nowrap" }}>
              {state.myRoleLabel}{state.myDisguisedAs ? <span style={{ fontSize: 11, color: theme.sub, fontWeight: 400 }}> (위장: {state.myDisguisedAs})</span> : null}
            </div>
          </div>
        )}
        {statusLabel && <span style={{ fontSize: 11, color: theme.sub, border: `1px solid ${theme.panelBorder}`, padding: "2px 8px", borderRadius: 2, whiteSpace: "nowrap" }}>{statusLabel}</span>}
        {right}
      </div>
    </div>
  );
}

function PlainBox({ style, children }) { return <div style={style}>{children}</div>; }

const TEAM_NAME = { mafia: "마피아팀", citizen: "시민팀", neutral: "중립" };

/** 내 직업·팀·설명과, 게임 내내 참고해야 하는 개인 정보(위장 상태, 새 능력, 지난밤 결과 등)를 한곳에 모은 패널 */
function MyInfoPanel({ theme, state, children, news, hideResults }) {
  const { mode } = useGameLayout();
  const [descOpen, setDescOpen] = useState(mode === "desktop");
  const fill = mode === "desktop";
  if (!state.myRoleLabel) {
    return <Card theme={theme} style={{ padding: 14 }}><div style={{ fontSize: 13, color: theme.sub }}>이번 게임에 플레이어로 참여하지 않아 관전 중입니다.</div>{children}</Card>;
  }
  const team = state.myRecruitedToMafia ? "mafia" : state.myTeam;
  const Head = fill ? PlainBox : Card;
  const body = (
    <>
      <Head theme={theme} style={fill ? { paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${theme.panelBorder}` } : { padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: "'Special Elite', monospace", fontSize: 10.5, letterSpacing: "0.25em", color: theme.accent }}>MY FILE</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "1px 7px", borderRadius: 2,
            color: team === "mafia" ? "#E0474F" : team === "citizen" ? "#8DB4E2" : "#B79BE0",
            background: "rgba(0,0,0,0.35)" }}>{TEAM_NAME[team] || ""}{state.myRecruitedToMafia ? " (영입됨)" : ""}</span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 24, fontWeight: 900, color: theme.text }}>{state.myRoleLabel}</span>
          {!state.myAlive && <span style={{ fontSize: 12, color: theme.sub }}>💀 사망</span>}
          {state.isInJail && <span style={{ fontSize: 12, color: theme.sub }}>🔒 감옥</span>}
        </div>
        {(state.teammates?.length || 0) > 0 && (
          <div style={{ fontSize: 12, color: theme.text, marginTop: 6 }}>
            <span style={{ color: theme.sub }}>같은 팀 · </span>{state.teammates.map((t) => `${t.name}(${t.roleLabel})`).join(", ")}
          </div>
        )}
        {state.partnerName && <div style={{ fontSize: 12, color: theme.text, marginTop: 4 }}><span style={{ color: theme.sub }}>연인 · </span>{state.partnerName}</div>}
        <button onClick={() => setDescOpen((o) => !o)} style={{ marginTop: 8, background: "transparent", border: "none", padding: 0, color: theme.accent, fontSize: 11.5, cursor: "pointer" }}>
          {descOpen ? "직업 설명 접기 ▴" : "직업 설명 보기 ▾"}
        </button>
        {descOpen && <div style={{ fontSize: 12, color: theme.sub, lineHeight: 1.6, marginTop: 6 }}>{state.myRoleDesc}</div>}
        {state.myAbilityDisabled && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#E0474F" }}>
            {state.myAbilityDisabled === "lost" ? "💻 바이러스로 직업 능력을 영구히 잃었습니다." : "💋 마담에게 현혹되어 능력이 봉인되었습니다."}
          </div>
        )}
      </Head>
      {news}
      {!hideResults && <MyAbilityResultsPanel theme={theme} state={state} inSidebar />}
      {children}
    </>
  );
  if (fill) return <Card theme={theme} style={{ padding: "14px 14px" }}>{body}</Card>;
  return body;
}

/** 모바일 하단 탭 - 행동 / 채팅 / 플레이어 / 내 정보 */
function MobileTabBar({ theme, tab, setTab, unreadChat, state }) {
  const tabs = [
    ["action", "🎯", "행동"],
    ["chat", "💬", "채팅 · 플레이어"],
    ["guide", "📖", "직업 도감"],
  ];
  return (
    <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 80, display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
      background: "linear-gradient(180deg, rgba(10,9,8,0.92), rgba(0,0,0,0.98))", borderTop: `1px solid ${theme.panelBorder}`,
      paddingBottom: "env(safe-area-inset-bottom)" }}>
      {tabs.map(([key, icon, label]) => {
        const active = tab === key;
        return (
          <button key={key} onClick={() => setTab(key)} style={{ position: "relative", background: "transparent", border: "none", cursor: "pointer",
            padding: "8px 2px 9px", color: active ? theme.accent : theme.sub, borderTop: `2px solid ${active ? theme.accent : "transparent"}` }}>
            <div style={{ fontSize: 18, lineHeight: 1.1, filter: active ? "none" : "grayscale(0.6)" }}>{icon}</div>
            <div style={{ fontSize: 11, fontWeight: active ? 800 : 500, marginTop: 2 }}>{label}</div>
            {key === "chat" && unreadChat && (
              <span style={{ position: "absolute", top: 6, left: "calc(50% + 10px)", width: 8, height: 8, borderRadius: "50%", background: "#E0474F", boxShadow: "0 0 6px #E0474F" }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}

/** 모바일 채팅 탭 위의 정보 서랍 - 채팅을 치면서 플레이어 목록·지난밤 소식·내 결과를 펼쳐 볼 수 있다 */
function IntelDrawer({ theme, state, rosterPlayers, onPlayerClick }) {
  const [open, setOpen] = useState(null);
  const results = abilityResultRows(state);
  const items = [
    ["players", `🕵️ 플레이어 ${state.players?.filter((p) => p.alive && !p.inJail).length ?? ""}`, true],
    ["results", `🔍 내 결과${results.length ? ` ${results.length}` : ""}`, results.length > 0],
  ].filter((x) => x[2]);
  const current = items.some((x) => x[0] === open) ? open : null;
  return (
    <div style={{ marginBottom: 8, flexShrink: 0 }}>
      <div style={{ display: "flex", gap: 5, marginBottom: current ? 6 : 0 }}>
        {items.map(([key, label]) => {
          const active = current === key;
          return (
            <button key={key} onClick={() => setOpen(active ? null : key)} style={{ flex: 1, padding: "7px 4px", fontSize: 11.5, fontWeight: active ? 800 : 600,
              borderRadius: 2, cursor: "pointer", whiteSpace: "nowrap", color: active ? theme.text : theme.sub,
              background: active ? theme.accentSoft : "rgba(0,0,0,0.35)", border: `1px solid ${active ? theme.accent : theme.panelBorder}` }}>
              {label} {active ? "▴" : "▾"}
            </button>
          );
        })}
      </div>
      {current === "players" && <RosterPager theme={theme} players={rosterPlayers} onPlayerClick={onPlayerClick} />}
      {current === "results" && (
        <div className="noir-col" style={{ maxHeight: "30dvh", borderRadius: 2, border: `1px solid ${theme.panelBorder}`, background: theme.panel, padding: 10 }}>
          {results.map((r) => (
            <div key={r.key} style={{ fontSize: 12.5, color: theme.text, marginBottom: 5, lineHeight: 1.5 }}>{r.icon} {r.text}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 플레이어 목록 - 5명씩 두 줄(10명) 박스로 보여주고, 버튼이나 스와이프로 다음 10명 */
function RosterPager({ theme, players, onPlayerClick }) {
  const PER = 10;
  const pages = Math.max(1, Math.ceil(players.length / PER));
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const cur = Math.min(page, pages - 1);
  const go = (d) => { if (pages < 2) return; setDir(d); setPage((p) => (Math.min(p, pages - 1) + d + pages) % pages); };
  const swipe = useSwipe(() => go(-1), () => go(1));
  const slice = players.slice(cur * PER, cur * PER + PER);
  return (
    <div style={{ borderRadius: 3, border: `1px solid ${theme.panelBorder}`, background: theme.panel, padding: 6 }}>
      <div {...swipe} style={{ overflow: "hidden", touchAction: "pan-y" }}>
        <div key={cur} style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 4, animation: `${dir > 0 ? "noirSlideL" : "noirSlideR"} 0.22s ease-out` }}>
          {slice.map((p) => {
            const eliminated = !p.alive || p.inJail;
            const clickable = !p.roleLabel && !p.isSelf && onPlayerClick;
            const sub = p.roleLabel || (p.guessLabel ? `🔎 ${p.guessLabel}` : "직업 ?");
            return (
              <div key={p.id} onClick={clickable ? () => onPlayerClick(p.id) : undefined}
                style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "7px 2px 6px", borderRadius: 3, minWidth: 0,
                  cursor: clickable ? "pointer" : "default", background: p.isSelf ? theme.accentSoft : "rgba(0,0,0,0.32)",
                  border: `1px solid ${p.isMafia === true ? "rgba(196,50,58,0.7)" : p.isSelf ? theme.accent : theme.panelBorder}`,
                  filter: eliminated ? "grayscale(0.8)" : "none", opacity: eliminated ? 0.7 : 1 }}>
                {p.isSheriff && <span style={{ position: "absolute", top: 2, left: 3, fontSize: 10 }}>⭐</span>}
                {p.inJail && <span style={{ position: "absolute", top: 2, right: 3, fontSize: 10 }}>🔒</span>}
                <PlayerAvatar theme={theme} player={p} size={42} />
                <span style={{ fontSize: 11, fontWeight: p.isSelf ? 800 : 700, color: p.isMafia === true ? "#E0474F" : theme.text, maxWidth: "100%",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: eliminated ? "line-through" : "none" }}>{p.name}</span>
                <span style={{ fontSize: 9.5, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  color: p.roleLabel ? theme.accent : theme.sub, fontWeight: p.roleLabel ? 700 : 400 }}>{sub}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, gap: 6 }}>
        <button onClick={() => go(-1)} disabled={pages < 2} style={{ padding: "4px 12px", borderRadius: 2, border: `1px solid ${theme.panelBorder}`, background: "rgba(0,0,0,0.35)", color: theme.accent, cursor: "pointer", opacity: pages < 2 ? 0.3 : 1 }}>◀</button>
        <span style={{ fontSize: 10.5, color: theme.sub }}>{pages > 1 ? `${cur + 1} / ${pages} · 밀어서 넘기기` : "💡 이름을 눌러 예상 직업 메모"}</span>
        <button onClick={() => go(1)} disabled={pages < 2} style={{ padding: "4px 12px", borderRadius: 2, border: `1px solid ${theme.panelBorder}`, background: "rgba(0,0,0,0.35)", color: theme.accent, cursor: "pointer", opacity: pages < 2 ? 0.3 : 1 }}>▶</button>
      </div>
    </div>
  );
}

function DefenseBanner({ theme, state }) {
  const id = state.phase === "sheriffDefense" ? state.sheriffDesignatedTarget : state.nominee;
  const name = state.players.find((p) => p.id === id)?.name;
  return (
    <div style={{ flexShrink: 0, marginBottom: 8, padding: "9px 12px", borderRadius: 3, background: "rgba(196,50,58,0.14)", border: "1px solid rgba(196,50,58,0.45)", fontSize: 13, color: theme.text }}>
      ⚖️ <b>{name}</b>님의 최후 변론 시간입니다{state.phase === "sheriffDefense" ? (state.verdictByPriest ? " (이단심판)" : " (보안관 처형대)") : ""}
    </div>
  );
}

function DayAbilityEmptyNote({ theme, state }) {
  const has = (state.myAlive && !state.myAbilityDisabled) && (
    (state.phase === "discussion" && (state.myIsSheriff || ["counselor", "coroner"].includes(state.myRole) || (state.myRole === "cat" && state.myCatAlignment === "mafia") || (state.myRole === "mercenary" && state.myMercenaryPendingContacts?.length > 0)
      || state.myPowerUpgrade === "detective_deduce" || (state.myPowerUpgrade === "priest_inquisition" && !state.myInquisitionUsed))) ||
    ["framer_wiretap", "terrorist_selfdestruct", "conartist_rig", "hitman_poison"].includes(state.myPowerUpgrade)
  );
  if (has) return null;
  return <div style={{ fontSize: 12.5, color: theme.sub }}>낮에 쓰는 능력이 없는 직업이에요. 밤이 되면 이 탭에서 능력을 사용하세요.</div>;
}

/** 오늘 누구에게 능력을 썼는지 + 지난밤 결과 + 지난 기록 */
function MyAbilityStatus({ theme, state, history }) {
  const [showHistory, setShowHistory] = useState(false);
  const name = (id) => state.players.find((p) => p.id === id)?.name || "?";
  const picks = [];
  const add = (label, id, extra) => id && picks.push({ label, who: name(id), extra });
  if (state.phase === "night") {
    if (state.myAbility?.selectedTargetId) add(`[${state.myRoleLabel}] 능력`, state.myAbility.selectedTargetId);
    if (state.myHitmanAbility?.selectedTargetId) add("암살", state.myHitmanAbility.selectedTargetId, state.myHitmanAbility.selectedGuessedRole ? `예상 직업: ${HITMAN_ROLE_LABEL_BY_KEY[state.myHitmanAbility.selectedGuessedRole] || "?"}` : null);
    if (state.policeSecondTarget) add("강력 수사 (두 번째)", state.policeSecondTarget);
    if (state.mafiaSecondTarget) add("무법자 (두 번째 습격)", state.mafiaSecondTarget);
    if (state.myConartistLegendTarget && state.myConartistLegendRole) add(`전설의 사기꾼 [${state.myDisguisedAs}]`, state.myConartistLegendTarget);
    if (state.myTeacherLessonChoice) picks.push({ label: "오늘 밤 수업", who: TEACHABLE_ROLE_LABEL[state.myTeacherLessonChoice] || state.myTeacherLessonChoice });
    if (state.myTerroristArsonPending) picks.push({ label: "방화", who: "오늘 밤 예약됨" });
    if (state.myNightLordTonight) picks.push({ label: "밤의 지배자", who: "오늘 밤 발동" });
    if (state.myPossess?.selectedTargetId) add(`빌린 능력 [${state.myPossess.roleLabel}]`, state.myPossess.selectedTargetId);
  } else {
    if (state.myCounselorTarget) add("오늘 밤 상담", state.myCounselorTarget);
    if (state.myFramerWiretapTargetId) add("오늘 밤 도청", state.myFramerWiretapTargetId);
    if (state.terroristSelfdestructTarget) add("자폭 대상", state.terroristSelfdestructTarget);
    if (state.conartistRiggedTargetId) add("투표 조작", state.conartistRiggedTargetId);
    if (state.myHitmanPoisonTargetId) add("독살", state.myHitmanPoisonTargetId);
    if (state.myCatVoteRemovedName) picks.push({ label: "투표권 제거", who: state.myCatVoteRemovedName });
    if (state.myCoronerResult && state.myCoronerUsedToday) picks.push({ label: "부검", who: state.myCoronerResult.targetName, extra: `"${state.myCoronerResult.flavor}"` });
  }
  const results = abilityResultRows(state);
  const past = history.filter((h) => h.day !== state.dayNumber || !NEWS_PHASES.includes(state.phase));
  if (!state.myRoleLabel) return null;
  return (
    <Card theme={theme} style={{ padding: "12px 14px", margin: "12px 0" }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.accent, marginBottom: 6 }}>🎯 {state.phase === "night" ? "오늘 밤" : "오늘"} 내가 능력을 쓴 대상</div>
      {picks.length === 0 ? (
        <div style={{ fontSize: 12.5, color: theme.sub }}>아직 아무에게도 능력을 쓰지 않았어요.</div>
      ) : picks.map((pk, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 13, color: theme.text, marginBottom: 3, flexWrap: "wrap" }}>
          <span style={{ color: theme.sub, fontSize: 12 }}>{pk.label} →</span><b>{pk.who}</b>
          {pk.extra && <span style={{ fontSize: 11.5, color: theme.sub }}>{pk.extra}</span>}
        </div>
      ))}
      {results.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${theme.panelBorder}` }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: theme.text, marginBottom: 5 }}>🔍 지난밤 결과</div>
          {results.map((r) => <div key={r.key} style={{ fontSize: 12.5, color: theme.text, marginBottom: 4, lineHeight: 1.5 }}>{r.icon} {r.text}</div>)}
        </div>
      )}
      {past.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${theme.panelBorder}` }}>
          <button onClick={() => setShowHistory((v) => !v)} style={{ background: "transparent", border: "none", padding: 0, color: theme.accent, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
            📜 지난 능력 기록 {past.length}일치 {showHistory ? "▴" : "▾"}
          </button>
          {showHistory && past.map((h) => (
            <div key={h.day} style={{ marginTop: 6 }}>
              <div style={{ fontSize: 11, color: theme.sub, marginBottom: 2 }}>{h.day}일차 아침에 받은 결과</div>
              {h.rows.map((r) => <div key={r.key} style={{ fontSize: 12, color: theme.text, marginBottom: 3, lineHeight: 1.45 }}>{r.icon} {r.text}</div>)}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/** 게임 내내 받은 능력 결과를 일차별로 모아둔다 (서버는 지난밤 결과만 보내주므로 화면에서 누적한다) */
function useAbilityHistory(state) {
  const [history, setHistory] = useState([]);
  const rows = NEWS_PHASES.includes(state.phase) ? abilityResultRows(state) : [];
  const sig = rows.map((r) => r.key).join(",");
  useEffect(() => {
    if (!rows.length) return;
    setHistory((h) => [{ day: state.dayNumber, rows }, ...h.filter((x) => x.day !== state.dayNumber)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.dayNumber, sig]);
  return history;
}

const ONCE_OPTIONAL_ROLES = ["reporter", "priest", "judge", "avenger", "godfather", "conartist", "veteran"];
const LEGEND_RECURRING = ["police", "spy", "undertaker", "doctor", "soldier", "detective", "bodyguard", "mafia", "framer", "blocker", "silencer", "hitman"];

/** 낮·밤이 끝나기 30초 전인데 아직 대상을 고르지 않은 능력 목록 (없으면 빈 배열) */
function pendingAbilityLines(state) {
  if (!state.myAlive || state.isInJail || state.myAbilityDisabled) return [];
  const lines = [];
  const label = state.myRoleLabel;
  if (state.phase === "night") {
    const a = state.myAbility;
    if (a && !a.selectedTargetId && !ONCE_OPTIONAL_ROLES.includes(a.role)) {
      const skip =
        (a.role === "witch" && state.myPowerUpgrade !== "witch_mindcontrol") ||
        (a.role === "vampire" && !(state.dayNumber >= 3 && state.dayNumber % 2 === 1)) ||
        ((a.role === "undertaker" || a.role === "medium") && !state.players.some((p) => !p.alive)) ||
        (a.role === "blocker" && state.myPowerUpgrade === "blocker_charm");
      if (!skip) lines.push(a.role === "cat" ? "🐱 아직 집사를 정하지 않았어요 (정하지 않으면 승리할 수 없어요)" : `🎯 [${label}] 능력 대상을 아직 고르지 않았어요`);
    }
    if (state.myHitmanAbility && !state.myHitmanAbility.selectedTargetId && state.myPowerUpgrade !== "hitman_poison") lines.push("🎯 암살 대상과 직업을 아직 고르지 않았어요");
    if (state.myRole === "teacher" && !state.myTeacherLessonChoice && state.myTeachingProgress) lines.push("🍎 오늘 밤 수업할 직업을 아직 고르지 않았어요");
    if (state.myRole === "priest" && state.myPowerUpgrade === "priest_saint" && !state.myAbility?.selectedTargetId && state.myAbility) lines.push("🕊️ [성녀] 오늘 밤 보호할 사람을 아직 고르지 않았어요");
    const legend = state.myConartistLegendRole;
    if (legend && LEGEND_RECURRING.includes(legend) && !state.myConartistLegendTarget) lines.push(`🎭 [${state.myDisguisedAs}] 능력 대상을 아직 고르지 않았어요`);
  } else if (state.phase === "discussion" || state.phase === "sheriffElection") {
    const up = state.myPowerUpgrade;
    if (state.phase === "discussion" && state.myRole === "counselor" && !state.myCounselorTarget) lines.push("💬 오늘 밤 상담할 사람을 아직 고르지 않았어요");
    if (state.myRole === "framer" && up === "framer_wiretap" && !state.myFramerWiretapTargetId) lines.push("📡 오늘 밤 도청할 사람을 아직 고르지 않았어요");
    if (state.myRole === "terrorist" && up === "terrorist_selfdestruct" && !state.terroristSelfdestructTarget) lines.push("💣 자폭 대상을 아직 지정하지 않았어요");
    if (state.myRole === "conartist" && up === "conartist_rig" && !state.conartistRiggedTargetId) lines.push("🗳️ 투표 조작 대상을 아직 고르지 않았어요");
    if (state.myRole === "hitman" && up === "hitman_poison" && !state.myHitmanPoisonTargetId) lines.push("☠️ 오늘 독을 먹일 사람을 아직 고르지 않았어요");
    if (state.phase === "discussion" && state.myRole === "coroner" && !state.myCoronerUsedToday && state.players.some((p) => !p.alive)) lines.push("🔬 오늘 부검을 아직 하지 않았어요");
    if (state.phase === "discussion" && state.myRole === "cat" && state.myCatAlignment === "mafia" && !state.myCatVoteRemovedName) lines.push("🐱 투표권을 없앨 사람을 아직 고르지 않았어요");
  }
  return lines;
}

/** 단계마다 딱 한 번, 남은 시간이 30초 이하가 되는 순간 아직 안 쓴 능력이 있으면 알림을 띄운다 */
function useActionReminder(state) {
  const lines = pendingAbilityLines(state);
  const key = `${state.dayNumber}:${state.phase}`;
  const firedRef = useRef(null);
  const [shownKey, setShownKey] = useState(null);
  const seconds = useTimerSeconds(state.timerSeconds);
  const due = ["night", "discussion", "sheriffElection"].includes(state.phase) && seconds <= 30 && seconds > 3;
  useEffect(() => {
    if (!due || lines.length === 0 || firedRef.current === key) return;
    firedRef.current = key;
    setShownKey(key);
    playPlayerSample("action_reminder");
  }, [due, lines.length, key]);
  useEffect(() => {
    if (shownKey !== key) return undefined;
    const t = setTimeout(() => setShownKey(null), 12000);
    return () => clearTimeout(t);
  }, [shownKey, key]);
  return { visible: shownKey === key && lines.length > 0, active: due && lines.length > 0, lines, seconds, dismiss: () => setShownKey(null) };
}

function ActionReminderLayer({ theme, state, showGo, onGo }) {
  const reminder = useActionReminder(state);
  if (!reminder.visible) return null;
  return <ActionReminderToast theme={theme} lines={reminder.lines} seconds={reminder.seconds} onClose={reminder.dismiss}
    onGo={() => { onGo(); reminder.dismiss(); }} showGo={showGo} />;
}

function ChatReminderBanner({ state, showGo, onGo }) {
  const lines = pendingAbilityLines(state);
  const seconds = useTimerSeconds(state.timerSeconds);
  const active = ["night", "discussion", "sheriffElection"].includes(state.phase) && seconds <= 30 && seconds > 3 && lines.length > 0;
  if (!active) return null;
  return (
    <div role="alert" style={{ flexShrink: 0, marginBottom: 8, borderRadius: 3, padding: "8px 10px", background: "linear-gradient(90deg, rgba(90,20,24,0.9), rgba(30,10,10,0.9))",
      border: "1px solid rgba(224,71,79,0.7)", borderLeft: "4px solid #E0474F", animation: "noirChatRemind 1.6s ease-in-out infinite" }}>
      <style>{`@keyframes noirChatRemind { 0%,100% { box-shadow: 0 0 0 0 rgba(224,71,79,0.45); } 50% { box-shadow: 0 0 0 5px rgba(224,71,79,0); } }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 800, color: "#F4EDE0" }}>
        <span>⏰ 능력을 아직 쓰지 않았어요</span>
        <span style={{ marginLeft: "auto", fontFamily: "'Courier Prime', monospace", color: "#E0474F" }}>{seconds}초</span>
      </div>
      {lines.map((l, i) => <div key={i} style={{ fontSize: 11.5, color: "#EDE6D6", marginTop: 2 }}>{l}</div>)}
      {showGo && (
        <button onClick={onGo} style={{ marginTop: 6, width: "100%", padding: "6px 0", borderRadius: 2, border: "1px solid #E0474F",
          background: "rgba(224,71,79,0.2)", color: "#F4EDE0", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>🎯 지금 고르러 가기</button>
      )}
    </div>
  );
}

function ActionReminderToast({ theme, lines, seconds, onClose, onGo, showGo }) {
  return (
    <div role="alert" style={{ position: "fixed", top: 62, left: "50%", zIndex: 400, width: "min(94vw, 480px)",
      transform: "translateX(-50%)", animation: "noirReminderIn 0.35s cubic-bezier(.2,.9,.3,1.2)" }}>
      <style>{`
        @keyframes noirReminderIn { from { opacity: 0; transform: translate(-50%, -24px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes noirReminderPulse { 0%,100% { box-shadow: 0 16px 40px rgba(0,0,0,0.7), 0 0 0 0 rgba(224,71,79,0.55); } 50% { box-shadow: 0 16px 40px rgba(0,0,0,0.7), 0 0 0 7px rgba(224,71,79,0); } }
      `}</style>
      <div style={{ borderRadius: 4, padding: "12px 14px", background: "linear-gradient(180deg, rgba(40,12,14,0.97), rgba(14,8,8,0.97))",
        border: "1px solid rgba(224,71,79,0.7)", borderLeft: "4px solid #E0474F", animation: "noirReminderPulse 1.6s ease-in-out infinite" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 18 }}>⏰</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "#F4EDE0" }}>능력을 아직 쓰지 않았어요!</span>
          <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 15, fontWeight: 700, color: "#E0474F" }}>
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </span>
          <button onClick={onClose} aria-label="닫기" style={{ background: "transparent", border: "none", color: "rgba(244,237,224,0.6)", fontSize: 16, cursor: "pointer", padding: "0 2px" }}>✕</button>
        </div>
        {lines.map((l, i) => <div key={i} style={{ fontSize: 12.5, color: "#EDE6D6", lineHeight: 1.55 }}>{l}</div>)}
        {showGo && (
          <button onClick={onGo} style={{ marginTop: 8, width: "100%", padding: "8px 0", borderRadius: 2, border: "1px solid #E0474F",
            background: "rgba(224,71,79,0.2)", color: "#F4EDE0", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            🎯 지금 고르러 가기
          </button>
        )}
      </div>
    </div>
  );
}

/** 투표 화면용 큰 플레이어 타일 - 채팅창 넓이만큼 넓게 깔린다 */
function VoteTileGrid({ theme, players, selectedId, onPick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))", gap: 6, width: "100%" }}>
      {players.map((p) => {
        const selected = selectedId === p.id;
        return (
          <button key={p.id} onClick={() => onPick(p)} className="noir-vote-tile"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 84, padding: "8px 4px",
              borderRadius: 3, cursor: "pointer", color: theme.text, position: "relative",
              background: selected ? `linear-gradient(180deg, ${theme.accentSoft}, rgba(0,0,0,0.35))` : "rgba(0,0,0,0.32)",
              border: `1px solid ${selected ? theme.accent : theme.panelBorder}`, boxShadow: selected ? `0 0 0 1px ${theme.accent}, 0 0 18px ${theme.accentSoft}` : "none",
              transition: "transform 0.12s ease, border-color 0.15s ease" }}>
            <style>{".noir-vote-tile:hover { transform: translateY(-2px); }"}</style>
            <PlayerAvatar theme={theme} player={p} size={40} />
            <span style={{ fontSize: 14, fontWeight: selected ? 900 : 700, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            {p.roleLabel && <span style={{ fontSize: 10, color: theme.sub }}>{p.roleLabel}</span>}
            {selected && <span style={{ position: "absolute", top: 5, right: 6, fontSize: 12, color: theme.accent }}>✔</span>}
          </button>
        );
      })}
    </div>
  );
}

/** 찬반·판결용 큰 두 버튼 */
function BigChoice({ theme, options, selected, onPick }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "6px 0 10px" }}>
      {options.map(([value, icon, label, sub]) => {
        const active = selected === value;
        return (
          <button key={value} onClick={() => onPick(value)} style={{ minHeight: 130, borderRadius: 4, cursor: "pointer", color: theme.text,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
            background: active ? `linear-gradient(180deg, ${theme.accentSoft}, rgba(0,0,0,0.35))` : "rgba(0,0,0,0.32)",
            border: `1px solid ${active ? theme.accent : theme.panelBorder}`, boxShadow: active ? `0 0 0 1px ${theme.accent}` : "none" }}>
            <span style={{ fontSize: 36 }}>{icon}</span>
            <span style={{ fontFamily: "'Noto Serif KR', serif", fontSize: 20, fontWeight: 900 }}>{label}</span>
            <span style={{ fontSize: 11.5, color: theme.sub }}>{sub}</span>
          </button>
        );
      })}
    </div>
  );
}

/** 모바일 채팅 탭 위에 붙는 회의 스킵 투표 줄 - 채팅을 치다가도 바로 스킵에 찬성할 수 있게 */
function SkipVoteBar({ theme, state, socket }) {
  const aliveCount = state.players.filter((p) => p.alive).length;
  const required = Math.ceil(aliveCount * 0.7);
  return (
    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "7px 8px 7px 12px", borderRadius: 3,
      background: theme.accentSoft, border: `1px solid ${theme.panelBorder}` }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: theme.text, lineHeight: 1.35 }}>
        ⏭ {state.phase === "sheriffElection" ? "스킵" : "회의 스킵"} <b>{state.skipVoteCount}/{aliveCount}</b>
        <span style={{ color: theme.sub }}> · {required}명 이상이면 즉시 종료</span>
      </span>
      <Button theme={theme} variant={state.mySkippedVote ? "solid" : "subtle"} style={{ fontSize: 12, padding: "6px 12px", whiteSpace: "nowrap", flexShrink: 0 }}
        onClick={() => socket.emit("game_action", { type: "CAST_SKIP_VOTE" })}>
        {state.mySkippedVote ? "✓ 찬성함" : "스킵하기"}
      </Button>
    </div>
  );
}
