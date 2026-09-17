/**
 * 레벨리오 마피아 - 서버 권위(authoritative) 게임 엔진
 * 클라이언트 프로토타입의 로직을 순수 함수 형태로 이식했습니다.
 * 이 파일은 프레임워크 의존성이 없는 순수 JS라, 프론트/백엔드 어디서든 재사용 가능합니다.
 */

export const ROLES = {
  mafia: { label: "마피아", team: "mafia", emoji: "🗡️",
    desc: "밤마다 시민 한 명을 지목해 제거합니다. 마피아팀끼리는 서로를 알아볼 수 있습니다." },
  spy: { label: "스파이", team: "mafia", emoji: "🕵️",
    desc: "밤마다 플레이어 한 명을 조사해 직업을 알 수 있습니다." },
  conartist: { label: "사기꾼", team: "mafia", emoji: "🎭",
    desc: "게임당 단 한 번, 밤에 플레이어 한 명을 선택해 그 사람의 직업으로 영구히 위장합니다. 실제 능력은 얻지 못하고 순전히 겉모습만 위장하는 것으로, 기자·장의사·스파이의 조사에도 위장한 직업으로 나타납니다. 스파이처럼 경찰 조사와 처형 공개에서도 마피아가 아닌 것으로 나타납니다." },
  godfather: { label: "대부", team: "mafia", emoji: "👑",
    desc: "게임당 단 한 번, 밤에 마피아팀이 아닌 플레이어 한 명을 마피아팀으로 영입할 수 있습니다. 영입된 사람은 원래 직업 능력을 그대로 유지한 채 마피아팀에 편입되고, 경찰 조사·처형 공개에서는 마피아로 나오지 않습니다. 단, 대상이 경찰이었다면 영입은 실패하고 대부의 정체가 그 경찰에게 발각됩니다. 대부 본인은 스파이처럼 경찰 조사와 처형 공개에서 마피아가 아닌 것으로 나타납니다." },
  hitman: { label: "히트맨", team: "mafia", emoji: "🎯",
    desc: "밤마다 한 명을 지목하고 그 사람의 직업을 함께 추측합니다. 추측이 정확히 맞으면 암살에 성공해 그 사람은 목숨을 잃습니다(틀리면 아무 일도 일어나지 않습니다). 이 공격은 의사의 보호, 군인의 방어, 경호원의 대신 희생으로 막아낼 수 있습니다." },
  framer: { label: "해커", team: "mafia", emoji: "💻",
    desc: "밤마다 한 명을 지목합니다. 시스템을 해킹해 데이터를 조작해서, 그 사람이 이번 밤 경찰·스파이·기자의 조사를 받으면 결과가 마피아로 둔갑합니다." },
  blocker: { label: "마담", team: "mafia", emoji: "💋",
    desc: "밤마다 한 명을 유혹해 밤을 함께 보냅니다. 유혹당한 사람은 이번 밤 자신의 능력을 사용하지 못합니다." },
  silencer: { label: "유괴범", team: "mafia", emoji: "⛓️",
    desc: "밤마다 한 명을 납치합니다. 납치당한 사람은 다음날 낮 채팅에 전혀 참여할 수 없습니다." },
  terrorist: { label: "테러리스트", team: "mafia", emoji: "💣",
    desc: "투표로 처형되면, 마피아팀을 제외한 무작위 플레이어 한 명과 함께 자폭합니다. 그 플레이어의 직업은 공개되지 않습니다." },
  witch: { label: "마녀", team: "mafia", emoji: "🔮",
    desc: "게임당 단 한 번, 밤에 플레이어 한 명에게 죽음의 저주를 겁니다. 저주에 걸린 사람은 3일 후 목숨을 잃습니다. 그 전에 마녀가 투표로 처형되면 저주는 풀립니다." },
  police: { label: "경찰", team: "citizen", emoji: "🔍",
    desc: "밤마다 한 명을 조사해 마피아 팀인지 아닌지 확인할 수 있습니다." },
  doctor: { label: "의사", team: "citizen", emoji: "🩺",
    desc: "밤마다 살릴 사람을 한 명 선택합니다. 그 사람이 그날 밤 공격당했다면 다음날 죽지 않습니다." },
  reporter: { label: "기자", team: "citizen", emoji: "📰",
    desc: "2일차 밤부터, 단 한 번, 선택한 사람의 직업을 다음날 아침 공개합니다." },
  medium: { label: "영매", team: "citizen", emoji: "👻",
    desc: "밤마다 죽은 사람들과 채팅으로 대화할 수 있습니다." },
  soldier: { label: "건달", team: "citizen", emoji: "🎖️",
    desc: "밤마다 한 명을 협박해 다음날 투표를 하지 못하게 만듭니다." },
  newlywed: { label: "연인", team: "citizen", emoji: "💞",
    desc: "연인끼리 서로를 알고 밤마다 채팅할 수 있습니다. 한쪽이 밤에 습격당해 죽게 되면, 살아있는 상대가 대신 목숨을 잃습니다." },
  unemployed: { label: "백수", team: "citizen", emoji: "🛋️",
    desc: "게임 첫날 밤에 죽은 사람이 직업을 갖고 있었다면, 그 직업을 물려받아 취직합니다. 단, 그 직업이 중립 직업이거나 연인이었다면 취직할 수 없습니다." },
  teacher: { label: "교사", team: "citizen", emoji: "🍎",
    desc: "학생과 반드시 한 쌍으로 배정됩니다. 밤마다 학생과 단둘이 채팅할 수 있고, 매일 밤 학생에게 시민팀 직업 하나를 골라 수업할 수 있습니다. 같은 직업을 필요한 횟수만큼 수업하면 학생이 그 직업을 갖게 됩니다." },
  student: { label: "학생", team: "citizen", emoji: "🎒",
    desc: "교사와 반드시 한 쌍으로 배정됩니다. 밤마다 교사와 단둘이 채팅할 수 있습니다. 교사의 수업이 쌓이면 시민팀 직업 하나를 얻게 됩니다." },
  counselor: { label: "상담원", team: "citizen", emoji: "💬",
    desc: "낮 회의 시간에 플레이어 한 명을 선택하면, 그날 밤 그 사람과 단둘이 상담 채팅을 할 수 있습니다. 하루짜리 선택이라 다음 날엔 또 다른 사람을 골라야 합니다. 상담 채팅에서 본인 닉네임은 '상담원'으로만 표시됩니다." },
  idol: { label: "피싱", team: "citizen", emoji: "📧",
    desc: "밤마다 스팸 문자를 보내 전체 공지 메시지를 보낼 수 있습니다. 발신자는 표시되지 않고 문자 이모지로만 표시되며, 새 메시지를 보내면 이전 메시지를 대체합니다." },
  coroner: { label: "검시관", team: "citizen", emoji: "🔬",
    desc: "매일 낮에 한 번, 죽은 플레이어 한 명을 부검해 어떤 방식으로 죽었는지 알아낼 수 있습니다. 누구에게 죽었는지는 알 수 없고, 죽은 원인(단서)만 알 수 있습니다." },
  warden: { label: "교도관", team: "citizen", emoji: "🔑",
    desc: "밤마다 현재 감옥에 갇혀있는 사람과 단둘이 대화할 수 있습니다. 감옥에 아무도 없으면 대화할 상대가 없습니다." },
  politician: { label: "정치인", team: "citizen", emoji: "🎩",
    desc: "투표로는 절대 처형되지 않으며, 투표할 때 표를 두 번 행사합니다." },
  detective: { label: "탐정", team: "citizen", emoji: "🧭",
    desc: "밤마다 한 명을 지목해, 그 사람이 이번 밤 능력을 썼다면 누구를 대상으로 했는지 알 수 있습니다." },
  undertaker: { label: "장의사", team: "citizen", emoji: "⚰️",
    desc: "밤마다 죽은 사람 한 명을 조사해 정확한 직업을 알아냅니다. 영혼을 빼앗겼거나 흡혈귀였는지도 함께 확인할 수 있습니다." },
  judge: { label: "판사", team: "citizen", emoji: "🔨",
    desc: "판사가 살아있으면, 낮 처형 투표에서 최다 득표자의 처형 여부를 공개 찬반 투표 대신 판사 혼자 결정합니다. 투표가 동점이 나면 동점자 중 한 명을 직접 지명할 수도 있습니다. 능력을 사용해도 직업은 공개되지 않습니다." },
  official: { label: "공무원", team: "citizen", emoji: "🗂️",
    desc: "밤이 되면, 그날 낮 투표에서 누가 누구를 지목했는지와 찬반 투표 결과를 열람할 수 있습니다. 다만 판사가 처형 여부를 대신 결정한 경우에는 찬반 결과를 볼 수 없습니다." },
  priest: { label: "성직자", team: "citizen", emoji: "🕊️",
    desc: "게임당 단 한 번, 밤에 죽은 사람 한 명을 부활시킬 수 있습니다. 부활은 모두에게 공개적으로 알려집니다." },
  citizen: { label: "시민", team: "citizen", emoji: "🌾",
    desc: "특별한 능력은 없습니다. 낮의 토론과 투표로 마피아를 찾아내야 합니다." },
  veteran: { label: "군인", team: "citizen", emoji: "🪖",
    desc: "단 한 번, 마피아의 공격을 막아내고 살아남을 수 있습니다. 성공하면 모두에게 공개적으로 알려집니다." },
  bodyguard: { label: "경호원", team: "citizen", emoji: "🛡️",
    desc: "매일 밤 한 명을 경호합니다. 경호 대상이 밤에 공격당하면 경호원이 대신 목숨을 잃고, 공격한 쪽(마피아팀은 그중 순수 마피아 한 명, 그 외에는 공격한 본인)도 함께 목숨을 잃습니다." },
  cultist: { label: "악마 숭배자", team: "neutral", emoji: "😈",
    desc: "밤마다 한 명을 지목합니다. 그 사람이 다음날 투표로 처형되면 영혼을 하나 수확합니다. 영혼 4개를 모으면 승리합니다." },
  vampire: { label: "뱀파이어", team: "neutral", emoji: "🧛",
    desc: "1일차를 제외한 홀수일차 밤마다 한 명을 물어 흡혈귀로 만듭니다. 뱀파이어팀(뱀파이어+흡혈귀) 수가 나머지 전체 인원보다 많아지면 승리합니다." },
  thief: { label: "괴도", team: "neutral", emoji: "🎭",
    desc: "괴도가 있으면 다른 모든 플레이어에게 보석(다이아몬드·루비·사파이어·에메랄드) 하나씩이 몰래 배정됩니다. 밤마다 한 명을 지목해 그 사람의 보석을 훔칠 수 있고, 이미 훔친 사람에게는 다시 훔칠 수 없습니다. 네 가지 보석을 전부 모으면 승리합니다." },
  werewolf: { label: "늑대인간", team: "neutral", emoji: "🐺",
    desc: "밤마다 한 명을 습격해 죽일 수 있습니다. 마피아와 같은 대상을 노리면 마피아팀과 영구 동맹을 맺어 마피아팀에 편입됩니다. 동맹한 뒤에는 마피아팀이 전멸해도 늑대인간이 살아있으면 게임이 끝나지 않고, 늑대인간까지 죽어야 시민팀이 승리합니다." },
  cat: { label: "고양이", team: "neutral", emoji: "🐱",
    desc: "게임 시작부터 직업이 공개됩니다. 마녀의 저주와 늑대인간의 습격을 제외하면 절대 죽지 않고, 투표권도 없습니다. 게임당 단 한 번 밤에 한 명을 '집사'로 임명할 수 있고, 집사의 소속 팀에 그대로 편입되어 그 팀과 승패를 함께합니다. 집사를 정하지 않으면 승리할 수 없습니다. 말을 할 줄 몰라 채팅은 전부 '냥'으로만 나갑니다." },
  mercenary: { label: "용병", team: "neutral", emoji: "🗡️",
    desc: "혼자서는 아무것도 할 수 없습니다. 경찰의 조사 대상, 마피아의 습격 대상, 건달의 협박 대상이 되면(최초 1회) 그 사람과 접선해 '의뢰'를 받습니다. 마피아에게 의뢰받으면 마피아팀으로, 경찰에게 의뢰받으면 시민팀으로 편입되어 그 팀과 승패를 함께합니다. 건달에게 의뢰받으면 건달과 함께 중립으로 남아 각자 매일 밤 한 명씩 죽일 수 있고, 마피아팀 전멸+시민팀 필수·특수직업 전멸, 또는 둘의 인원이 나머지 전체 인원과 같거나 많아지면 둘만의 승리를 거둡니다. 의뢰를 받은 뒤로는 매일 밤 한 명씩 죽일 수 있습니다." },
};

/** 사망 원인 코드 -> 검시관이 부검으로 알아내는 단서 문구. 누가 죽였는지는 알 수 없고, 어떤 방식으로 죽었는지만 알 수 있다. */
export const DEATH_CAUSE_FLAVOR = {
  mafia: "총에 맞아 사망한 것 같다.",
  hitman: "암살당한 것 같다.",
  mercenary: "날카로운 무언가에 찔린 상처가 있다.",
  soldier: "둔기로 가격당한 흔적이 있다.",
  werewolf: "짐승에게 물어뜯긴 흔적이 있다.",
  witch: "설명할 수 없는 저주의 기운이 느껴진다.",
  vampireFight: "격렬한 몸싸움과 물어뜯긴 자국이 함께 발견된다.",
  bodyguard: "다른 사람을 감싸려다 목숨을 잃은 흔적이 있다.",
  avenger: "몸싸움의 흔적이 강하게 남아있다.",
  terroristBomb: "폭발에 휘말린 흔적이 있다.",
  execution: "처형으로 인한 상처 외에 다른 흔적은 없다.",
  spy: "소음기 달린 총에 맞은 흔적이 있다.",
  veteran: "군용 소총에 정확히 저격당한 흔적이 있다.",
};

export const NEUTRAL_ROLES = ["cultist", "vampire", "thief", "werewolf", "cat", "mercenary"];

/** 마피아팀 소속이거나, 늑대인간/고양이가 마피아팀에 편입된 상태인지 확인한다. */
export function isMafiaAligned(p) {
  if (p.inJail) return false;
  if (p.isThrall) return false; // 흡혈귀가 되면 원래 팀(마피아)을 떠나 뱀파이어팀이 된다
  return ROLES[p.role].team === "mafia" || (p.role === "werewolf" && p.isWolfAllied) || (p.role === "cat" && p.catAlignment === "mafia") || p.recruitedToMafia === true || (p.role === "mercenary" && p.mercenaryContactedBy === "mafia");
}
/** 시민팀 소속이거나, 고양이가 시민팀에 편입된 상태인지 확인한다. */
export function isCitizenAligned(p) {
  if (p.inJail) return false;
  if (p.isThrall) return false; // 흡혈귀가 되면 원래 팀(시민)을 떠나 뱀파이어팀이 된다
  // 건달이 용병과 짝을 이루면 더 이상 시민팀이 아니라 중립(용병과 동맹)으로 전향한다.
  if (p.role === "soldier" && p.pairedWithMercenary) return false;
  return (ROLES[p.role].team === "citizen" && !p.recruitedToMafia) || (p.role === "cat" && p.catAlignment === "citizen") || (p.role === "mercenary" && p.mercenaryContactedBy === "police");
}
/** 조사·처형 공개 등 게임 내 모든 "직업 노출"에서 실제로 보여줄 라벨. 사기꾼이 위장 중이면 위장한 직업으로 보인다. */
export function effectiveRoleLabel(p) {
  if (p.role === "conartist" && p.disguisedAs) return ROLES[p.disguisedAs].label;
  return ROLES[p.role].label;
}
/** 영입·세뇌가 통하지 않는 "중립 쪽" 사람 - 중립 직업, 용병과 짝이 된 건달, 흡혈귀가 된 사람 */
export function isNeutralSide(p) {
  return !!p && (ROLES[p.role].team === "neutral" || (p.role === "soldier" && p.pairedWithMercenary) || !!p.isThrall);
}
/** 악마 숭배자의 영혼 수확이 이 처형 대상에게 발동하는지 - 숭배자가 살아있고 감옥에 없어야 한다 */
function cultistHarvestOn(state, targetId) {
  if (!state.cultistTarget || state.cultistTarget !== targetId) return false;
  const cultist = state.players.find((p) => p.role === "cultist");
  return !!cultist && cultist.alive && !cultist.inJail;
}
export const GEM_TYPES = ["다이아몬드", "루비", "사파이어", "에메랄드"];

export const MAFIA_SPECIAL_ROLES = ["spy", "framer", "blocker", "silencer", "terrorist", "witch", "conartist", "godfather", "hitman"];
export const CITIZEN_SPECIAL_ROLES = ["police", "doctor", "reporter", "medium", "soldier", "newlywed", "politician", "detective", "veteran", "undertaker", "judge", "official", "priest", "bodyguard"];
// 시민팀 "일반직업" - 특수직업과는 완전히 별개 카테고리라 특수직업 예산(수 제한)과 무관하다.
// 그룹 하나가 한 세트로 배정된다. 같은 직업 여러 명(연인=lover,lover)일 수도, 서로 다른 직업 조합(교사+학생)일 수도 있다.
export const CITIZEN_GENERAL_ROLE_GROUPS = {
  unemployed: ["unemployed"],
  teacherStudent: ["teacher", "student"],
  counselor: ["counselor"],
  idol: ["idol"],
  coroner: ["coroner"],
  warden: ["warden"],
};
export const CITIZEN_GENERAL_ROLES = Object.keys(CITIZEN_GENERAL_ROLE_GROUPS);
// 그룹 키(예: "teacherStudent")가 아니라, 실제 플레이어에게 배정되는 개별 role 키를 전부 펼친 목록.
// (예: teacherStudent 그룹은 "teacher"/"student" 두 role로 배정되므로, 이 목록에서 그 둘을 포함해야
//  특수직업 집계 등에서 일반직업이 잘못 새지 않는다.)
export const CITIZEN_GENERAL_ROLE_KEYS = Object.values(CITIZEN_GENERAL_ROLE_GROUPS).flat();

// 교사가 수업할 수 있는 직업: 시민팀 필수(7회)·특수(5회)·일반(3회) 세 카테고리. 교사·학생 본인과 순수 시민은 제외.
export const TEACHABLE_FORCED_ROLES = ["police", "doctor"];
export const TEACHABLE_SPECIAL_ROLES = CITIZEN_SPECIAL_ROLES.filter((r) => !TEACHABLE_FORCED_ROLES.includes(r) && r !== "newlywed");
export const TEACHABLE_GENERAL_ROLES = ["counselor"];
export function requiredLessonsFor(roleKey) {
  if (TEACHABLE_FORCED_ROLES.includes(roleKey)) return 7;
  if (TEACHABLE_GENERAL_ROLES.includes(roleKey)) return 3;
  return 5; // 특수직업
}

export const NIGHT_ABILITY_ROLES = [
  "mafia", "spy", "framer", "blocker", "silencer", "police", "doctor", "soldier", "reporter", "detective",
  "cultist", "vampire", "witch", "undertaker", "thief", "werewolf", "priest", "cat", "conartist", "bodyguard", "godfather", "judge", "mercenary",
];
/** 7일차 아침(능력 선택 단계)에 살아있는 해당 직업이 고를 수 있는 추가 능력 카드. */
export const POWER_CARDS = {
  police: [
    { id: "police_hitman", title: "사살 작전", desc: "조사 능력은 사라지며 총을 지니게 되고, 밤마다 사람 한 명을 죽일 수 있습니다." },
    { id: "police_double", title: "강력 수사", desc: "밤마다 이제 두 명을 조사할 수 있습니다." },
    { id: "police_warrant", title: "영장", desc: "이미 조사한 적 있는 플레이어를 한 번 더 조사하면, 해당 플레이어의 정확한 직업을 알 수 있습니다." },
  ],
  mafia: [
    { id: "mafia_disguise", title: "위장", desc: "더 이상 조사로 인해 [마피아]라고 밝혀지지 않습니다. (기자의 특종은 제외)" },
    { id: "mafia_outlaw", title: "무법자", desc: "이제 밤에 플레이어 두 명을 죽일 수 있습니다." },
    { id: "mafia_apprentice", title: "수습", desc: "플레이어를 죽이는 데 성공한다면, 해당 플레이어의 직업을 알 수 있습니다." },
  ],
  spy: [
    { id: "spy_assassin", title: "암살", desc: "조사 능력이 사라지며, 이제 밤마다 플레이어 한 명을 죽일 수 있습니다." },
    { id: "spy_seduce", title: "미인계", desc: "조사하기로 선택한 플레이어를 유혹해서 능력도 발동할 수 없게 합니다. (단, 연속으로 같은 사람 지목 불가능)" },
    { id: "spy_autopsy", title: "부검", desc: "이제 죽은 사람도 조사할 수 있습니다." },
  ],
  silencer: [
    { id: "silencer_disguise", title: "위장", desc: "조사 능력 및 처형으로 마피아팀으로 밝혀지지 않습니다." },
    { id: "silencer_trafficking", title: "인신매매", desc: "납치 능력은 사라지며, 단 한 번 플레이어 한 명을 게임에서 제외시킵니다. (죽는 건 아니며, 보안관의 감옥과 비슷한 시스템)" },
    { id: "silencer_brainwash", title: "세뇌", desc: "납치 능력은 사라지며, 단 한 번 플레이어 한 명을 세뇌시켜 마피아팀으로 영입합니다. (중립은 불가능)" },
  ],
  terrorist: [
    { id: "terrorist_arson", title: "방화", desc: "기존의 능력은 사라지며, 이제 밤마다 한 명을 선택하여 표식을 남기거나 방화를 할 수 있습니다. 방화를 선택하면 그날 밤이 끝날 때 표식을 남긴 모든 사람과 함께 불타 죽습니다. (의사의 보호와 군인의 방어는 막아낼 수 있습니다)" },
    { id: "terrorist_selfdestruct", title: "자폭", desc: "낮에 플레이어 한 명을 선택합니다. 능력이 발동되면 무조건 선택한 플레이어와 함께 자폭합니다." },
    { id: "terrorist_bigbomb", title: "거대 폭탄", desc: "능력이 발동되면 랜덤으로 마피아팀이 아닌 플레이어 두 명과 함께 자폭합니다." },
  ],
  witch: [
    { id: "witch_high", title: "고위 마녀", desc: "저주를 걸 수 있는 횟수가 2회 더 늘어납니다." },
    { id: "witch_mindcontrol", title: "정신 지배", desc: "저주 능력은 사라집니다. 게임당 단 한 번, 밤에 플레이어 한 명의 정신을 지배합니다. 지배당한 플레이어는 마녀가 죽을 때까지 마녀의 꼭두각시가 되어, 마녀가 그 플레이어의 화면으로 직접 능력·채팅·투표를 모두 조작합니다. 지배당한 본인은 화면을 볼 수만 있습니다." },
    { id: "witch_ancient", title: "고대 주술", desc: "모든 플레이어에게 30% 확률로 저주를 겁니다. (확률은 개개인마다 따로 적용되며, 마피아팀도 저주에 걸릴 수 있습니다)" },
  ],
  conartist: [
    { id: "conartist_legend", title: "전설의 사기꾼", desc: "이제 변장한 직업의 능력을 쓸 수 있게 됩니다. (중립·일반직업·연인의 능력은 쓸 수 없으며, 조사 결과는 사기꾼 본인에게만 전달됩니다)" },
    { id: "conartist_master", title: "변장의 달인", desc: "밤마다 플레이어를 선택하여 새로운 변장을 할 수 있습니다." },
    { id: "conartist_rig", title: "투표 조작", desc: "낮에 플레이어 한 명을 선택할 수 있습니다. 해당 플레이어에게 가는 낮 투표는 모두 무효가 됩니다." },
  ],
  godfather: [
    { id: "godfather_legend", title: "전설의 등장", desc: "마피아가 모두 죽으면 전성기 시절로 돌아가 밤에는 절대 죽지 않으며, 매일 밤 플레이어 한 명을 선택하여 죽일 수 있게 됩니다." },
    { id: "godfather_deal", title: "어둠의 거래", desc: "추가로 한 명 더 마피아팀으로 영입할 수 있습니다." },
    { id: "godfather_nightlord", title: "밤의 지배자", desc: "단 한 번, 밤에 발동하면 그날 밤 마피아팀을 제외한 모든 플레이어가 사용한 직업 능력이 전부 무효화됩니다." },
  ],
  framer: [
    { id: "framer_wiretap", title: "도청", desc: "낮에 플레이어를 선택할 수 있게 됩니다. 밤에 해당 플레이어가 채팅방이 있다면 해당 채팅방을 염탐할 수 있습니다. (채팅방에 누가 몇 명 있는지는 알 수 없고, 올라오는 대화 내용만 볼 수 있습니다)" },
    { id: "framer_virus", title: "바이러스", desc: "기존의 해킹 능력은 사라지며, 밤마다 플레이어 한 명을 선택합니다. 해당 플레이어는 30% 확률로 직업 능력을 영구적으로 잃게 됩니다. (한 번 지목한 플레이어는 실패하더라도 다시 지목할 수 없습니다)" },
    { id: "framer_proxy", title: "프록시", desc: "기존의 해킹 능력은 사라지며, 밤마다 플레이어 한 명을 선택합니다. 그날 밤 누군가 해커에게 능력을 사용했다면, 그 능력은 해커 대신 선택한 플레이어에게 우회됩니다." },
  ],
  blocker: [
    { id: "blocker_charm", title: "현혹", desc: "기존의 능력은 사라지며, 단 한 번 플레이어 한 명을 선택할 수 있습니다. 해당 플레이어는 마담이 죽을 때까지 직업 능력이 봉인됩니다." },
    { id: "blocker_spy", title: "밀정", desc: "플레이어를 유혹하면 해당 플레이어의 직업을 알 수 있습니다." },
    { id: "blocker_host", title: "접대", desc: "플레이어를 유혹하면 다음 날 해당 플레이어의 투표권을 빼앗아 본인의 투표에 더할 수 있습니다." },
  ],
  hitman: [
    { id: "hitman_snipe", title: "저격", desc: "밤에 선택한 플레이어와 직업이 일치한다면, 모든 방해를 무시하고 해당 플레이어는 반드시 죽습니다." },
    { id: "hitman_poison", title: "독살", desc: "기존의 능력은 사라집니다. 낮에 플레이어 한 명을 선택하여 독을 먹일 수 있습니다. 해당 플레이어는 다음 날 죽습니다." },
    { id: "hitman_multi", title: "다중암살", desc: "이제 밤에 두 명의 플레이어를 선택하게 됩니다. 단, 두 명 모두 직업을 맞춰야 죽일 수 있습니다. (한 명만 맞추면 아무도 죽지 않음)" },
  ],
  doctor: [
    { id: "doctor_checkup", title: "검진", desc: "밤에 치료 대상으로 선택한 플레이어의 직업도 알 수 있습니다." },
    { id: "doctor_divine", title: "신의 손", desc: "모든 방해를 무시하고 치료가 무조건 성공합니다." },
    { id: "doctor_hospitalize", title: "강제 입원", desc: "단 한 번 플레이어 한 명을 강제로 입원시켜서 게임에서 제외시킵니다. (죽는 건 아니며, 보안관의 감옥과 비슷한 시스템)" },
  ],
  reporter: [
    { id: "reporter_abuse", title: "어뷰징", desc: "특종을 한 번 더 사용할 수 있습니다." },
    { id: "reporter_infiltrate", title: "잠입취재", desc: "낮에 플레이어를 선택할 수 있게 됩니다. 그날 밤, 해당 플레이어에게 채팅방이 있다면 그 대화를 염탐할 수 있습니다. 어떤 채팅방인지, 누가 참여해 있는지는 알 수 없고 채팅 내용만 볼 수 있으며, 직접 채팅을 칠 수는 없습니다." },
  ],
  medium: [
    { id: "medium_exorcise", title: "성불", desc: "밤에 죽은 플레이어 한 명을 성불시켜 정확한 직업을 알아냅니다. 조사 결과는 내 플레이어 목록에도 기재되며, 성불된 플레이어는 더 이상 영매 채팅방에서 채팅을 칠 수 없습니다." },
    { id: "medium_possess", title: "빙의", desc: "단 한 번, 죽은 플레이어를 선택해 빙의하면 그 직업의 능력을 한 번 사용할 수 있습니다. 능력을 쓰기 전까지 빙의는 유지됩니다. (밤에 발동하는 시민팀 필수·특수직업의 기본 능력만 가능)" },
  ],
  soldier: [
    { id: "soldier_boss", title: "골목대장", desc: "밤에 플레이어를 협박하면, 다음 날 자신의 투표가 2표가 됩니다." },
    { id: "soldier_grit", title: "불굴의 집념", desc: "단 한 번, 밤에 죽음에 이르는 공격을 받아도 버텨냅니다. (군인과 같은 능력)" },
  ],
  newlywed: [
    { id: "newlywed_revenge", title: "피의 복수", desc: "상대 연인이 나 대신 죽었다면, 밤에 단 한 번 플레이어 한 명을 죽일 수 있습니다. (함께 죽는 대가는 없습니다)" },
    { id: "newlywed_soulwed", title: "영혼 결혼식", desc: "연인은 죽어도 밤에 연인 채팅을 칠 수 있습니다. (죽은 연인은 영매 채팅과 연인 채팅을 모두 쓸 수 있습니다)" },
  ],
  politician: [
    { id: "politician_dictator", title: "독재", desc: "보안관이 즉시 정치인으로 교체되며, 마피아팀이 아닌 사람을 처형해도 감옥에 가지 않습니다." },
    { id: "politician_incite", title: "선동", desc: "정치인이 투표한 플레이어가 받은 투표수가 두 배가 됩니다." },
  ],
  detective: [
    { id: "detective_deduce", title: "명추리", desc: "기존의 능력은 사라지며, 단 한 번 낮에 전날 밤 죽은 플레이어를 선택하면 누가 그 플레이어를 죽였는지 알 수 있습니다." },
    { id: "detective_identity", title: "신원 조사", desc: "기존의 능력은 사라지며, 이제 밤마다 플레이어 한 명의 직업을 알 수 있습니다. (스파이의 기본 능력과 동일)" },
  ],
  veteran: [
    { id: "veteran_will", title: "불굴의 의지", desc: "밤에 죽음에 이르는 공격으로부터 한 번 더 살아남을 수 있습니다." },
    { id: "veteran_pmc", title: "민간군사", desc: "밤에 단 한 번, 플레이어 한 명을 선택해 죽일 수 있습니다." },
  ],
  undertaker: [
    { id: "undertaker_autopsy", title: "사법부검", desc: "죽은 플레이어를 조사하면, 어떤 방식의 공격으로 죽었는지도 함께 알 수 있습니다. (검시관과 같은 단서)" },
    { id: "undertaker_relic", title: "유품수거", desc: "단 한 번, 죽은 플레이어의 유품을 수거하면 그 직업의 능력을 한 번 사용할 수 있습니다. 능력을 쓰기 전까지 유지됩니다. (밤에 발동하는 시민팀 필수·특수직업의 기본 능력만 가능)" },
  ],
  judge: [
    { id: "judge_ruling", title: "판결문", desc: "이제 판사가 직접 처형을 결정한 플레이어의 직업이 모든 플레이어에게 공개됩니다." },
    { id: "judge_plea", title: "사법거래", desc: "단 한 번, 판사가 처형을 결정한 플레이어가 마피아팀이라면 처형 대신 감옥으로 보내고, 마피아팀의 다른 플레이어 한 명의 직업을 모두에게 공개합니다." },
  ],
  official: [
    { id: "official_rig", title: "부정투표", desc: "처형 투표에서 가장 많은 표를 받은 상위 두 명 중, 최후 변론에 세울 한 명을 직접 고를 수 있습니다." },
    { id: "official_audit", title: "행정조사", desc: "기존의 능력은 사라지며, 밤마다 플레이어 한 명이 마피아팀인지 시민팀인지 알 수 있습니다. (스파이처럼 조사에 걸리지 않는 마피아팀 직업도 마피아팀으로 나옵니다)" },
  ],
  priest: [
    { id: "priest_inquisition", title: "이단심판", desc: "단 한 번, 낮에 플레이어 한 명을 공개적으로 처형대에 세우고, 최후 변론 뒤 처형 여부를 결정합니다. (보안관과 비슷하지만 무고한 사람을 처형해도 감옥에 가지 않습니다)" },
    { id: "priest_saint", title: "성녀", desc: "기존의 부활 능력은 사라지며, 매일 밤 플레이어 한 명을 죽음에 이르는 공격으로부터 보호합니다. (의사와 같지만 자기 자신은 보호할 수 없습니다)" },
  ],
  bodyguard: [
    { id: "bodyguard_elite", title: "엘리트 요원", desc: "이제부터 경호에 성공해도 죽지 않습니다. (의사처럼 보호하지만 자기 자신은 보호할 수 없습니다)" },
    { id: "bodyguard_lastword", title: "결정적 유언", desc: "경호에 성공해 대신 죽었다면, 자신을 죽인 플레이어가 다음 날 모든 플레이어에게 공개됩니다." },
  ],
};

/** [빙의]·[유품수거]로 빌려 쓸 수 있는 직업 - 밤에 발동하는 시민팀 필수·특수직업의 기본 능력 */
export const POSSESSABLE_ROLES = ["police", "doctor", "reporter", "soldier", "detective", "undertaker", "judge", "priest", "bodyguard"];

/** 밤의 공격을 자동으로 버텨낼 수 있는 횟수 - 군인(기본 1, [불굴의 의지] 2), [불굴의 집념] 건달 1 */
export function nightDefenseMax(p) {
  if (!p) return 0;
  let n = 0;
  if (actsAsRole(p, "veteran")) n = p.role === "veteran" && p.powerUpgrade === "veteran_will" ? 2 : 1;
  if (p.role === "soldier" && p.powerUpgrade === "soldier_grit" && !isAbilityDisabled(p)) n = Math.max(n, 1);
  return n;
}
export function defenseUsedCount(p) {
  return p?.defenseUsedCount ?? (p?.usedDefense ? 1 : 0);
}
export function hasNightDefense(p) {
  return !!p && defenseUsedCount(p) < nightDefenseMax(p);
}
function consumeDefense(p) {
  const used = defenseUsedCount(p) + 1;
  return { ...p, defenseUsedCount: used, usedDefense: used >= nightDefenseMax(p) };
}
function defenseRoleLabel(p) {
  return actsAsRole(p, "veteran") ? ROLES.veteran.label : ROLES[p.role].label;
}

/** [전설의 사기꾼]이 위장한 직업으로 쓸 수 있는 능력 - 중립·일반직업·연인을 제외한 모든 직업 */
export const CONARTIST_LEGEND_ROLES = [
  ...CITIZEN_SPECIAL_ROLES.filter((r) => r !== "newlywed"),
  "mafia", ...MAFIA_SPECIAL_ROLES.filter((r) => r !== "conartist"),
];
/** 그중 밤에 대상을 고르지 않고 저절로 발동하는(패시브) 능력 */
export const CONARTIST_LEGEND_PASSIVE_ROLES = ["medium", "politician", "veteran", "official", "terrorist"];
/** 그중 게임당 한 번만 쓸 수 있는 밤 능력 (사기꾼 본인 기준으로 따로 센다) */
export const CONARTIST_LEGEND_ONCE_ROLES = ["reporter", "witch", "priest", "judge", "godfather"];

/** [전설의 사기꾼]이 위장해서 그 직업의 능력을 빌려 쓰고 있는지 */
export function legendDisguiseOf(p) {
  if (!p || p.role !== "conartist" || p.powerUpgrade !== "conartist_legend" || !p.disguisedAs) return null;
  return CONARTIST_LEGEND_ROLES.includes(p.disguisedAs) ? p.disguisedAs : null;
}
/** 실제 직업이 role이거나, [전설의 사기꾼]으로 그 직업에 위장해 능력을 빌려 쓰는 중인지 */
export function actsAsRole(p, role) {
  if (!p || isAbilityDisabled(p)) return false;
  return p.role === role || legendDisguiseOf(p) === role;
}
/** [정신 지배] - 이 사람을 조종 중인 마녀의 id. 마녀가 살아있는 동안에만 유효하다 (마녀가 죽으면 풀린다). */
export function puppeteerOf(state, playerId) {
  if (!state || state.phase === "gameover") return null; // 게임이 끝나면 모두 풀려난다 (명예 선물 등)
  const p = state.players?.find((x) => x.id === playerId);
  if (!p || !p.mindControlledBy) return null;
  const witch = state.players.find((x) => x.id === p.mindControlledBy);
  return witch && witch.alive ? witch.id : null;
}
/** 마녀가 지금 조종 중인 꼭두각시의 id (없거나 마녀·꼭두각시가 죽었으면 null) */
export function puppetOf(state, witchId) {
  const puppet = state?.players?.find((x) => x.mindControlledBy === witchId);
  return puppet && puppeteerOf(state, puppet.id) === witchId ? puppet.id : null;
}
/** 예전 [정신 지배](그날 밤 채팅·능력 봉쇄)는 없어졌다 - 호환용으로 항상 null */
export function mindControlledChatId() {
  return null;
}
/** [바이러스]로 직업 능력을 영구히 잃었거나, [현혹]으로 마담이 죽을 때까지 능력이 봉인된 상태인지 */
export function isAbilityDisabled(p) {
  return !!p && (!!p.abilityLost || !!p.abilitySealed);
}
/** [프록시] - 해커에게 쓰인 능력을 해커가 고른 사람에게 우회시킨다. 즉시 발동하는 능력(강제 입원 등)에도 적용한다. */
function proxyRedirectTarget(state, targetId, actorId) {
  if (!targetId) return targetId;
  const hacker = state.players.find((p) => p.id === targetId);
  if (!hacker || hacker.role !== "framer" || hacker.powerUpgrade !== "framer_proxy" || !hacker.alive || hacker.inJail || isAbilityDisabled(hacker)) return targetId;
  const to = state.framerTarget;
  if (!to || to === hacker.id || to === actorId) return targetId;
  const toPlayer = state.players.find((p) => p.id === to);
  return toPlayer && toPlayer.alive ? to : targetId;
}
/** 밤 결과 계산 직전에, 해커([프록시])에게 향한 모든 밤 능력의 대상을 해커가 고른 사람으로 바꿔 끼운다. */
function applyProxyRedirect(state) {
  const hacker = state.players.find((p) => p.role === "framer" && p.powerUpgrade === "framer_proxy" && p.alive && !p.inJail && !isAbilityDisabled(p));
  const to = hacker ? state.framerTarget : null;
  const toPlayer = to ? state.players.find((p) => p.id === to && p.alive) : null;
  if (!hacker || !toPlayer || to === hacker.id) return state;
  let count = 0;
  const swap = (id) => (id === hacker.id ? (count++, to) : id);
  const patch = {};
  [...Object.values(ROLE_TARGET_KEY), "hitmanTargetId", "hitmanSecondTargetId", "policeSecondTarget", "conartistLegendTarget"].forEach((k) => {
    if (k === "framerTarget" || k === "mafiaTarget") return;
    if (state[k] === hacker.id) patch[k] = swap(state[k]);
  });
  const swapVotes = (votes) => Object.fromEntries(Object.entries(votes || {}).map(([v, t]) => [v, swap(t)]));
  patch.mafiaVotes = swapVotes(state.mafiaVotes);
  patch.mafiaSecondVotes = swapVotes(state.mafiaSecondVotes);
  return { ...state, ...patch, framerProxyResult: { targetName: toPlayer.name, redirected: count } };
}
/** 판사의 판결권을 가진 사람 - 진짜 판사가 우선이고, 없으면 판사로 위장한 [전설의 사기꾼] */
export function findJudgeActor(players, excludeIds = []) {
  const ok = (p) => p.alive && !p.inJail && !isAbilityDisabled(p) && !excludeIds.includes(p.id);
  return players.find((p) => p.role === "judge" && ok(p)) || players.find((p) => legendDisguiseOf(p) === "judge" && ok(p)) || null;
}
/** 낮 채팅이 막힌 사람 (유괴범의 납치 + 유괴범으로 위장한 사기꾼의 납치) */
function isChatBlocked(state, id) {
  return !!id && (id === state.blockedChatterId || id === state.extraBlockedChatterId);
}
/** 투표가 막힌 사람 (건달의 협박 + 건달로 위장한 사기꾼의 협박) */
function isVoteBlocked(state, id) {
  return !!id && (id === state.blockedVoterId || id === state.extraBlockedVoterId || id === state.hostedVoterId || id === state.possessBlockedVoterId);
}
/** 투표 가중치 - 정치인은 2표, [접대]를 쓴 마담은 빼앗은 투표권만큼 더한다 */
function voteWeight(state, voter) {
  let w = actsAsRole(voter, "politician") ? 2 : 1;
  if (state.soldierBossVoterId && voter.id === state.soldierBossVoterId) w += 1; // [골목대장]
  if (state.hostVoterBy && voter.id === state.hostVoterBy) {
    const hosted = state.players.find((p) => p.id === state.hostedVoterId);
    if (hosted && hosted.alive) w += actsAsRole(hosted, "politician") ? 2 : 1;
  }
  return w;
}

export const ROLE_TARGET_KEY = {
  mafia: "mafiaTarget", spy: "spyTarget", framer: "framerTarget", blocker: "blockerTarget", silencer: "silencerTarget",
  police: "policeTarget", doctor: "doctorTarget", soldier: "soldierTarget", reporter: "reporterTarget", detective: "detectiveTarget",
  cultist: "cultistTarget", vampire: "vampireTarget", witch: "witchTarget", undertaker: "undertakerTarget",
  avenger: "avengerTarget",
  thief: "thiefTarget",
  werewolf: "werewolfTarget",
  priest: "priestTarget",
  conartist: "conartistTarget",
  bodyguard: "bodyguardTarget",
  godfather: "godfatherTarget",
  judge: "judgePardonTarget",
  mercenary: "mercenaryTarget",
  cat: "catOwnerTarget",
  cat_detect: "catDetectTarget",
  medium: "mediumTarget",
  official: "officialTarget",
  veteran: "veteranTarget",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/**
 * 인원수별 밸런스 표.
 * mafiaTeam: 마피아팀 총원(마피아+스파이+모함꾼+방해꾼+입막음꾼 전부 합쳐서)
 * mafiaSpecials: 그중 "특수 능력이 있는" 인원 수 (나머지는 순수 마피아)
 * citizenSpecials: 시민팀 중 특수직업 슬롯 수 (연인은 2슬롯 소모)
 */
const BALANCE_TABLE = [
  { max: 4, mafiaTeam: 1, mafiaSpecials: 0, citizenSpecials: 0 },
  { max: 5, mafiaTeam: 1, mafiaSpecials: 0, citizenSpecials: 1 },
  { max: 7, mafiaTeam: 2, mafiaSpecials: 1, citizenSpecials: 2 },
  { max: 9, mafiaTeam: 2, mafiaSpecials: 1, citizenSpecials: 2 },
  { max: 11, mafiaTeam: 3, mafiaSpecials: 2, citizenSpecials: 3 },
  { max: 13, mafiaTeam: 3, mafiaSpecials: 2, citizenSpecials: 4 },
  { max: 15, mafiaTeam: 4, mafiaSpecials: 3, citizenSpecials: 4 },
  { max: 17, mafiaTeam: 4, mafiaSpecials: 3, citizenSpecials: 5 },
  { max: 19, mafiaTeam: 5, mafiaSpecials: 3, citizenSpecials: 5 },
  { max: Infinity, mafiaTeam: 6, mafiaSpecials: 4, citizenSpecials: 6 },
];

export function getBalanceForCount(n) {
  for (const tier of BALANCE_TABLE) {
    if (n <= tier.max) return { mafiaTeam: tier.mafiaTeam, mafiaSpecials: tier.mafiaSpecials, citizenSpecials: tier.citizenSpecials };
  }
  const last = BALANCE_TABLE[BALANCE_TABLE.length - 1];
  return { mafiaTeam: last.mafiaTeam, mafiaSpecials: last.mafiaSpecials, citizenSpecials: last.citizenSpecials };
}

// 구버전 호환용 - 더 이상 내부적으로 쓰이진 않지만 혹시 참조하는 곳이 있을까봐 남겨둠
export function getMafiaCount(n) {
  return getBalanceForCount(n).mafiaTeam;
}

export function alivePlayers(players) { return players.filter((p) => p.alive); }
/** 죽었는데도 isSheriff가 true로 남아있는 사람을 찾아 확실히 박탈한다.
 *  보안관이 죽는 경로가 워낙 많아서(마피아 습격, 히트맨, 처형, 자폭 등) 죽는 지점마다 일일이
 *  isSheriff:false를 챙기는 대신, 사망 처리가 끝나는 지점마다 이 함수로 한 번에 정리한다. */
function clearDeadSheriffFlag(players) {
  return players.map((p) => {
    let q = !p.alive && p.isSheriff ? { ...p, isSheriff: false } : p;
    // [현혹]의 봉인은 마담이 죽으면 풀린다 - 사망 처리가 끝나는 지점마다 함께 정리한다.
    if (q.abilitySealed && q.sealedByBlockerId && !players.find((x) => x.id === q.sealedByBlockerId)?.alive) {
      q = { ...q, abilitySealed: false, sealedByBlockerId: null };
    }
    return q;
  });
}

/** 죽음을 당할 대상(targetId)이 신혼부부이고 배우자가 살아있다면, 대상 대신 배우자가 죽고
 *  대상은 '복수자'(isAvenger)가 되어 게임당 한 번 밤에 누군가를 죽일 수 있게 된다.
 *  어떤 수단(마피아·늑대인간·히트맨·용병·건달)으로 습격당했든 이 스왑은 동일하게 적용된다.
 *  스왑이 일어났다면 실제로 죽을 사람(배우자)의 id를, 아니라면 원래 targetId를 그대로 반환한다. */
// 테러리스트가 처형되어(낮 투표 또는 보안관 즉결처형) 자폭이 발동할 때 호출한다.
// [자폭] 능력이면 낮에 미리 지목해둔 대상과 무조건 함께 죽고, [거대 폭탄] 능력이면 마피아팀이 아닌
// 무작위 두 명과 함께 죽으며, 아무 능력도 고르지 않았다면 기존처럼 무작위 한 명과 함께 죽는다.
function applyTerroristBomb(players, terrorist, log, selfdestructTargetId) {
  let updatedPlayers = players;
  const nonMafiaCandidates = () => updatedPlayers.filter((p) => p.alive && !p.inJail && !isMafiaAligned(p) && p.role !== "cat");
  // [방화]를 고르면 기존 자폭 능력은 사라진다.
  if (terrorist.powerUpgrade === "terrorist_arson") return { players: updatedPlayers, victimNames: [] };
  if (terrorist.powerUpgrade === "terrorist_selfdestruct") {
    const target = selfdestructTargetId ? updatedPlayers.find((p) => p.id === selfdestructTargetId && p.alive && p.role !== "cat") : null;
    if (!target) return { players: updatedPlayers, victimNames: [] };
    updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, alive: false, deathCause: "terroristBomb" } : p));
    log.push(`💣 테러리스트의 자폭으로 ${target.name}님이 함께 목숨을 잃었습니다.`);
    return { players: updatedPlayers, victimNames: [target.name] };
  }
  if (terrorist.powerUpgrade === "terrorist_bigbomb") {
    const pool = nonMafiaCandidates();
    const picked = [];
    for (let i = 0; i < 2 && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    picked.forEach((v) => { updatedPlayers = updatedPlayers.map((p) => (p.id === v.id ? { ...p, alive: false, deathCause: "terroristBomb" } : p)); });
    if (picked.length) log.push(`💣 테러리스트의 거대 폭탄으로 ${picked.map((v) => v.name).join(", ")}님이 함께 목숨을 잃었습니다.`);
    return { players: updatedPlayers, victimNames: picked.map((v) => v.name) };
  }
  const candidates = nonMafiaCandidates();
  if (candidates.length === 0) return { players: updatedPlayers, victimNames: [] };
  const victim = candidates[Math.floor(Math.random() * candidates.length)];
  updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, alive: false, deathCause: "terroristBomb" } : p));
  log.push(`💣 테러리스트의 자폭으로 ${victim.name}님이 함께 목숨을 잃었습니다.`);
  return { players: updatedPlayers, victimNames: [victim.name] };
}

function applyNewlywedSwap(players, targetId) {
  const target = players.find((p) => p.id === targetId);
  if (target && target.role === "newlywed" && target.partnerId && !isAbilityDisabled(target)) {
    const partner = players.find((p) => p.id === target.partnerId);
    if (partner && partner.alive) {
      const updated = players.map((p) => (p.id === target.id ? { ...p, isAvenger: true } : p));
      return { players: updated, actualTargetId: partner.id };
    }
  }
  return { players, actualTargetId: targetId };
}

/** 살아있는 뱀파이어(뱀파이어 본인 + 흡혈귀가 된 사람 전원) 인원 */
function countVampireTeam(alive) {
  return alive.filter((p) => p.role === "vampire" || p.isThrall).length;
}

export function checkWinner(players) {
  // 감옥에 간 사람은 죽은 건 아니지만 완전히 탈락 취급이라, 모든 승리 조건 계산에서 제외한다.
  const alive = alivePlayers(players).filter((p) => !p.inJail);
  if (alive.length === 0) return null;
  const vampireTeamAlive = countVampireTeam(alive);
  // 흡혈귀가 된 사람은 원래 팀에서 빠진다 (isMafiaAligned/isCitizenAligned가 흡혈귀를 제외한다).
  // 마피아와 동맹한 늑대인간·마피아팀 고양이·영입된 사람·마피아와 접선한 용병은 마피아팀으로 센다.
  const mafiaTeamAlive = alive.filter((p) => isMafiaAligned(p)).length;
  const unalliedWolf = alive.find((p) => p.role === "werewolf" && !p.isWolfAllied && !p.isThrall);

  // ① 뱀파이어팀(뱀파이어 본인 + 흡혈귀) 수가 나머지 전체보다 많으면 뱀파이어 승리 - 뱀파이어 본인이 죽었어도 마찬가지다.
  if (vampireTeamAlive > 0 && vampireTeamAlive > alive.length - vampireTeamAlive) return "vampire";

  // ② 마피아와 동맹하지 않은 늑대인간: 습격 10명 / 상대가 한 명만 남음 / 혼자 살아남음
  if (unalliedWolf && (unalliedWolf.werewolfKillCount || 0) >= 10) return "werewolf";
  if (unalliedWolf && alive.length === 1) return "werewolf";
  if (unalliedWolf && alive.length === 2 && vampireTeamAlive === 0) return "werewolf";

  // ③ 악마 숭배자가 혼자 살아남으면 숭배자 승리
  if (alive.length === 1 && alive[0].role === "cultist") return "cultist";

  // ④ 마피아팀이 전멸했는지 - 처형도 습격도 통하지 않는 마피아팀 고양이는 "전멸" 판정에서 뺀다
  //    (마피아팀 고양이만 남으면 더 이상 싸울 수 있는 마피아가 없으므로 시민팀 승리).
  const mafiaFightersAlive = alive.filter((p) => isMafiaAligned(p) && p.role !== "cat").length;

  // 건달과 용병이 짝을 이루면(둘 다 중립으로 전향) 둘만의 별도 세력이 된다.
  const soldierPlayer = players.find((p) => p.role === "soldier");
  const mercenaryPlayer = players.find((p) => p.role === "mercenary");
  const isMercSoldierPair = !!(mercenaryPlayer && mercenaryPlayer.mercenaryContactedBy === "soldier");
  const mercPairAlive = isMercSoldierPair
    ? [soldierPlayer, mercenaryPlayer].filter((p) => p && p.alive && !p.inJail)
    : [];

  if (mafiaFightersAlive === 0) {
    if (unalliedWolf) return null;
    if (mercPairAlive.length > 0) {
      // 건달+용병 동맹이 살아있다면, 시민팀 필수·특수직업이 모두 죽었으면 건달+용병 승리, 아니면 계속
      const citizenForcedOrSpecialAlive = alive.filter((p) =>
        p.id !== soldierPlayer?.id && !p.isThrall && (p.role === "police" || p.role === "doctor" || CITIZEN_SPECIAL_ROLES.includes(p.role))
      ).length;
      if (citizenForcedOrSpecialAlive === 0) return "mercenary";
      if (mercPairAlive.length >= alive.length - mercPairAlive.length) return "mercenary";
      return null;
    }
    // 뱀파이어 본인이 살아있다면 시민팀은 승리할 수 없다 (흡혈귀만 남은 경우는 상관없다).
    if (alive.find((p) => p.role === "vampire")) return null;
    // 악마 숭배자가 살아있다면 시민팀은 승리할 수 없다. (괴도는 살아있어도 시민팀이 승리한다)
    if (alive.find((p) => p.role === "cultist")) return null;
    return "citizen";
  }

  // ⑤ 마피아팀 수가 마피아팀이 아닌 사람 수와 같거나 많으면 마피아 승리 - 중립이 살아있어도 확정이다.
  if (mafiaTeamAlive >= alive.length - mafiaTeamAlive) return "mafia";

  // ⑥ 건달+용병 동맹의 인원수가 나머지 전체 인원수와 같거나 많아지면 곧바로 중립 승리한다.
  if (mercPairAlive.length > 0 && mercPairAlive.length >= alive.length - mercPairAlive.length) return "mercenary";
  return null;
}

/**
 * 전적 기록용: 특정 플레이어가 최종 승자(winner)와 같은 편이었는지 판정한다.
 * 흡혈귀로 전환된 사람은 원래 팀이 아니라 뱀파이어 팀 소속으로 판정한다 (승리 조건 계산과 동일한 기준).
 */
export function didPlayerWin(player, winner) {
  if (!winner) return false;
  if (player.isThrall) return winner === "vampire";
  if (player.role === "vampire") return winner === "vampire";
  if (player.role === "cultist" || player.role === "thief") return player.role === winner;
  if (player.role === "werewolf") return player.isWolfAllied ? winner === "mafia" : winner === "werewolf";
  if (player.role === "cat") return player.catAlignment ? winner === player.catAlignment : false;
  if (player.role === "mercenary") {
    if (player.mercenaryContactedBy === "mafia") return winner === "mafia";
    if (player.mercenaryContactedBy === "police") return winner === "citizen";
    if (player.mercenaryContactedBy === "soldier") return winner === "mercenary";
    return false;
  }
  if (player.role === "soldier" && player.pairedWithMercenary) return winner === "mercenary";
  if (player.recruitedToMafia) return winner === "mafia"; // 대부·세뇌로 마피아팀에 편입된 사람
  const team = ROLES[player.role].team;
  if (team === "mafia") return winner === "mafia";
  if (team === "citizen") return winner === "citizen";
  return false;
}

/** 후보 풀에서 예산(슬롯 수)을 넘지 않는 선에서 무작위로 역할을 골라낸다. */
function pickRandomRolesWithinBudget(pool, budget, costMap = {}) {
  const shuffled = shuffle(pool);
  const chosen = [];
  let remaining = budget;
  for (const role of shuffled) {
    const cost = costMap[role] || 1;
    if (cost <= remaining) {
      chosen.push(role);
      remaining -= cost;
    }
  }
  return chosen;
}

/**
 * queueUsers: [{ channelId, nickname, profileImageUrl }]
 * config: { mafiaPool: {spy,framer,blocker,silencer}, citizenPool: {police,doctor,reporter,medium,soldier,lover,politician,detective} }
 * "체크한 직업"은 이제 확정 배정이 아니라 "등장 가능한 후보 풀"이며, 실제 등장 개수는
 * 인원수에 따른 밸런스 표를 기준으로 그 풀 안에서 무작위로 정해진다.
 */
export const FORCED_CITIZEN_ROLES = ["police", "doctor"];

export function assignRoles(queueUsers, config) {
  const n = queueUsers.length;
  const balance = getBalanceForCount(n);

  const mafiaPoolRoles = MAFIA_SPECIAL_ROLES.filter((r) => config.mafiaPool?.[r]);
  const chosenMafiaSpecials = pickRandomRolesWithinBudget(mafiaPoolRoles, balance.mafiaSpecials);
  const plainMafiaCount = Math.max(0, balance.mafiaTeam - chosenMafiaSpecials.length);

  // 경찰과 의사는 체크 여부와 무관하게 항상 시민팀에 포함된다.
  const optionalCitizenPoolRoles = CITIZEN_SPECIAL_ROLES.filter(
    (r) => !FORCED_CITIZEN_ROLES.includes(r) && config.citizenPool?.[r]
  );
  // 경찰·의사는 "필수 직업"이라 특수직업 예산을 소모하지 않는다. 그 예산은 온전히 다른 특수직업들에게 돌아간다.
  const remainingCitizenBudget = balance.citizenSpecials;
  // 신혼부부는 실제로는 두 명이 배정되지만, 특수직업 자리 예산은 1개만 차지한다.
  const chosenOptionalCitizenSpecials = pickRandomRolesWithinBudget(optionalCitizenPoolRoles, remainingCitizenBudget, { newlywed: 1 });
  const chosenCitizenSpecials = [...FORCED_CITIZEN_ROLES, ...chosenOptionalCitizenSpecials];

  const citizenTeamTotal = Math.max(0, n - balance.mafiaTeam);
  const usedCitizenSlots = chosenCitizenSpecials.reduce((sum, r) => sum + (r === "newlywed" ? 2 : 1), 0);

  // 중립 직업: 일반 시민 한 자리를 대신해서 매 게임 정확히 1명 등장한다.
  const neutralPoolRoles = NEUTRAL_ROLES.filter((r) => config.neutralPool?.[r]);
  const chosenNeutral = neutralPoolRoles.length > 0 ? [shuffle(neutralPoolRoles)[0]] : [];

  const plainCitizenCount = Math.max(0, citizenTeamTotal - usedCitizenSlots - chosenNeutral.length);

  // 일반직업: 특수직업 예산과 무관하게, 남은 순수 시민 자리에서 활성화된 것만큼 그룹째로 소비한다.
  // (예: 연인이 켜져 있고 남은 자리가 2명 이상이면 정확히 2명이 연인 한 쌍이 되고,
  //  교사&학생이 켜져 있으면 정확히 2명이 각각 교사 1명·학생 1명이 된다.)
  const enabledGeneralRoles = shuffle(CITIZEN_GENERAL_ROLES.filter((r) => config.citizenGeneralPool?.[r]));
  const chosenGeneralRoleBag = [];
  let remainingForGeneral = plainCitizenCount;
  for (const groupKey of enabledGeneralRoles) {
    const roles = CITIZEN_GENERAL_ROLE_GROUPS[groupKey];
    if (remainingForGeneral >= roles.length) {
      chosenGeneralRoleBag.push(...roles);
      remainingForGeneral -= roles.length;
    }
  }
  const plainCitizenLeftover = remainingForGeneral; // 일반직업으로도 못 채운 나머지는 순수 '시민'

  let bag = [];
  bag.push(...Array(plainMafiaCount).fill("mafia"));
  bag.push(...chosenMafiaSpecials);
  chosenCitizenSpecials.forEach((r) => (r === "newlywed" ? bag.push("newlywed", "newlywed") : bag.push(r)));
  bag.push(...chosenNeutral);
  bag.push(...chosenGeneralRoleBag);
  bag.push(...Array(plainCitizenLeftover).fill("citizen"));
  while (bag.length < n) bag.push("citizen"); // 안전장치
  bag = shuffle(bag).slice(0, n);

  const players = queueUsers.map((u, i) => ({
    id: u.channelId,
    name: u.nickname,
    profileImageUrl: u.profileImageUrl || null,
    role: bag[i],
    alive: true,
    partnerId: null,
    isThrall: false,
    usedDefense: false,
    soulHarvested: false,
    executedByVote: false,
    isAvenger: false, // 신혼부부의 배우자가 대신 죽어서 '복수자'가 된 경우 true
    avengerUsed: false,
    gem: null, // 괴도가 있는 게임에서, 괴도를 제외한 모두에게 몰래 배정되는 보석 종류
    isWolfAllied: false, // 늑대인간이 마피아와 같은 대상을 노려 마피아팀과 동맹한 경우 true
    werewolfKillCount: 0, // 늑대인간이 독립적으로(동맹 아닌 상태로) 습격에 성공한 누적 횟수 - 단독 승리 조건
    catAlignment: null, // 고양이가 집사를 임명한 뒤 편입된 팀 ("mafia" | "citizen" | null)
    catOwnerId: null, // 고양이가 임명한 집사의 id
    disguisedAs: null, // 사기꾼이 위장한 직업 (role key) - 한 번 정해지면 그 판 내내 유지
    recruitedToMafia: false, // 대부에게 영입되어 마피아팀으로 편입된 경우 true - 원래 직업/능력은 그대로 유지
    isSheriff: false, // 낮 회의시간에 한 명을 처형대에 세울 수 있는 보안관인지
    inJail: false, // 무고한 사람을 죽여 감옥에 간 전직 보안관 - 죽은 건 아니지만 완전히 탈락 취급, 죽은 사람 채팅도 볼 수 없음
    teachingProgress: {}, // 학생 전용 - { [roleKey]: 그 직업으로 받은 수업 횟수 } - 필요 횟수를 채우면 그 직업을 갖게 됨
    mercenaryContactedBy: null, // 용병 전용 - null | "mafia" | "police" | "soldier" - 최초로 누구에게 접선되었는지, 영구 고정
    diedToMafiaAttack: false, // 마피아(또는 그에 준하는 공격)에게 죽었는지 - "탱커" 업적 판정용
    doctorSaveCount: 0, // 의사 전용 - 이번 게임에서 몇 번 살렸는지 ("명의" 업적 판정용)
    policeInvestigatedMafiaIds: [], // 경찰 전용 - 조사로 정확히 마피아라고 밝혀낸 대상 id들 ("엘리트 수사관" 업적 판정용)
    reporterRevealedMafiaOnce: false, // 기자 전용 - 특종으로 '마피아'(순수 역할)를 밝혀낸 적 있는지
    bodyguardDiedProtectingDoctor: false, // 경호원 전용 - 의사를 지키다 대신 죽었는지
    detectiveSpyLead: null, // 탐정 전용 - { spyId, day } 스파이로 추정되는 대상을 조사한 기록
    detectiveCaughtSpyThenExecuted: false, // 탐정 전용 - 그 스파이가 다음날 처형까지 이어졌는지 ("명탐정 라삐" 업적)
    priestVampireLead: null, // 성직자 전용 - { vampireId, day } 뱀파이어로 추정되는 대상을 막아낸 기록
    priestCaughtVampireThenExecuted: false, // 성직자 전용 - 그 뱀파이어가 다음날 처형까지 이어졌는지 ("뱀파이어 사냥꾼" 업적)
    framerExposedNextDay: null, // 해커 전용 - { targetId, day } 조작한 대상이 다음날 기자에게 마피아로 공개됐는지 확인용
    terroristKilledForcedRole: false, // 테러리스트 전용 - 자폭으로 시민팀 필수직업을 죽였는지
    avengerKilledMafia: false, // 신혼부부(복수자) 전용 - 복수로 '마피아'(순수 역할)를 죽였는지
    godfatherRecruitedSoldier: false, // 대부 전용 - 건달을 영입했는지
    teacherGraduatedStudent: false, // 교사 전용 - 학생을 성공적으로 졸업시켰는지
    deathCause: null, // 죽었다면 무엇에 의해 죽었는지 - 검시관이 부검으로 알아내는 정보 (누구에게 죽었는지는 포함 안 함)
    powerUpgrade: null, // 7일차 낮에 고른 추가 능력 카드의 id (예: "police_hitman")
    reporterInfiltrateTargetId: null, // 기자 [잠입취재] - 낮에 골라둔, 그날 밤 대화를 엿볼 대상
    policeAllInvestigatedIds: [], // "영장" 능력 판정용 - 경찰이 지금까지 조사한 모든 대상 id 누적
    doctorHospitalizeUsed: false, // [강제 입원] 능력 - 게임당 단 한 번만 사용 가능
    silencerTraffickingUsed: false, // 유괴범 [인신매매] 능력 - 게임당 단 한 번만 사용 가능
    silencerBrainwashUsed: false, // 유괴범 [세뇌] 능력 - 게임당 단 한 번만 사용 가능
    terroristMarkedIds: [], // [방화] 능력 - 지금까지 표식을 남긴 대상 id 누적
    witchAncientUsed: false, // [고대 주술] 능력 - 게임당 단 한 번만 사용 가능
    studentGraduatedSuccessfully: false, // 학생 전용 - 졸업에 성공했는지
    mercenaryContactPlayerId: null, // 용병 전용 - 경찰/건달에게 접선된 경우, 그 상대방의 id (전용 채팅에 사용)
    pairedWithMercenary: false, // 건달 전용 - 용병과 짝을 이뤄 중립으로 전향했는지
  }));
  // 신혼부부는 정확히 한 쌍만 존재한다.
  const newlyweds = players.filter((p) => p.role === "newlywed");
  if (newlyweds.length === 2) { newlyweds[0].partnerId = newlyweds[1].id; newlyweds[1].partnerId = newlyweds[0].id; }
  // 연인(일반직업)도 이제 정확히 한 쌍만 존재한다.
  const lovers = players.filter((p) => p.role === "lover");
  if (lovers.length === 2) { lovers[0].partnerId = lovers[1].id; lovers[1].partnerId = lovers[0].id; }
  // 교사와 학생도 반드시 한 쌍으로 묶인다.
  const teacher = players.find((p) => p.role === "teacher");
  const student = players.find((p) => p.role === "student");
  if (teacher && student) { teacher.partnerId = student.id; student.partnerId = teacher.id; }
  // 괴도가 있으면, 괴도를 제외한 전원에게 보석을 최대한 골고루 나눠준다.
  const thief = players.find((p) => p.role === "thief");
  if (thief) {
    const others = shuffle(players.filter((p) => p.id !== thief.id));
    others.forEach((p, i) => { p.gem = GEM_TYPES[i % GEM_TYPES.length]; });
  }
  return players;
}

export function createGameState(players) {
  return {
    phase: "reveal",
    players,
    // 게임 시작 시점의 직업 배정을 그대로 얼려둔다. 백수가 나중에 다른 직업을 물려받아도
    // "마피아팀 X명(...) · 시민팀 Y명(...)" 같은 집계는 이 스냅샷 기준으로 고정되어야 하기 때문.
    initialRoles: Object.fromEntries(players.map((p) => [p.id, p.role])),
    dayNumber: 1,
    mafiaVotes: {}, mafiaSecondVotes: {}, spyTarget: null, framerTarget: null, blockerTarget: null, silencerTarget: null,
    policeTarget: null, policeSecondTarget: null, doctorTarget: null, soldierTarget: null, reporterTarget: null, detectiveTarget: null, mercenaryTarget: null,
    hitmanTargetId: null, hitmanGuessedRole: null, hitmanSecondTargetId: null, hitmanSecondGuessedRole: null,
    hitmanPoisonTargetId: null, hitmanPoisonDeathDay: null, // [독살] 능력 - 낮에 지정하면 다음날 발동, 여러 밤에 걸쳐 유지된다
    coronerUsedDay: null, coronerResult: null, // 검시관 전용 - 마지막으로 사용한 날짜(dayNumber)와 그 결과
    mercenaryPendingContacts: [], // 용병 전용 - 같은 밤에 여러 곳에서 동시에 접선 요청이 온 경우, 다음날 낮에 고를 수 있는 후보들
    cultistTarget: null, vampireTarget: null, witchTarget: null, undertakerTarget: null, avengerTarget: null,
    avengerActorId: null,
    thiefTarget: null,
    stolenFrom: {}, // { [playerId]: gemType } - 괴도가 훔친 기록, 게임 내내 누적 (같은 사람에게 다시 못 훔침)
    stolenGemTypes: [], // 지금까지 모은 서로 다른 보석 종류 목록 (승리 조건용)
    werewolfTarget: null, werewolfVictimName: null,
    priestTarget: null, priestReviveName: null,
    catOwnerTarget: null, catDetectTarget: null, catDetectResult: null,
    catAppearedName: null, // 1일차 아침에만 뜨는 "고양이가 나타났다" 알림
    catVoteRemovedId: null, // 마피아팀에 편입된 고양이가 낮에 투표권을 없앤 대상 (그날 하루만 유효)
    conartistTarget: null,
    bodyguardTarget: null, bodyguardSaveResult: null,
    godfatherTarget: null, godfatherRecruitResult: null, godfatherCaughtResult: null, godfatherNeutralEncounterResult: null, godfatherNeutralCaughtId: null,
    terroristSelfdestructTarget: null, // [자폭] 능력 - 낮에 지목해두면 자폭이 발동할 때까지 여러 밤에 걸쳐 유지된다
    conartistRiggedTargetId: null, // [투표 조작] 능력 - 지정된 대상에게 가는 낮 투표가 무효 처리된다
    teacherLessonChoice: null, teacherLessonResult: null, // { roleKey, roleLabel, count, required, graduated }
    counselorTarget: null, // 낮에 상담원이 고른, 그날 밤 상담할 대상 - 밤이 끝나면 초기화되는 하루짜리 선택
    idolMessage: null, // { name, text } - 아이돌의 콘서트 공지. 새 메시지가 올 때까지 그대로 유지된다 (밤/낮 상관없이 고정)
    judgePardonTarget: null, judgePardonResult: null, judgePardonUsed: false, // 판사가 게임당 단 한 번, 감옥에 간 사람을 사면할 수 있다
    blockerPrevTarget: null, // 마담이 어젯밤 유혹한 대상 - 오늘 밤 같은 사람은 다시 고를 수 없다
    spySeducePrevTarget: null, // [미인계] 능력의 스파이가 어젯밤 유혹한 대상 - 오늘 밤 같은 사람은 다시 고를 수 없다
    silencerPrevTarget: null, // 유괴범이 어젯밤 납치한 대상 - 오늘 밤 같은 사람은 다시 고를 수 없다
    reporterUsed: false, witchUsed: false, witchCastCount: 0, priestUsed: false, conartistUsed: false, godfatherUsed: false, godfatherRecruitCount: 0,
    policeResult: null, spyResult: null, detectiveResult: null, reporterReveal: null, doctorResult: null, undertakerResult: null,
    lastNightDeath: null, nightSaveHappened: false, nightSavedName: null, hitmanKillVictimName: null, soloKillVictimId: null, soloKillVictimName: null, curseVictimName: null, curseCastName: null,
    curseTargetId: null, curseDeathDay: null,
    ancientCurseIds: [], ancientCurseDeathDay: null, // [고대 주술] 능력 - 여러 명이 동시에 저주에 걸릴 수 있어 배열로 관리
    avengerKillResult: null, // { avengerName, targetName } - 복수자가 이번 밤 복수에 성공한 경우 (본인도 함께 사망)
    lastDayVotes: {}, lastDayFinalVotes: {}, lastDayJudgeDecided: false, // 공무원 전용 - 어젯밤 시작 시점에 그날 낮 투표를 스냅샷해둔 것
    blockedVoterId: null, blockedChatterId: null, blockedAbilityId: null,
    veteranSurvivedName: null, vampireFightResult: null, terroristBombVictimName: null,
    veteranSpyAlert: {}, // { [veteranPlayerId]: spyName } - 그 밤에 스파이에게 조사당한 군인에게만 공개
    mafiaApprenticeReveal: {}, // { [마피아playerId]: { targetName, roleLabel } } - [수습] 선택한 마피아가 그 밤 성공한 대상의 직업을 알게 됨
    cultistStacks: 0,
    revealedRoles: {}, // { [playerId]: roleLabel } - 한 번 공개되면 게임이 끝날 때까지 유지 (고양이는 1일차 아침에 공개됨)
    undertakerFindings: {}, // { [deadPlayerId]: { roleLabel, wasSoulHarvested, wasThrall } } - 장의사 본인에게만, 게임 내내 누적
    spyFindings: {}, // { [targetId]: roleLabel } - 스파이 본인에게만, 게임 내내 누적
    priestFindings: {}, // { [attackerId]: { type: 'witch'|'vampire', name } } - 성직자 본인에게만, 게임 내내 누적
    policeFindings: {}, // { [godfatherId]: roleLabel } - 대부의 영입 시도가 실패하며 정체가 발각된 경찰 본인에게만, 게임 내내 누적
    votes: {}, nominee: null, defenseText: "", finalVotes: {}, skipVotes: {}, tiedNominees: [], judgeVerdict: null,
    lastEliminated: null, politicianSaved: false,
    sheriffElectionVotes: {}, sheriffElectedName: null, sheriffRunoffCandidates: null,
    unemployedJobGrantedPlayerId: null, unemployedJobGrantedLabel: null,
    sheriffDesignatedTarget: null, sheriffDesignateResult: null, sheriffDefenseText: "", sheriffVerdict: null, sheriffDesignatedToday: false,
    sheriffJustJailedName: null, sheriffExecutionResult: null,
    chats: { mafia: [], lover: {}, teacherStudent: {}, counselor: {}, mercenaryContact: {}, wardenChat: {}, medium: [], day: [], vampire: [] }, // lover/teacherStudent/counselor/mercenaryContact/wardenChat은 쌍(pair)별로 격리된 맵: { "id1|id2": [...메시지] }
    log: ["🌙 밤이 시작되기 전, 각자 자신의 직업을 확인합니다."],
    revealAckIds: [],
    winner: null,
    knownRoles: {}, // { [보는 사람 id]: { [대상 id]: 직업 라벨 } } - 각자 조사·발각 등으로 알아낸 직업, 게임 내내 누적 (본인 플레이어 목록에 기재)
    timerSeconds: 15, timerRunning: true,
  };
}

/** 누가 누구의 직업을 알게 됐는지 knownRoles에 누적한다 (새 객체를 돌려준다) */
export function learnRole(knownRoles, viewerId, targetId, label) {
  if (!viewerId || !targetId || viewerId === targetId || !label) return knownRoles;
  return { ...knownRoles, [viewerId]: { ...(knownRoles[viewerId] || {}), [targetId]: label } };
}

/* ---------- resolution helpers (identical logic to client prototype) ---------- */

/**
 * 마피아팀(마피아 역할만, 스파이 제외)의 밤 투표를 집계한다.
 * 최다 득표 대상이 목표가 되고, 동점이면 그 대상들 중 무작위로 정해진다.
 */
/** 밤 도중에 즉시 게임에서 빠지는 사람들(강제 입원·인신매매·방화 사망)이 이미 제출해둔 그 밤의 행동을 지운다.
 *  그대로 두면 이미 탈락한 사람의 습격·보호·조사가 그 밤 결과에 반영되어 버린다. */
function clearNightActionsOf(state, removedPlayers) {
  const patch = {};
  const mafiaVotes = { ...(state.mafiaVotes || {}) };
  const mafiaSecondVotes = { ...(state.mafiaSecondVotes || {}) };
  removedPlayers.forEach((v) => {
    delete mafiaVotes[v.id];
    delete mafiaSecondVotes[v.id];
    const key = ROLE_TARGET_KEY[v.role];
    if (key && v.role !== "mafia") patch[key] = null;
    if (v.role === "cat") { patch.catOwnerTarget = null; patch.catDetectTarget = null; }
    if (v.role === "police") patch.policeSecondTarget = null;
    if (v.role === "hitman") Object.assign(patch, { hitmanTargetId: null, hitmanGuessedRole: null, hitmanSecondTargetId: null, hitmanSecondGuessedRole: null });
    if (v.role === "conartist") Object.assign(patch, { conartistLegendRole: null, conartistLegendTarget: null, conartistLegendGuess: null });
    if (v.role === "terrorist") patch.terroristArsonPending = null;
    if (state.avengerActorId === v.id) Object.assign(patch, { avengerTarget: null, avengerActorId: null });
    if (v.role === "teacher") patch.teacherLessonChoice = null;
    if (state.possessUse?.actorId === v.id) patch.possessUse = null;
  });
  return { ...patch, mafiaVotes, mafiaSecondVotes };
}

/** [독재] - 카드를 고른 정치인이 즉시 보안관 자리를 차지한다 (기존 보안관은 해임). 모두에게 공개된다. */
function applyDictator(state) {
  const pol = state.players.find((p) => p.role === "politician" && p.alive && !p.inJail && p.powerUpgrade === "politician_dictator" && !p.dictatorApplied && !isAbilityDisabled(p));
  if (!pol) return state;
  const players = state.players.map((p) => (p.id === pol.id ? { ...p, isSheriff: true, dictatorApplied: true } : p.isSheriff ? { ...p, isSheriff: false } : p));
  return {
    ...state, players,
    revealedRoles: { ...(state.revealedRoles || {}), [pol.id]: ROLES.politician.label },
    dictatorResult: { name: pol.name },
    log: [...state.log, `🎩 정치인 ${pol.name}님이 독재를 선포하고 보안관 자리를 차지했습니다.`].slice(-60),
  };
}

/** 보안관 처형대의 판결을 내리는 사람 - [이단심판]이면 고발한 성직자, 아니면 보안관 */
export function isVerdictActor(state, player) {
  if (!player) return false;
  return state.inquisitionBy ? player.id === state.inquisitionBy : !!player.isSheriff;
}
/** [영혼 결혼식] - 연인 중 한 명이라도 이 카드를 골랐다면, 한쪽이 죽어도 밤에는 연인 채팅이 이어진다 */
export function soulwedChatOpen(state, player) {
  if (!player || player.role !== "newlywed" || !player.partnerId || player.isThrall || state.phase !== "night") return false;
  const partner = state.players.find((p) => p.id === player.partnerId);
  if (!partner || partner.isThrall) return false;
  if (player.alive && partner.alive) return false; // 둘 다 살아있으면 원래 규칙대로
  return player.powerUpgrade === "newlywed_soulwed" || partner.powerUpgrade === "newlywed_soulwed";
}

function hasActiveSheriff(players) {
  return players.some((p) => p.isSheriff && p.alive && !p.inJail);
}

function nextDayActivityPhase(state) {
  return hasActiveSheriff(state.players)
    ? { phase: "discussion", timerSeconds: 180 }
    : { phase: "sheriffElection", timerSeconds: 180 };
}

function resolveMafiaTarget(state) {
  const votes = state.mafiaVotes || {};
  const tally = {};
  Object.values(votes).forEach((targetId) => {
    if (!targetId) return;
    tally[targetId] = (tally[targetId] || 0) + 1;
  });
  const entries = Object.entries(tally);
  if (entries.length === 0) return { targetId: null, tied: false };
  let max = -1, leaders = [];
  entries.forEach(([id, c]) => {
    if (c > max) { max = c; leaders = [id]; } else if (c === max) leaders.push(id);
  });
  if (leaders.length === 1) return { targetId: leaders[0], tied: false };
  const picked = leaders[Math.floor(Math.random() * leaders.length)];
  return { targetId: picked, tied: true };
}

// [무법자] 능력을 고른 마피아가 있을 때만 쓰인다 - 첫 번째 습격 대상과는 완전히 별개로,
// 마피아팀이 그날 밤 죽일 두 번째 대상을 똑같은 방식(다수결, 동표시 무작위)으로 정한다.
function resolveMafiaSecondTarget(state) {
  const votes = state.mafiaSecondVotes || {};
  const tally = {};
  Object.values(votes).forEach((targetId) => {
    if (!targetId) return;
    tally[targetId] = (tally[targetId] || 0) + 1;
  });
  const entries = Object.entries(tally);
  if (entries.length === 0) return { targetId: null, tied: false };
  let max = -1, leaders = [];
  entries.forEach(([id, c]) => {
    if (c > max) { max = c; leaders = [id]; } else if (c === max) leaders.push(id);
  });
  if (leaders.length === 1) return { targetId: leaders[0], tied: false };
  const picked = leaders[Math.floor(Math.random() * leaders.length)];
  return { targetId: picked, tied: true };
}

function resolveNight(state) {
  state = applyProxyRedirect(state);
  const { players, spyTarget, framerTarget, blockerTarget: rawBlockerTarget, silencerTarget,
    policeTarget, doctorTarget, soldierTarget, reporterTarget, detectiveTarget,
    cultistTarget, vampireTarget, witchTarget, undertakerTarget, avengerTarget, avengerActorId, thiefTarget, werewolfTarget, priestTarget,
    catOwnerTarget, catDetectTarget, conartistTarget, bodyguardTarget, godfatherTarget, teacherLessonChoice, judgePardonTarget, mercenaryTarget,
    hitmanTargetId, hitmanGuessedRole,
    dayNumber, reporterUsed, witchUsed, priestUsed, conartistUsed, godfatherUsed, judgePardonUsed } = state;

  // [바이러스]로 능력을 잃었거나 [현혹]으로 봉인된 사람은 어떤 밤 능력도 쓸 수 없다.
  const disabledPlayers = players.filter((p) => p.alive && isAbilityDisabled(p));
  const blockerActor = players.find((p) => p.role === "blocker");
  const blockerTarget = blockerActor && isAbilityDisabled(blockerActor) ? null : rawBlockerTarget;
  // 방해꾼(마담)에게 막힌 사람이 있다면, 그 사람이 가진 "1인 전용 능력"(마피아 집단 킬 제외)은 이번 밤 무효가 된다.
  const blockedPlayer = blockerTarget ? players.find((p) => p.id === blockerTarget) : null;
  // [미인계] 능력을 고른 스파이는 조사 대신, 선택한 대상을 유혹해서 그 능력 자체를 무효화한다 - 마담의 방해와 같은 방식으로 처리한다.
  const spyActorForBlock = players.find((p) => p.role === "spy");
  const witchActorForBlock = players.find((p) => p.role === "witch");
  // 스파이 본인이 마담에게 막혔거나 정신 지배를 당했다면 미인계도 발동하지 않는다.
  const spyDisabledTonight = !!spyActorForBlock && (blockerTarget === spyActorForBlock.id ||
    false);
  const seduceActive = spyActorForBlock?.powerUpgrade === "spy_seduce" && !!spyTarget && !spyDisabledTonight && !isAbilityDisabled(spyActorForBlock);
  const seducedPlayer = seduceActive ? players.find((p) => p.id === spyTarget) : null;
  // [정신 지배] 능력을 고른 마녀는 대상의 능력을 봉쇄하고(마담과 동일한 방식) 그 밤 채팅도 못 하게 한다.
  const mindControlActive = false; // [정신 지배]는 이제 밤 봉쇄가 아니라 꼭두각시 조종 방식이다 (WITCH_MINDCONTROL)
  const mindControlledPlayer = mindControlActive ? players.find((p) => p.id === witchTarget) : null;
  // 한 밤에 마담·미인계·정신 지배가 동시에 서로 다른 사람을 막을 수 있으므로, 막힌 직업들을 집합으로 모은다.
  const blockedRoles = new Set([blockedPlayer?.role, seducedPlayer?.role, mindControlledPlayer?.role, ...disabledPlayers.map((p) => p.role)].filter(Boolean));
  // 능력이 막힌 "사람" 목록 - 직업(role) 단위가 아닌 [빙의]·[피의 복수] 같은 능력을 막는 데 쓴다.
  const blockedActorIds = new Set([blockerTarget, seducedPlayer?.id, mindControlledPlayer?.id, ...disabledPlayers.map((p) => p.id)].filter(Boolean));
  // ── [밤의 지배자] - 대부가 발동한 밤에는 마피아팀을 제외한 모든 플레이어의 직업 능력이 무효가 된다. ──
  const nightLordActor = state.nightLordPendingId
    ? players.find((p) => p.id === state.nightLordPendingId && p.role === "godfather" && p.alive && !p.inJail && !isAbilityDisabled(p))
    : null;
  if (nightLordActor) {
    players.filter((p) => p.alive && !isMafiaAligned(p)).forEach((p) => { blockedRoles.add(p.role); blockedActorIds.add(p.id); });
  }
  const isRoleBlocked = (role) => blockedRoles.has(role);
  // ── [바이러스] - 해커가 고른 사람은 30% 확률로 직업 능력을 영구히 잃는다 (이번 밤부터 바로 적용). 같은 사람은 다시 못 고른다. ──
  const framerActorU = players.find((p) => p.role === "framer");
  const framerUpgrade = framerActorU?.powerUpgrade;
  let virusResult = null, virusLostId = null, virusTriedId = null;
  if (framerUpgrade === "framer_virus" && framerTarget && framerActorU.alive && !framerActorU.inJail && !isRoleBlocked("framer")) {
    const t = players.find((p) => p.id === framerTarget);
    if (t && t.alive && t.id !== framerActorU.id && !(framerActorU.virusTriedIds || []).includes(t.id)) {
      const success = Math.random() < 0.3;
      virusTriedId = t.id;
      virusResult = { targetName: t.name, success };
      if (success) { virusLostId = t.id; blockedRoles.add(t.role); blockedActorIds.add(t.id); }
    }
  }
  // ── [전설의 사기꾼]: 위장한 직업의 능력을 사기꾼 전용 칸(conartistLegendRole/Target)으로 따로 쓴다 ──
  const legendActor = players.find((p) => p.role === "conartist" && p.alive && !p.inJail && legendDisguiseOf(p));
  const legendRole = legendActor && !isRoleBlocked("conartist") && state.conartistLegendRole &&
    legendDisguiseOf(legendActor) === state.conartistLegendRole ? state.conartistLegendRole : null;
  const legendTargetId = legendRole ? state.conartistLegendTarget || null : null;
  const legendOn = (role) => legendRole === role && !!legendTargetId;
  const legendOnceUsed = { ...(legendActor?.legendOnceUsed || {}) };
  const legendTargetAtStart = legendTargetId ? players.find((p) => p.id === legendTargetId) : null;
  // 마담으로 위장한 사기꾼의 유혹도 진짜 마담과 똑같이 대상의 능력을 막는다.
  const legendBlockedPlayer = legendOn("blocker") ? legendTargetAtStart : null;
  if (legendBlockedPlayer) { blockedRoles.add(legendBlockedPlayer.role); blockedActorIds.add(legendBlockedPlayer.id); }
  // ── [빙의]·[유품수거] - 죽은 사람에게서 빌린 직업 능력을 이번 밤 딱 한 번 쓴다 (본인이 막혔다면 다음 밤으로 미뤄진다) ──
  const possessActor = state.possessUse
    ? players.find((p) => p.id === state.possessUse.actorId && p.alive && !p.inJail && p.possessRole === state.possessUse.role && !p.possessUsed && !isAbilityDisabled(p))
    : null;
  const possessRole = possessActor && !blockedActorIds.has(possessActor.id) ? state.possessUse.role : null;
  const possessTargetId = possessRole ? state.possessUse.targetId || null : null;
  const possessOn = (role) => possessRole === role && !!possessTargetId;
  const possessTargetAtStart = possessTargetId ? players.find((p) => p.id === possessTargetId) : null;
  // [신의 손] 능력을 고른 의사는 마담의 방해를 포함한 모든 방해를 무시하고 치료가 항상 성공한다.
  const doctorActor = players.find((p) => p.role === "doctor");
  const doctorDisabled = isAbilityDisabled(doctorActor) || (!!virusLostId && doctorActor?.id === virusLostId);
  const effectiveDoctorTarget = doctorDisabled ? null : (doctorActor?.powerUpgrade === "doctor_divine" && !nightLordActor) ? doctorTarget : (isRoleBlocked("doctor") ? null : doctorTarget);
  // 의사로 위장한 사기꾼의 보호도 진짜 의사의 보호와 똑같이 취급한다.
  const legendDoctorTarget = legendOn("doctor") ? legendTargetId : null;
  const possessDoctorTarget = possessOn("doctor") ? possessTargetId : null;
  // [성녀] - 부활 대신 매일 밤 한 명을 보호한다 (자기 자신 제외). [엘리트 요원] - 경호원이 죽지 않고 의사처럼 지킨다.
  const priestActorP = players.find((p) => p.role === "priest" && p.alive && !p.inJail);
  const saintTargetId = priestActorP?.powerUpgrade === "priest_saint" && !isRoleBlocked("priest") && priestTarget && priestTarget !== priestActorP.id ? priestTarget : null;
  const bodyguardActorP = players.find((p) => p.role === "bodyguard" && p.alive && !p.inJail);
  const eliteGuardTargetId = bodyguardActorP?.powerUpgrade === "bodyguard_elite" && !isRoleBlocked("bodyguard") && bodyguardTarget && bodyguardTarget !== bodyguardActorP.id ? bodyguardTarget : null;
  const isProtected = (id) => !!id && (id === effectiveDoctorTarget || id === legendDoctorTarget || id === possessDoctorTarget || id === saintTargetId || id === eliteGuardTargetId);
  const saverOf = (id) => (!id ? null : (id === effectiveDoctorTarget || id === legendDoctorTarget || id === possessDoctorTarget) ? "doctor" : id === saintTargetId ? "saint" : id === eliteGuardTargetId ? "bodyguard" : null);
  const effectivePoliceTarget = isRoleBlocked("police") ? null : policeTarget;
  const effectiveSpyTarget = isRoleBlocked("spy") ? null : spyTarget;
  const detectiveUpgrade = players.find((p) => p.role === "detective")?.powerUpgrade;
  const effectiveDetectiveTarget = isRoleBlocked("detective") || detectiveUpgrade === "detective_deduce" ? null : detectiveTarget;
  const effectiveReporterTarget = isRoleBlocked("reporter") ? null : reporterTarget;
  const effectiveSoldierTarget = isRoleBlocked("soldier") ? null : soldierTarget;
  const effectiveSilencerTarget = isRoleBlocked("silencer") ? null : silencerTarget;
  // [바이러스]/[프록시]를 고르면 기존의 해킹(조작) 능력은 사라진다.
  const effectiveFramerTarget = (isRoleBlocked("framer") || framerUpgrade === "framer_virus" || framerUpgrade === "framer_proxy") ? null : framerTarget;
  const legendFramerTarget = legendOn("framer") ? legendTargetId : null;
  const isFramed = (id) => !!id && (id === effectiveFramerTarget || id === legendFramerTarget);
  const effectiveCultistTarget = isRoleBlocked("cultist") ? null : cultistTarget;
  const effectiveVampireTarget = isRoleBlocked("vampire") ? null : vampireTarget;
  const effectiveWitchTarget = isRoleBlocked("witch") ? null : witchTarget;
  const effectiveUndertakerTarget = isRoleBlocked("undertaker") ? null : undertakerTarget;
  // 복수자는 직업(role)이 아니라 상태라서, 마담이 그 사람을 막았는지는 role이 아니라 isAvenger로 확인한다.
  const effectiveAvengerTarget = avengerActorId && blockedActorIds.has(avengerActorId) ? null : avengerTarget;
  const effectiveThiefTarget = isRoleBlocked("thief") ? null : thiefTarget;
  const effectiveWerewolfTarget = isRoleBlocked("werewolf") ? null : werewolfTarget;
  const effectivePriestTarget = isRoleBlocked("priest") || priestActorP?.powerUpgrade === "priest_saint" ? null : priestTarget;
  const effectiveConartistTarget = isRoleBlocked("conartist") ? null : conartistTarget;
  const effectiveBodyguardTarget = isRoleBlocked("bodyguard") ? null : bodyguardTarget;
  const effectiveGodfatherTarget = isRoleBlocked("godfather") ? null : godfatherTarget;
  const effectiveHitmanTargetId = isRoleBlocked("hitman") ? null : hitmanTargetId;
  const effectiveJudgePardonTarget = isRoleBlocked("judge") ? null : judgePardonTarget;
  const effectiveMercenaryTarget = isRoleBlocked("mercenary") ? null : mercenaryTarget;
  const effectiveCatOwnerTarget = isRoleBlocked("cat") ? null : catOwnerTarget;
  const effectiveCatDetectTarget = isRoleBlocked("cat") ? null : catDetectTarget;
  /** 탐정식 추적 - 대상이 이번 밤 능력을 썼다면 그 대상 플레이어를 돌려준다 */
  const traceActionOf = (t) => {
    const map = { mafia: null, spy: effectiveSpyTarget, framer: effectiveFramerTarget, blocker: blockerTarget, silencer: effectiveSilencerTarget,
      police: effectivePoliceTarget, doctor: effectiveDoctorTarget, soldier: effectiveSoldierTarget, reporter: effectiveReporterTarget,
      cultist: effectiveCultistTarget, vampire: effectiveVampireTarget, witch: effectiveWitchTarget, undertaker: effectiveUndertakerTarget };
    const id = t.role === "mafia" ? state.mafiaVotes?.[t.id] : map[t.role];
    return id ? players.find((p) => p.id === id) || null : null;
  };

  // 방해꾼(마담)에게 막힌 사람이 있다면, 그 사람이 가진 "1인 전용 능력"(마피아 집단 킬 제외)은 이번 밤 무효가 된다.
  const mafiaVotesEffective = { ...state.mafiaVotes };
  if (blockerTarget && mafiaVotesEffective[blockerTarget] !== undefined) delete mafiaVotesEffective[blockerTarget];
  if (legendBlockedPlayer && mafiaVotesEffective[legendBlockedPlayer.id] !== undefined) delete mafiaVotesEffective[legendBlockedPlayer.id];
  [...disabledPlayers.map((p) => p.id), virusLostId].filter(Boolean).forEach((id) => { delete mafiaVotesEffective[id]; });
  const { targetId: mafiaTarget, tied: mafiaVoteTied } = resolveMafiaTarget({ mafiaVotes: mafiaVotesEffective });
  // [무법자] 능력을 고른 마피아가 살아있다면, 첫 번째 습격과 완전히 별개로 두 번째 대상도 함께 노린다.
  const mafiaHasOutlaw = players.some((p) => p.role === "mafia" && p.alive && !p.inJail && !isAbilityDisabled(p) && p.id !== virusLostId && p.powerUpgrade === "mafia_outlaw");
  const mafiaSecondVotesEffective = { ...state.mafiaSecondVotes };
  if (blockerTarget && mafiaSecondVotesEffective[blockerTarget] !== undefined) delete mafiaSecondVotesEffective[blockerTarget];
  const { targetId: mafiaSecondTargetRaw } = mafiaHasOutlaw ? resolveMafiaSecondTarget({ mafiaSecondVotes: mafiaSecondVotesEffective }) : { targetId: null };
  const mafiaSecondTarget = mafiaSecondTargetRaw && mafiaSecondTargetRaw !== mafiaTarget ? mafiaSecondTargetRaw : null;

  // ── 용병 접선(의뢰) 감지: 경찰의 조사, 마피아의 습격, 건달의 협박 중 이번 밤에 발생한 모든 후보를 모은다.
  // 후보가 하나뿐이면 그 자리에서 바로 접선이 확정되지만, 여러 명이 동시에 접선을 시도했다면
  // 즉시 확정하지 않고 다음날 낮에 용병이 직접 의뢰 대상을 고를 수 있도록 후보로만 남겨둔다.
  const mercenaryPlayerForContact = players.find((p) => p.role === "mercenary" && !p.mercenaryContactedBy);
  const mercenaryContactCandidates = []; // { type: "mafia"|"police"|"soldier", contactPlayerId, contactPlayerName }[]
  if (mercenaryPlayerForContact) {
    if (mafiaTarget === mercenaryPlayerForContact.id) {
      // 마피아 중 한 명(투표에 참여한 아무나)을 접선 상대로 삼는다.
      const anyMafiaId = Object.keys(mafiaVotesEffective).find((id) => mafiaVotesEffective[id] === mafiaTarget);
      const contactPlayer = players.find((p) => p.id === anyMafiaId) || players.find((p) => p.role === "mafia" && p.alive);
      mercenaryContactCandidates.push({ type: "mafia", contactPlayerId: contactPlayer?.id || null, contactPlayerName: contactPlayer?.name || null });
    }
    if (effectivePoliceTarget === mercenaryPlayerForContact.id) {
      const contactPlayer = players.find((p) => p.role === "police");
      mercenaryContactCandidates.push({ type: "police", contactPlayerId: contactPlayer?.id || null, contactPlayerName: contactPlayer?.name || null });
    }
    if (effectiveSoldierTarget === mercenaryPlayerForContact.id && !players.find((p) => p.role === "soldier")?.recruitedToMafia) {
      const contactPlayer = players.find((p) => p.role === "soldier");
      mercenaryContactCandidates.push({ type: "soldier", contactPlayerId: contactPlayer?.id || null, contactPlayerName: contactPlayer?.name || null });
    }
  }
  // 후보가 정확히 하나뿐일 때만 이 자리에서 바로 확정한다. 여러 개면 mercenaryPendingContacts로 넘긴다.
  const mercenaryContactEvent = mercenaryContactCandidates.length === 1 ? mercenaryContactCandidates[0] : null;
  const mercenaryPendingContacts = mercenaryContactCandidates.length > 1 ? mercenaryContactCandidates : [];
  // 접선을 시도한 쪽의 능력은(단일이든 복수든) 접선 그 자체로 소모되어 무효가 된다 - 아래 각 능력 처리에서 이 값들로 예외 처리한다.
  const mafiaTriggeredMercContact = mercenaryContactCandidates.some((c) => c.type === "mafia");
  const soldierTriggeredMercContact = mercenaryContactCandidates.some((c) => c.type === "soldier");

  let log = [...state.log];
  let updatedPlayers = players;
  if (virusTriedId) {
    updatedPlayers = updatedPlayers.map((p) => {
      if (p.id === framerActorU.id) return { ...p, virusTriedIds: [...(p.virusTriedIds || []), virusTriedId] };
      if (p.id === virusLostId) return { ...p, abilityLost: true };
      return p;
    });
    log.push(`💻 누군가의 기기에 정체불명의 바이러스가 퍼졌습니다.`);
  }
  // ── 마담의 7일차 능력: [현혹] 한 번 봉인 / [밀정] 유혹한 사람의 직업 확인 / [접대] 투표권 빼앗기 ──
  let blockerCharmResult = null, charmSealedId = null, blockerSpyResult = null, hostedVoterId = null, hostVoterBy = null;
  if (blockerActor && blockerTarget && blockerActor.alive && !blockerActor.inJail) {
    const bt = players.find((p) => p.id === blockerTarget);
    if (bt) {
      if (blockerActor.powerUpgrade === "blocker_charm" && !blockerActor.blockerCharmUsed && bt.alive) {
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id === bt.id) return { ...p, abilitySealed: true, sealedByBlockerId: blockerActor.id };
          if (p.id === blockerActor.id) return { ...p, blockerCharmUsed: true };
          return p;
        });
        blockerCharmResult = { targetName: bt.name };
        charmSealedId = bt.id;
      } else if (blockerActor.powerUpgrade === "blocker_spy") {
        blockerSpyResult = { targetName: bt.name, roleLabel: effectiveRoleLabel(bt) };
      } else if (blockerActor.powerUpgrade === "blocker_host" && bt.alive) {
        hostedVoterId = bt.id;
        hostVoterBy = blockerActor.id;
      }
    }
  }
  // 경호원의 보호 - 진짜 경호원이 우선이고, 경호원으로 위장한 사기꾼의 경호도 똑같이 대신 목숨을 잃는다.
  const legendBodyguardTarget = legendOn("bodyguard") ? legendTargetId : null;
  const guardFor = (id) => {
    if (!id) return null;
    if (effectiveBodyguardTarget === id) {
      const bg = updatedPlayers.find((p) => p.role === "bodyguard" && p.alive);
      if (bg && bg.id !== id && bg.powerUpgrade !== "bodyguard_elite") return bg;
    }
    if (possessOn("bodyguard") && possessTargetId === id) {
      const c = updatedPlayers.find((p) => p.id === possessActor.id && p.alive);
      if (c && c.id !== id) return c;
    }
    if (legendBodyguardTarget === id && legendActor) {
      const c = updatedPlayers.find((p) => p.id === legendActor.id && p.alive);
      if (c && c.id !== id) return c;
    }
    return null;
  };
  if (mercenaryContactEvent) {
    updatedPlayers = updatedPlayers.map((p) => {
      if (p.id === mercenaryPlayerForContact.id) {
        return { ...p, mercenaryContactedBy: mercenaryContactEvent.type, mercenaryContactPlayerId: mercenaryContactEvent.contactPlayerId };
      }
      if (mercenaryContactEvent.type === "soldier" && p.id === mercenaryContactEvent.contactPlayerId) {
        return { ...p, pairedWithMercenary: true };
      }
      return p;
    });
    if (mercenaryContactEvent.type === "mafia") log.push(`🗡️ 용병이 마피아와 접선해 의뢰를 받았습니다.`);
    else if (mercenaryContactEvent.type === "police") log.push(`🗡️ 용병이 경찰과 접선해 의뢰를 받았습니다.`);
    else if (mercenaryContactEvent.type === "soldier") log.push(`🗡️ 용병이 건달과 접선해 의뢰를 받았습니다.`);
  } else if (mercenaryPendingContacts.length > 0) {
    log.push(`🗡️ 용병이 여러 곳에서 동시에 접선 요청을 받았습니다. 다음날 낮에 직접 의뢰를 고를 수 있습니다.`);
  }
  let lastNightDeath = null;
  let nightSaveHappened = false;
  let nightSavedName = null; // 의사가 이번 밤 실제로 구해낸 대상의 이름 - 알람에 공개적으로 밝힌다
  let hitmanKillVictimId = null; // 히트맨이 실제로 암살에 성공한 대상 - lastNightDeath 자리를 마피아가
  let hitmanKillVictimName = null; // 이미 차지했어도, 히트맨의 암살은 완전히 별개 사건이라 따로 추적해서 알람이 묻히지 않게 한다
  let soloKillVictimId = null; // 용병/건달(독립적으로 죽이는 중립)이 실제로 죽인 대상 - 마피아가 lastNightDeath
  let soloKillVictimName = null; // 자리를 이미 차지했어도, 이 역시 완전히 별개 사건이라 따로 추적해서 알람이 묻히지 않게 한다
  let veteranSurvivedName = null;
  const mafiaApprenticeReveal = {}; // { [마피아playerId]: { targetName, roleLabel } } - [수습] 능력을 고르고 그 밤 희생자에게 투표한 마피아 본인에게만
  // [수습] 능력 - 마피아의 습격이 실제로 성공했을 때(협상/보호로 막히지 않았을 때) 호출한다.
  // 그 대상에게 투표했던 마피아 중 [수습]을 고른 사람은 대상의 정확한 직업을 알게 된다.
  const applyMafiaApprenticeReveal = (victimId, victimRoleLabel, victimName) => {
    const votes = state.mafiaVotes || {};
    Object.entries(votes).forEach(([voterId, targetId]) => {
      if (targetId !== victimId) return;
      const voter = updatedPlayers.find((p) => p.id === voterId);
      if (voter && voter.role === "mafia" && voter.powerUpgrade === "mafia_apprentice") {
        mafiaApprenticeReveal[voterId] = { targetName: victimName, roleLabel: victimRoleLabel };
      }
    });
  };
  let vampireFightResult = null;
  let curseVictimName = null; // 이번 밤에 저주가 실제로 발동해 사망한 경우
  let curseCastName = null; // 이번 밤에 처음 저주가 걸린 경우 (사망은 아직 아님)
  let curseTargetId = state.curseTargetId || null;
  let curseDeathDay = state.curseDeathDay || null;
  // [고위 마녀]로 저주를 여러 번 걸면, 먼저 걸린 저주가 새 저주에 덮어써지지 않도록 대기열에 따로 보관한다.
  let pendingCurses = [...(state.pendingCurses || [])];
  let extraCurseVictimNames = [];
  let avengerKillResult = null; // { avengerName, targetName } - 복수자가 이번 밤 성공한 경우
  let thiefStealResult = null; // { targetName, gem } - 괴도 본인에게만 보여줄, 이번 밤 절도 결과
  let werewolfVictimName = null; // 늑대인간에게 습격당해 죽은 사람 (마피아의 공격과는 완전히 별개)
  let stolenFrom = { ...(state.stolenFrom || {}) };
  let stolenGemTypes = [...(state.stolenGemTypes || [])];
  let newWitchUsed = witchUsed;
  let newPriestUsed = priestUsed;
  let newConartistUsed = conartistUsed;
  let newGodfatherUsed = godfatherUsed;
  let newJudgePardonUsed = judgePardonUsed;
  let judgePardonResult = null; // { name } - 판사가 감옥에 간 사람을 사면한 경우, 모두에게 공개
  let priestReviveName = null;
  let conartistDisguiseResult = null; // { targetName, roleLabel } - 사기꾼 본인에게만 비공개로 알려줌
  let bodyguardSaveResult = null; // { targetName, bodyguardName, attackerName|null } - 경호원이 대신 죽으며 공격자도 함께 쓰러진 경우
  let teacherLessonResult = null; // { roleKey, roleLabel, count, required, graduated } - 교사/학생 본인에게만 비공개로 알려줌
  let godfatherRecruitResult = null; // { targetName } - 영입 성공시 공개 (누가 대부인지는 비공개)
  let godfatherCaughtResult = null; // { policeId } - 대부가 경찰을 영입하려다 발각된 경우, 그 경찰 본인에게만
  let godfatherNeutralEncounterResult = null; // { targetName, targetRoleLabel } - 대부가 중립을 영입하려다 실패한 경우, 대부 본인에게만
  let godfatherNeutralCaughtId = null; // 그 중립 본인에게만 - 대부의 이름을 알려줄 때 사용
  let catDetectResult = null; // { targetName, actedOnName|null } - 시민팀 편입 고양이 전용, 탐정과 동일한 결과
  let policeResult = null, policeSecondResult = null, spyResult = null, detectiveResult = null, reporterReveal = null, doctorResult = null, undertakerResult = null;
  let newReporterUsed = reporterUsed;
  const veteranSpyAlert = {};
  let revealedRoles = { ...(state.revealedRoles || {}) };
  let undertakerFindings = { ...(state.undertakerFindings || {}) };
  let spyFindings = { ...(state.spyFindings || {}) }; // { [targetId]: roleLabel } - 스파이 본인에게만, 게임 내내 누적
  let priestFindings = { ...(state.priestFindings || {}) }; // { [priestId]: { type: 'witch'|'vampire', name } } - 성직자 본인에게만
  let policeFindings = { ...(state.policeFindings || {}) }; // { [godfatherId]: roleLabel } - 발각시킨 경찰 본인에게만

  if (effectiveDoctorTarget) {
    const t = players.find((p) => p.id === effectiveDoctorTarget);
    if (t) doctorResult = { targetName: t.name, saved: !!(mafiaTarget && mafiaTarget === effectiveDoctorTarget), roleLabel: doctorActor?.powerUpgrade === "doctor_checkup" ? effectiveRoleLabel(t) : undefined };
  }
  if (effectivePoliceTarget) {
    const policeActor = players.find((p) => p.role === "police");
    const upgrade = policeActor?.powerUpgrade;
    if (upgrade === "police_hitman") {
      // [사살 작전] 조사 대신 암살 - 의사 보호 → 신혼부부 스왑 → 고양이 면역 → 군인 방어 → 경호원 대신 희생 → 사망.
      const t = updatedPlayers.find((p) => p.id === effectivePoliceTarget);
      // 용병에게 접선(의뢰)이 이뤄졌다면, 다른 접선과 마찬가지로 이번 밤 총격은 접선 그 자체로 소모된다.
      if (t && t.alive && !mercenaryContactCandidates.some((c) => c.type === "police")) {
        if (isProtected(t.id)) {
          nightSaveHappened = true;
          nightSavedName = t.name;
          updatedPlayers = updatedPlayers.map((p) => (p.role === "doctor" ? { ...p, doctorSaveCount: (p.doctorSaveCount || 0) + 1 } : p));
          log.push(`🩺 의사의 보호 덕분에 ${t.name}님은 목숨을 건졌습니다.`);
        } else {
          const swapped = applyNewlywedSwap(updatedPlayers, t.id);
          updatedPlayers = swapped.players;
          const actualTarget = updatedPlayers.find((p) => p.id === swapped.actualTargetId);
          if (actualTarget.role === "cat") {
            // 고양이는 마녀의 저주와 늑대인간의 습격을 제외하면 절대 죽지 않는다.
          } else if (hasNightDefense(actualTarget)) {
            updatedPlayers = updatedPlayers.map((p) => (p.id === actualTarget.id ? consumeDefense(p) : p));
            veteranSurvivedName = actualTarget.name;
            revealedRoles[actualTarget.id] = defenseRoleLabel(actualTarget);
            log.push(`🪖 ${actualTarget.name}님이 경찰의 총격에 맞서 싸워 살아남았습니다!`);
          } else if (guardFor(actualTarget.id)) {
            const bodyguard = guardFor(actualTarget.id);
            if (bodyguard) {
              updatedPlayers = updatedPlayers.map((p) => (p.id === bodyguard.id ? { ...p, alive: false, deathCause: "bodyguard" } : p));
              bodyguardSaveResult = { targetName: actualTarget.name, bodyguardName: bodyguard.name, attackerName: null };
              log.push(`🛡️ ${bodyguard.name}님이 ${actualTarget.name}님을 지키다 목숨을 잃었습니다.`);
            } else {
              updatedPlayers = updatedPlayers.map((p) => (p.id === actualTarget.id ? { ...p, alive: false, deathCause: "mafia" } : p));
              lastNightDeath = lastNightDeath || actualTarget.id;
              log.push(`☠️ 밤 사이, ${actualTarget.name}님이 목숨을 잃었습니다.`);
            }
          } else {
            updatedPlayers = updatedPlayers.map((p) => (p.id === actualTarget.id ? { ...p, alive: false, deathCause: "mafia" } : p));
            lastNightDeath = lastNightDeath || actualTarget.id;
            log.push(`☠️ 밤 사이, ${actualTarget.name}님이 목숨을 잃었습니다.`);
          }
        }
      }
    } else {
      // 기존 조사 + [영장](재조사시 정확한 직업 공개) + [강력 수사](두 번째 대상도 함께 조사)
      const investigateTargets = [effectivePoliceTarget];
      if (upgrade === "police_double" && state.policeSecondTarget && state.policeSecondTarget !== effectivePoliceTarget) {
        investigateTargets.push(state.policeSecondTarget);
      }
      const priorInvestigated = policeActor?.policeAllInvestigatedIds || [];
      const newlyInvestigated = [];
      investigateTargets.forEach((targetId, idx) => {
        const t = players.find((p) => p.id === targetId);
        if (!t) return;
        const framed = isFramed(targetId);
        const isMafia = framed ? true : (t.role === "spy" || t.role === "conartist" || t.role === "godfather" || t.recruitedToMafia || t.powerUpgrade === "mafia_disguise" || t.powerUpgrade === "silencer_disguise") ? false : ROLES[t.role].team === "mafia";
        // [영장]으로도 [위장] 카드를 고른 마피아/유괴범의 정확한 직업은 드러나지 않는다 (위장 카드 설명: 조사로 마피아라고 밝혀지지 않음).
        const disguisedFromInvestigation = t.powerUpgrade === "mafia_disguise" || t.powerUpgrade === "silencer_disguise";
        const warrantHit = upgrade === "police_warrant" && !framed && !disguisedFromInvestigation && priorInvestigated.includes(t.id);
        const oneResult = { targetName: t.name, isMafia, roleLabel: warrantHit ? effectiveRoleLabel(t) : undefined };
        if (idx === 0) policeResult = oneResult; else policeSecondResult = oneResult;
        newlyInvestigated.push(t.id);
        if (isMafia && !framed) {
          updatedPlayers = updatedPlayers.map((p) =>
            p.role === "police" ? { ...p, policeInvestigatedMafiaIds: [...new Set([...(p.policeInvestigatedMafiaIds || []), t.id])] } : p
          );
        }
      });
      updatedPlayers = updatedPlayers.map((p) =>
        p.role === "police" ? { ...p, policeAllInvestigatedIds: [...new Set([...(p.policeAllInvestigatedIds || []), ...newlyInvestigated])] } : p
      );
    }
  }
  if (effectiveSpyTarget && spyActorForBlock?.powerUpgrade !== "spy_seduce" && spyActorForBlock?.powerUpgrade !== "spy_assassin") {
    const t = players.find((p) => p.id === effectiveSpyTarget);
    if (t) {
      const framed = isFramed(effectiveSpyTarget);
      spyResult = { targetName: t.name, roleLabel: framed ? ROLES.mafia.label : effectiveRoleLabel(t) };
      spyFindings[t.id] = spyResult.roleLabel; // 게임 내내 누적 - 스파이 본인 로스터에 계속 표시된다
      // 스파이가 군인을 조사하면, 군인이 다음날 아침 "스파이에게 정체를 들켰다"는 걸 알게 된다 (스파이 신원 노출).
      if (t.role === "veteran") {
        const spyActor = players.find((p) => p.role === "spy");
        if (spyActor) veteranSpyAlert[t.id] = spyActor.name;
      }
    }
  } else if (effectiveSpyTarget && spyActorForBlock?.powerUpgrade === "spy_seduce") {
    // [미인계] - 조사 대신 대상을 유혹해서 그 능력을 무효화한다 (이미 위에서 blockedRole에 반영됨). 결과만 알려준다.
    const t = players.find((p) => p.id === effectiveSpyTarget);
    if (t) spyResult = { targetName: t.name, seduced: true };
  }
  let detectiveFindings = { ...(state.detectiveFindings || {}) };
  if (effectiveDetectiveTarget && detectiveUpgrade === "detective_identity") {
    // [신원 조사] - 추적 대신 스파이처럼 대상의 직업을 알아낸다.
    const t = players.find((p) => p.id === effectiveDetectiveTarget);
    if (t) {
      const roleLabel = isFramed(t.id) ? ROLES.mafia.label : effectiveRoleLabel(t);
      detectiveResult = { identity: true, actorName: t.name, roleLabel };
      detectiveFindings[t.id] = roleLabel;
    }
  } else if (effectiveDetectiveTarget) {
    const t = players.find((p) => p.id === effectiveDetectiveTarget);
    const actionMap = [
      { role: "mafia", targetId: mafiaTarget }, { role: "spy", targetId: effectiveSpyTarget },
      { role: "framer", targetId: effectiveFramerTarget }, { role: "blocker", targetId: blockerTarget },
      { role: "silencer", targetId: effectiveSilencerTarget },
      { role: "police", targetId: effectivePoliceTarget }, { role: "doctor", targetId: effectiveDoctorTarget },
      { role: "soldier", targetId: effectiveSoldierTarget }, { role: "reporter", targetId: effectiveReporterTarget },
      { role: "cultist", targetId: effectiveCultistTarget }, { role: "vampire", targetId: effectiveVampireTarget },
      { role: "witch", targetId: effectiveWitchTarget }, { role: "undertaker", targetId: effectiveUndertakerTarget },
    ];
    if (t) {
      const entry = actionMap.find((a) => a.role === t.role);
      if (entry && entry.targetId) {
        const actedOn = players.find((p) => p.id === entry.targetId);
        detectiveResult = { actorName: t.name, actedOnName: actedOn ? actedOn.name : null };
      } else {
        detectiveResult = { actorName: t.name, actedOnName: null };
      }
      if (t.role === "spy") {
        // "명탐정 라삐" 업적 준비 - 탐정이 스파이를 조사 대상으로 짚어냈다는 단서를 남긴다. 다음날 낮 처형과 대조해서 판정한다.
        const detectiveActor = players.find((p) => p.role === "detective");
        if (detectiveActor) {
          updatedPlayers = updatedPlayers.map((p) => (p.id === detectiveActor.id ? { ...p, detectiveSpyLead: { spyId: t.id, day: dayNumber } } : p));
        }
      }
    }
  }
  if (effectiveCatDetectTarget) {
    const catActor = players.find((p) => p.role === "cat");
    if (catActor && catActor.catAlignment === "citizen") {
      const t = players.find((p) => p.id === effectiveCatDetectTarget);
      const actionMap = [
        { role: "mafia", targetId: mafiaTarget }, { role: "spy", targetId: effectiveSpyTarget },
        { role: "framer", targetId: effectiveFramerTarget }, { role: "blocker", targetId: blockerTarget },
        { role: "silencer", targetId: effectiveSilencerTarget },
        { role: "police", targetId: effectivePoliceTarget }, { role: "doctor", targetId: effectiveDoctorTarget },
        { role: "soldier", targetId: effectiveSoldierTarget }, { role: "reporter", targetId: effectiveReporterTarget },
        { role: "cultist", targetId: effectiveCultistTarget }, { role: "vampire", targetId: effectiveVampireTarget },
        { role: "witch", targetId: effectiveWitchTarget }, { role: "undertaker", targetId: effectiveUndertakerTarget },
      ];
      if (t) {
        const entry = actionMap.find((a) => a.role === t.role);
        if (entry && entry.targetId) {
          const actedOn = players.find((p) => p.id === entry.targetId);
          catDetectResult = { actorName: t.name, actedOnName: actedOn ? actedOn.name : null };
        } else {
          catDetectResult = { actorName: t.name, actedOnName: null };
        }
      }
    }
  }
  const reporterActorP = players.find((p) => p.role === "reporter");
  const reporterMaxUses = reporterActorP?.powerUpgrade === "reporter_abuse" ? 2 : 1;
  let newReporterUseCount = state.reporterUseCount ?? (reporterUsed ? 1 : 0);
  if (effectiveReporterTarget && newReporterUseCount < reporterMaxUses && dayNumber >= 2) {
    const t = players.find((p) => p.id === effectiveReporterTarget);
    if (t) {
      const framed = isFramed(effectiveReporterTarget);
      const roleLabel = framed ? ROLES.mafia.label : effectiveRoleLabel(t);
      reporterReveal = { name: t.name, roleLabel };
      newReporterUseCount += 1;
      newReporterUsed = newReporterUseCount >= reporterMaxUses;
      revealedRoles[t.id] = roleLabel; // 기자가 공개한 직업은 이후로도 계속 공개 상태 유지
      if (framed) {
        // "천재 해커" 업적 - 해커(framer)의 모함이 기자의 특종으로 이어져 무고한 대상이 마피아로 공개됨.
        updatedPlayers = updatedPlayers.map((p) => (p.role === "framer" ? { ...p, framerExposedNextDay: true } : p));
      } else if (t.role === "mafia") {
        // "정론직필" 업적 - 실제 '마피아'(순수 역할)를 특종으로 정확히 밝혀냄.
        updatedPlayers = updatedPlayers.map((p) => (p.role === "reporter" ? { ...p, reporterRevealedMafiaOnce: true } : p));
      }
    }
  }

  // ── 장의사: 죽은 사람만 조사할 수 있고, 결과는 장의사 본인에게만 공개된다 ──
  if (effectiveUndertakerTarget) {
    const t = players.find((p) => p.id === effectiveUndertakerTarget);
    if (t && !t.alive) {
      const finding = { roleLabel: effectiveRoleLabel(t), wasSoulHarvested: !!t.soulHarvested, wasThrall: !!t.isThrall };
      const undertakerActorP = players.find((p) => p.role === "undertaker");
      undertakerResult = { targetName: t.name, ...finding,
        causeFlavor: undertakerActorP?.powerUpgrade === "undertaker_autopsy" ? (t.deathCause && DEATH_CAUSE_FLAVOR[t.deathCause]) || "사망 원인을 알아낼 수 없다." : undefined };
      undertakerFindings[t.id] = finding;
    }
  }

  // ── [전설의 사기꾼]: 조사·추적·특종 계열 능력 (결과는 사기꾼 본인에게만) ──
  let conartistLegendResult = null;
  if (legendRole && legendTargetAtStart) {
    const t = legendTargetAtStart;
    const role = legendRole;
    const framed = isFramed(t.id);
    if (role === "police") {
      const isMafia = framed ? true : (t.role === "spy" || t.role === "conartist" || t.role === "godfather" || t.recruitedToMafia || t.powerUpgrade === "mafia_disguise" || t.powerUpgrade === "silencer_disguise") ? false : ROLES[t.role].team === "mafia";
      conartistLegendResult = { role, targetName: t.name, isMafia };
    } else if (role === "spy") {
      conartistLegendResult = { role, targetName: t.name, roleLabel: framed ? ROLES.mafia.label : effectiveRoleLabel(t) };
    } else if (role === "undertaker" && !t.alive) {
      conartistLegendResult = { role, targetName: t.name, roleLabel: effectiveRoleLabel(t), wasSoulHarvested: !!t.soulHarvested, wasThrall: !!t.isThrall };
    } else if (role === "detective") {
      const actionMap = [
        { role: "mafia", targetId: mafiaTarget }, { role: "spy", targetId: effectiveSpyTarget },
        { role: "framer", targetId: effectiveFramerTarget }, { role: "blocker", targetId: blockerTarget },
        { role: "silencer", targetId: effectiveSilencerTarget },
        { role: "police", targetId: effectivePoliceTarget }, { role: "doctor", targetId: effectiveDoctorTarget },
        { role: "soldier", targetId: effectiveSoldierTarget }, { role: "reporter", targetId: effectiveReporterTarget },
        { role: "cultist", targetId: effectiveCultistTarget }, { role: "vampire", targetId: effectiveVampireTarget },
        { role: "witch", targetId: effectiveWitchTarget }, { role: "undertaker", targetId: effectiveUndertakerTarget },
      ];
      const entry = actionMap.find((a) => a.role === t.role);
      const actedOn = entry?.targetId ? players.find((p) => p.id === entry.targetId) : null;
      conartistLegendResult = { role, targetName: t.name, actedOnName: actedOn ? actedOn.name : null };
    } else if (role === "reporter" && !legendOnceUsed.reporter) {
      const roleLabel = framed ? ROLES.mafia.label : effectiveRoleLabel(t);
      if (!reporterReveal) {
        reporterReveal = { name: t.name, roleLabel };
        revealedRoles[t.id] = roleLabel;
        legendOnceUsed.reporter = true;
        conartistLegendResult = { role, targetName: t.name, roleLabel };
      } else {
        conartistLegendResult = { role, targetName: t.name, failed: true };
      }
    } else if (role === "soldier" || role === "silencer" || role === "framer" || role === "blocker") {
      conartistLegendResult = { role, targetName: t.name };
    }
  }

  // ── [성불] - 영매가 죽은 사람 한 명을 성불시켜 정확한 직업을 알아낸다. 성불된 사람은 영매 채팅에서 말할 수 없다. ──
  let mediumExorciseResult = null;
  let mediumFindings = { ...(state.mediumFindings || {}) };
  const mediumActorP = players.find((p) => p.role === "medium" && p.alive && !p.inJail);
  if (mediumActorP?.powerUpgrade === "medium_exorcise" && state.mediumTarget && !isRoleBlocked("medium")) {
    const t = players.find((p) => p.id === state.mediumTarget);
    if (t && !t.alive && !t.exorcised) {
      mediumFindings[t.id] = effectiveRoleLabel(t);
      mediumExorciseResult = { targetName: t.name, roleLabel: mediumFindings[t.id] };
      updatedPlayers = updatedPlayers.map((p) => (p.id === t.id ? { ...p, exorcised: true } : p));
      log.push(`👻 떠돌던 영혼 하나가 조용히 성불했습니다.`);
    }
  }
  // ── [행정조사] - 공무원이 밤마다 한 명이 마피아팀인지 시민팀인지 확인한다 (조사를 피하는 마피아팀도 그대로 드러난다) ──
  let officialAuditResult = null;
  const officialActorP = players.find((p) => p.role === "official" && p.alive && !p.inJail);
  if (officialActorP?.powerUpgrade === "official_audit" && state.officialTarget && !isRoleBlocked("official")) {
    const t = players.find((p) => p.id === state.officialTarget);
    if (t) {
      const team = isFramed(t.id) || isMafiaAligned(t) ? "mafia" : t.isThrall ? "neutral" : isCitizenAligned(t) ? "citizen" : "neutral";
      officialAuditResult = { targetName: t.name, team };
    }
  }
  // ── [빙의]·[유품수거] - 빌린 능력 중 조사·특종·협박 계열 (보호·경호는 위의 보호 판정에 이미 반영됨) ──
  let possessResult = null;
  let possessBlockedVoterId = null;
  let possessSpent = !!possessRole;
  if (possessRole && possessTargetAtStart) {
    const t = possessTargetAtStart;
    const framed = isFramed(t.id);
    if (possessRole === "police") {
      const isMafia = framed ? true : (t.role === "spy" || t.role === "conartist" || t.role === "godfather" || t.recruitedToMafia || t.powerUpgrade === "mafia_disguise" || t.powerUpgrade === "silencer_disguise") ? false : ROLES[t.role].team === "mafia";
      possessResult = { role: possessRole, targetName: t.name, isMafia };
    } else if (possessRole === "detective") {
      const acted = traceActionOf(t);
      possessResult = { role: possessRole, targetName: t.name, actedOnName: acted ? acted.name : null };
    } else if (possessRole === "undertaker" && !t.alive) {
      possessResult = { role: possessRole, targetName: t.name, roleLabel: effectiveRoleLabel(t), wasSoulHarvested: !!t.soulHarvested, wasThrall: !!t.isThrall };
    } else if (possessRole === "reporter") {
      if (!reporterReveal && t.alive) {
        const roleLabel = framed ? ROLES.mafia.label : effectiveRoleLabel(t);
        reporterReveal = { name: t.name, roleLabel };
        revealedRoles[t.id] = roleLabel;
        possessResult = { role: possessRole, targetName: t.name, roleLabel };
      } else {
        possessResult = { role: possessRole, targetName: t.name, failed: true };
        possessSpent = false; // 같은 날 다른 특종에 밀렸다면 기회는 남겨둔다
      }
    } else if (possessRole === "soldier" && t.alive) {
      possessBlockedVoterId = t.id;
      possessResult = { role: possessRole, targetName: t.name };
    } else if (possessRole === "doctor" || possessRole === "bodyguard") {
      possessResult = { role: possessRole, targetName: t.name };
    }
  }

  // ── 마녀의 저주 발동 확인: 이전에 걸어둔 저주가 있다면, 오늘이 그 발동일(3일 뒤)인지 확인한다 ──
  // 마피아의 습격과는 완전히 별개로 발동되며, 의사 보호로도 막을 수 없다.
  // 단, 마녀 본인이 그 사이에 죽었다면(처형이든 밤에 죽든 방식 상관없이) 저주는 그대로 풀린다.
  if (curseTargetId && curseDeathDay === dayNumber) {
    const witchActor = updatedPlayers.find((p) => p.role === "witch");
    const witchStillAlive = !!witchActor && witchActor.alive;
    const cursed = updatedPlayers.find((p) => p.id === curseTargetId);
    if (witchStillAlive && cursed && cursed.alive) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === cursed.id ? { ...p, alive: false, deathCause: "witch" } : p));
      curseVictimName = cursed.name;
      log.push(`🔮 ${cursed.name}님이 마녀의 저주로 목숨을 잃었습니다.`);
    } else if (!witchStillAlive) {
      log.push(`🔮 마녀가 이미 목숨을 잃어, 걸려있던 저주가 자연히 풀렸습니다.`);
    }
    curseTargetId = null;
    curseDeathDay = null;
  }

  if (pendingCurses.some((c) => c.day === dayNumber)) {
    const witchActor = updatedPlayers.find((p) => p.role === "witch");
    const witchStillAlive = !!witchActor && witchActor.alive;
    pendingCurses.filter((c) => c.day === dayNumber).forEach((c) => {
      const cursed = updatedPlayers.find((p) => p.id === c.id);
      const casterAlive = c.by ? !!updatedPlayers.find((p) => p.id === c.by)?.alive : witchStillAlive;
      if (casterAlive && cursed && cursed.alive) {
        updatedPlayers = updatedPlayers.map((p) => (p.id === cursed.id ? { ...p, alive: false, deathCause: "witch" } : p));
        if (!curseVictimName) curseVictimName = cursed.name; else extraCurseVictimNames.push(cursed.name);
        log.push(`🔮 ${cursed.name}님이 마녀의 저주로 목숨을 잃었습니다.`);
      }
    });
    pendingCurses = pendingCurses.filter((c) => c.day !== dayNumber);
  }

  // ── [독살] 능력 - 낮에 독을 먹인 대상이 정확히 다음 날에 목숨을 잃는다. ──
  let poisonVictimName = null;
  if (state.hitmanPoisonTargetId && state.hitmanPoisonDeathDay === dayNumber) {
    const poisoned = updatedPlayers.find((p) => p.id === state.hitmanPoisonTargetId);
    if (poisoned && poisoned.alive && poisoned.role !== "cat") {
      updatedPlayers = updatedPlayers.map((p) => (p.id === poisoned.id ? { ...p, alive: false, deathCause: "hitman" } : p));
      poisonVictimName = poisoned.name;
      lastNightDeath = lastNightDeath || poisoned.id;
      hitmanKillVictimId = poisoned.id; hitmanKillVictimName = poisoned.name;
      log.push(`☠️ ${poisoned.name}님이 독으로 인해 목숨을 잃었습니다.`);
    }
  }
  const newHitmanPoisonTargetId = (state.hitmanPoisonTargetId && state.hitmanPoisonDeathDay === dayNumber) ? null : state.hitmanPoisonTargetId;
  const newHitmanPoisonDeathDay = (state.hitmanPoisonTargetId && state.hitmanPoisonDeathDay === dayNumber) ? null : state.hitmanPoisonDeathDay;

  // ── [고대 주술] 능력 - 시전 시 모든 플레이어에게 개별 30% 확률로 저주를 걸었고, 그 저주가 걸린 사람들이
  //    정확히 그 예정일(3일 후)에 한꺼번에 목숨을 잃는다. 여러 명이 동시에 저주에 걸릴 수 있어 배열로 관리한다.
  let ancientCurseVictimNames = [];
  if (state.ancientCurseIds && state.ancientCurseIds.length > 0 && state.ancientCurseDeathDay === dayNumber) {
    const victims = updatedPlayers.filter((p) => state.ancientCurseIds.includes(p.id) && p.alive);
    updatedPlayers = updatedPlayers.map((p) => (victims.some((v) => v.id === p.id) ? { ...p, alive: false, deathCause: "witch" } : p));
    ancientCurseVictimNames = victims.map((v) => v.name);
    if (victims.length > 0) log.push(`🔮 고대 주술에 걸려있던 ${victims.map((v) => v.name).join(", ")}님이 목숨을 잃었습니다.`);
  }
  const newAncientCurseIds = (state.ancientCurseIds && state.ancientCurseDeathDay === dayNumber) ? [] : state.ancientCurseIds;
  const newAncientCurseDeathDay = (state.ancientCurseIds && state.ancientCurseDeathDay === dayNumber) ? null : state.ancientCurseDeathDay;

  // ── 마녀의 저주 시전: 기본은 게임당 단 한 번, [고위 마녀] 능력을 고르면 두 번 더(총 3회) 시전 가능 ──
  const witchActorForCount = updatedPlayers.find((p) => p.role === "witch");
  const witchMaxCasts = witchActorForCount?.powerUpgrade === "witch_high" ? 3 : 1;
  const witchCastCount = state.witchCastCount || 0;
  let newWitchCastCount = witchCastCount;
  if (effectiveWitchTarget && witchCastCount < witchMaxCasts && witchActorForCount?.powerUpgrade !== "witch_mindcontrol") {
    const cursed = updatedPlayers.find((p) => p.id === effectiveWitchTarget);
    if (cursed && cursed.alive && actsAsRole(cursed, "priest")) {
      // 성직자에게는 마녀의 저주가 통하지 않는다 - 대신 성직자가 마녀의 정체를 알게 된다.
      const witchActor = updatedPlayers.find((p) => p.role === "witch");
      if (witchActor) priestFindings[witchActor.id] = { type: "witch", name: witchActor.name };
      newWitchCastCount = witchCastCount + 1;
      log.push(`🔮 마녀가 저주를 걸려 했지만, 성직자에게는 통하지 않았습니다.`);
    } else if (cursed && cursed.alive) {
      if (curseTargetId && curseDeathDay) pendingCurses.push({ id: curseTargetId, day: curseDeathDay });
      curseTargetId = cursed.id;
      curseDeathDay = dayNumber + 3;
      curseCastName = cursed.name;
      newWitchCastCount = witchCastCount + 1;
      log.push(`🔮 ${cursed.name}님이 마녀의 저주를 받았습니다. 3일 후 저주가 발동됩니다.`);
    }
  }

  // ── [방화] - 테러리스트가 이번 밤 방화를 예약했다면, 표식을 남긴 사람들과 함께 불타 죽는다.
  //    의사의 보호와 군인의 방어는 불길도 막아낸다. 고양이와 감옥에 간 사람은 휘말리지 않는다.
  let arsonVictimNames = [];
  if (state.terroristArsonPending) {
    const terr = updatedPlayers.find((p) => p.id === state.terroristArsonPending);
    if (terr && terr.alive && !terr.inJail && terr.role === "terrorist" && terr.powerUpgrade === "terrorist_arson" && !isRoleBlocked("terrorist")) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === terr.id ? { ...p, alive: false, deathCause: "terroristBomb" } : p));
      const burned = [terr.name];
      (terr.terroristMarkedIds || []).forEach((id) => {
        const v = updatedPlayers.find((p) => p.id === id);
        if (!v || !v.alive || v.inJail || v.role === "cat") return;
        if (isProtected(v.id)) {
          nightSaveHappened = true;
          nightSavedName = v.name;
          updatedPlayers = updatedPlayers.map((p) => (p.role === "doctor" ? { ...p, doctorSaveCount: (p.doctorSaveCount || 0) + 1 } : p));
          log.push(`🩺 의사의 보호 덕분에 ${v.name}님은 불길 속에서 목숨을 건졌습니다.`);
          return;
        }
        if (hasNightDefense(v)) {
          updatedPlayers = updatedPlayers.map((p) => (p.id === v.id ? consumeDefense(p) : p));
          veteranSurvivedName = v.name;
          revealedRoles[v.id] = defenseRoleLabel(v);
          log.push(`🪖 ${v.name}님이 불길을 뚫고 살아남았습니다!`);
          return;
        }
        updatedPlayers = updatedPlayers.map((p) => (p.id === v.id ? { ...p, alive: false, deathCause: "terroristBomb" } : p));
        burned.push(v.name);
      });
      arsonVictimNames = burned;
      log.push(`🔥 밤사이 큰 불이 나 ${burned.join(", ")}님이 목숨을 잃었습니다.`);
    }
  }

  // ── [전설의 사기꾼] - 마녀로 위장: 게임당 한 번 저주 (사기꾼이 살아있어야 발동) ──
  if (legendOn("witch") && !legendOnceUsed.witch) {
    const cursed = updatedPlayers.find((p) => p.id === legendTargetId);
    if (cursed && cursed.alive) {
      legendOnceUsed.witch = true;
      if (actsAsRole(cursed, "priest")) {
        priestFindings[legendActor.id] = { type: "witch", name: legendActor.name };
        conartistLegendResult = { role: "witch", targetName: cursed.name, failed: true };
        log.push(`🔮 마녀가 저주를 걸려 했지만, 성직자에게는 통하지 않았습니다.`);
      } else {
        pendingCurses.push({ id: cursed.id, day: dayNumber + 3, by: legendActor.id });
        if (!curseCastName) curseCastName = cursed.name;
        conartistLegendResult = { role: "witch", targetName: cursed.name };
        log.push(`🔮 ${cursed.name}님이 마녀의 저주를 받았습니다. 3일 후 저주가 발동됩니다.`);
      }
    }
  }

  // ── [피의 복수]: 상대 연인이 나 대신 죽었다면, 게임당 한 번 밤에 한 명을 죽인다 (함께 죽는 대가는 없다). ──
  if (effectiveAvengerTarget && avengerActorId) {
    const actor = updatedPlayers.find((p) => p.id === avengerActorId);
    const target = updatedPlayers.find((p) => p.id === effectiveAvengerTarget);
    if (actor && actor.alive && actor.isAvenger && actor.powerUpgrade === "newlywed_revenge" && !actor.avengerUsed && !isAbilityDisabled(actor) && target && target.alive && target.role !== "cat") {
      updatedPlayers = updatedPlayers.map((p) => (p.id === actor.id ? { ...p, avengerUsed: true } : p));
      const bodyguard = guardFor(target.id);
      if (isProtected(target.id)) {
        nightSaveHappened = true;
        nightSavedName = target.name;
        log.push(`🩺 ${target.name}님은 보호 덕분에 목숨을 건졌습니다.`);
      } else if (hasNightDefense(target)) {
        updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? consumeDefense(p) : p));
        veteranSurvivedName = target.name;
        revealedRoles[target.id] = defenseRoleLabel(target);
      } else if (bodyguard) {
        // 경호 대상이었다면 경호원이 대신 죽고, 공격한 연인도 함께 쓰러진다 (경호원의 반격).
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id === actor.id) return { ...p, alive: false, deathCause: "bodyguard" };
          if (p.id === bodyguard.id) return { ...p, alive: false, deathCause: "bodyguard" };
          return p;
        });
        bodyguardSaveResult = { targetName: target.name, bodyguardName: bodyguard.name, attackerName: actor.name };
        if (target.role === "doctor") {
          updatedPlayers = updatedPlayers.map((p) => (p.id === bodyguard.id ? { ...p, bodyguardDiedProtectingDoctor: true } : p));
        }
        log.push(`🛡️ ${bodyguard.name}님이 ${target.name}님을 지키다 목숨을 잃었습니다, 습격자도 함께 쓰러졌습니다.`);
      } else {
        // "너를 위해서" 업적은 마피아팀 전체가 아니라 '마피아'(순수 역할) 그 자체를 처치했을 때만 인정한다.
        const killedMafia = target.role === "mafia";
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id === actor.id) return { ...p, avengerKilledMafia: killedMafia || p.avengerKilledMafia };
          if (p.id === target.id) return { ...p, alive: false, deathCause: "avenger" };
          return p;
        });
        avengerKillResult = { targetName: target.name };
        log.push(`🩸 ${target.name}님이 피의 복수에 쓰러졌습니다.`);
      }
    }
  }

  // ── 괴도: 밤마다 한 명의 보석을 훔친다. 이미 훔친 사람에게는 다시 훔칠 수 없다. ──
  if (effectiveThiefTarget && !stolenFrom[effectiveThiefTarget]) {
    const target = updatedPlayers.find((p) => p.id === effectiveThiefTarget);
    if (target && target.gem) {
      stolenFrom = { ...stolenFrom, [target.id]: target.gem };
      if (!stolenGemTypes.includes(target.gem)) stolenGemTypes = [...stolenGemTypes, target.gem];
      thiefStealResult = { targetName: target.name, gem: target.gem };
    }
  }

  // ── 늑대인간: 밤마다 한 명을 습격한다. 마피아와 같은 대상을 노리면 습격 대신 마피아팀과 동맹한다. ──
  // 같은 밤 앞선 처리(저주·독 등)로 이미 죽었거나 감옥에 간 늑대인간은 습격할 수 없다.
  const werewolfNow = updatedPlayers.find((p) => p.role === "werewolf");
  if (effectiveWerewolfTarget && werewolfNow && werewolfNow.alive && !werewolfNow.inJail) {
    if (effectiveWerewolfTarget === mafiaTarget) {
      // 마피아와 정확히 같은 사람을 노림 -> 동맹 성립. 실제 사망 처리는 마피아의 공격 쪽에서 담당한다.
      updatedPlayers = updatedPlayers.map((p) => (p.role === "werewolf" ? { ...p, isWolfAllied: true } : p));
      log.push(`🐺 늑대인간이 마피아와 같은 표적을 노려, 마피아팀으로 편입되었습니다.`);
    } else {
      const target = updatedPlayers.find((p) => p.id === effectiveWerewolfTarget);
      if (target && target.alive) {
        if (isProtected(effectiveWerewolfTarget)) {
          // 의사의 보호가 경호원보다 우선한다 - 같은 대상을 지켰다면 의사 쪽이 이기고 경호원의 능력은 발동하지 않는다.
          nightSaveHappened = true;
          nightSavedName = target.name;
          updatedPlayers = updatedPlayers.map((p) => (p.role === "doctor" ? { ...p, doctorSaveCount: (p.doctorSaveCount || 0) + 1 } : p));
        } else {
          // 대상이 신혼부부이고 배우자가 살아있다면, 대상 대신 배우자가 죽고 대상은 복수자가 된다.
          const swapped = applyNewlywedSwap(updatedPlayers, target.id);
          updatedPlayers = swapped.players;
          const actualTarget = updatedPlayers.find((p) => p.id === swapped.actualTargetId);
          if (hasNightDefense(actualTarget)) {
            updatedPlayers = updatedPlayers.map((p) => (p.id === actualTarget.id ? consumeDefense(p) : p));
            veteranSurvivedName = actualTarget.name;
            revealedRoles[actualTarget.id] = defenseRoleLabel(actualTarget);
            log.push(`🪖 ${actualTarget.name}님이 늑대인간의 습격에 맞서 싸워 살아남았습니다!`);
          } else if (guardFor(actualTarget.id)) {
            const bodyguard = guardFor(actualTarget.id);
            const wolfActor = updatedPlayers.find((p) => p.role === "werewolf" && p.alive);
            if (bodyguard) {
              updatedPlayers = updatedPlayers.map((p) => {
                if (p.id === bodyguard.id) return { ...p, alive: false, deathCause: "bodyguard" };
                if (wolfActor && p.id === wolfActor.id) return { ...p, alive: false, deathCause: "werewolf" };
                return p;
              });
              bodyguardSaveResult = { targetName: actualTarget.name, bodyguardName: bodyguard.name, attackerName: wolfActor?.name || null };
              if (actualTarget.role === "doctor") {
                updatedPlayers = updatedPlayers.map((p) => (p.id === bodyguard.id ? { ...p, bodyguardDiedProtectingDoctor: true } : p));
              }
              log.push(`🛡️ ${bodyguard.name}님이 ${actualTarget.name}님을 지키다 목숨을 잃었습니다${wolfActor ? `, 늑대인간도 함께 쓰러졌습니다.` : "."}`);
            } else {
              updatedPlayers = updatedPlayers.map((p) => {
                if (p.id === actualTarget.id) return { ...p, alive: false, deathCause: "werewolf" };
                if (p.role === "werewolf") return { ...p, werewolfKillCount: (p.werewolfKillCount || 0) + 1 };
                return p;
              });
              werewolfVictimName = actualTarget.name;
              log.push(`🐺 ${actualTarget.name}님이 늑대인간에게 습격당해 목숨을 잃었습니다.`);
            }
          } else {
            updatedPlayers = updatedPlayers.map((p) => {
              if (p.id === actualTarget.id) return { ...p, alive: false, deathCause: "werewolf" };
              if (p.role === "werewolf") return { ...p, werewolfKillCount: (p.werewolfKillCount || 0) + 1 };
              return p;
            });
            werewolfVictimName = actualTarget.name;
            log.push(`🐺 ${actualTarget.name}님이 늑대인간에게 습격당해 목숨을 잃었습니다.`);
          }
        }
      }
    }
  }

  // ── 사기꾼: 기본은 게임당 단 한 번 위장하면 영구히 유지되지만, [변장의 달인] 능력을 고르면 밤마다 다시 위장할 수 있다. ──
  const conartistActorForUpgrade = updatedPlayers.find((p) => p.role === "conartist");
  const conartistCanRedisguise = conartistActorForUpgrade?.powerUpgrade === "conartist_master";
  if (effectiveConartistTarget && (!conartistUsed || conartistCanRedisguise)) {
    const actor = updatedPlayers.find((p) => p.role === "conartist");
    const target = updatedPlayers.find((p) => p.id === effectiveConartistTarget);
    if (actor && target && target.alive && target.id !== actor.id) {
      // 위장 대상이 이미 위장 중인 사기꾼이라면, 원래 정체가 아니라 그 사람이 현재 위장한 직업을 그대로 베낀다.
      const copiedRole = target.role === "conartist" && target.disguisedAs ? target.disguisedAs : target.role;
      updatedPlayers = updatedPlayers.map((p) => (p.id === actor.id ? { ...p, disguisedAs: copiedRole } : p));
      newConartistUsed = true;
      conartistDisguiseResult = { targetName: target.name, roleLabel: ROLES[copiedRole].label };
      log.push(`🎭 사기꾼이 누군가의 정체로 완전히 위장했습니다.`); // 방송/타인에게는 누구로 위장했는지 공개하지 않는다
    }
  }

  // ── 성직자: 게임당 단 한 번, 죽은 사람 한 명을 부활시킨다. 부활은 모두에게 공개된다. ──
  if (effectivePriestTarget && !priestUsed) {
    const target = updatedPlayers.find((p) => p.id === effectivePriestTarget);
    if (target && !target.alive) {
      updatedPlayers = updatedPlayers.map((p) =>
        p.id === target.id ? { ...p, alive: true, executedByVote: false, soulHarvested: false, deathCause: null, killedById: null } : p
      );
      priestReviveName = target.name;
      newPriestUsed = true;
      log.push(`🕊️ ${target.name}님이 성직자에 의해 부활했습니다.`);
    }
  }

  // ── 판사: 게임당 단 한 번, 감옥에 간 사람 한 명을 사면한다. 사면은 모두에게 공개된다. ──
  if (effectiveJudgePardonTarget && !judgePardonUsed) {
    const target = updatedPlayers.find((p) => p.id === effectiveJudgePardonTarget);
    if (target && target.inJail) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, inJail: false } : p));
      judgePardonResult = { name: target.name };
      newJudgePardonUsed = true;
      log.push(`⚖️ ${target.name}님이 판사에 의해 사면되어 감옥에서 풀려났습니다.`);
    }
  }

  // ── [전설의 사기꾼] - 성직자·판사로 위장: 게임당 한 번 부활 / 사면 ──
  if (legendOn("priest") && !legendOnceUsed.priest) {
    const target = updatedPlayers.find((p) => p.id === legendTargetId);
    if (target && !target.alive) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, alive: true, executedByVote: false, soulHarvested: false, deathCause: null, killedById: null } : p));
      if (!priestReviveName) priestReviveName = target.name;
      legendOnceUsed.priest = true;
      conartistLegendResult = { role: "priest", targetName: target.name };
      log.push(`🕊️ ${target.name}님이 성직자에 의해 부활했습니다.`);
    }
  }
  if (legendOn("judge") && !legendOnceUsed.judge) {
    const target = updatedPlayers.find((p) => p.id === legendTargetId);
    if (target && target.inJail) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, inJail: false } : p));
      if (!judgePardonResult) judgePardonResult = { name: target.name };
      legendOnceUsed.judge = true;
      conartistLegendResult = { role: "judge", targetName: target.name };
      log.push(`⚖️ ${target.name}님이 판사에 의해 사면되어 감옥에서 풀려났습니다.`);
    }
  }

  // ── [빙의]·[유품수거] - 성직자·판사의 능력을 빌린 경우: 부활 / 사면 ──
  if (possessOn("priest")) {
    const target = updatedPlayers.find((p) => p.id === possessTargetId);
    if (target && !target.alive) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, alive: true, executedByVote: false, soulHarvested: false, deathCause: null, killedById: null } : p));
      if (!priestReviveName) priestReviveName = target.name;
      possessResult = { role: "priest", targetName: target.name };
      log.push(`🕊️ ${target.name}님이 성직자에 의해 부활했습니다.`);
    }
  }
  if (possessOn("judge")) {
    const target = updatedPlayers.find((p) => p.id === possessTargetId);
    if (target && target.inJail) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, inJail: false } : p));
      if (!judgePardonResult) judgePardonResult = { name: target.name };
      possessResult = { role: "judge", targetName: target.name };
      log.push(`⚖️ ${target.name}님이 판사에 의해 사면되어 감옥에서 풀려났습니다.`);
    }
  }

  // ── 교사: 매일 밤 학생에게 시민팀 직업 하나를 골라 수업한다. 필요 횟수를 채우면 학생이 그 직업을 갖게 된다. ──
  if (teacherLessonChoice && !isRoleBlocked("teacher")) {
    const teacherActor = updatedPlayers.find((p) => p.role === "teacher" && p.alive);
    const studentActor = teacherActor ? updatedPlayers.find((p) => p.id === teacherActor.partnerId) : null;
    if (teacherActor && studentActor && studentActor.role === "student" && studentActor.alive) {
      const roleKey = teacherLessonChoice;
      const nextCount = (studentActor.teachingProgress?.[roleKey] || 0) + 1;
      const required = requiredLessonsFor(roleKey);
      const graduated = nextCount >= required;
      updatedPlayers = updatedPlayers.map((p) => {
        if (p.id !== studentActor.id) return p;
        if (graduated) return { ...p, role: roleKey, teachingProgress: {}, studentGraduatedSuccessfully: true };
        return { ...p, teachingProgress: { ...(p.teachingProgress || {}), [roleKey]: nextCount } };
      });
      if (graduated) {
        // "최고의 스승" 업적 판정용 - 교사 쪽에도 성공적으로 졸업시켰다는 기록을 남긴다.
        updatedPlayers = updatedPlayers.map((p) => (p.id === teacherActor.id ? { ...p, teacherGraduatedStudent: true } : p));
      }
      teacherLessonResult = { roleKey, roleLabel: ROLES[roleKey].label, count: graduated ? required : nextCount, required, graduated };
      log.push(graduated ? `🍎 학생이 수업을 모두 마치고 새 직업을 갖게 되었습니다.` : `🍎 오늘 밤도 교사와 학생 사이에 조용한 수업이 있었습니다.`);
    }
  }

  // ── 대부: 기본은 게임당 단 한 번, [거래] 능력을 고르면 한 번 더(총 2회) 마피아팀이 아닌 사람을 영입한다. ──
  const godfatherActorForCount = updatedPlayers.find((p) => p.role === "godfather");
  const godfatherMaxRecruits = godfatherActorForCount?.powerUpgrade === "godfather_deal" ? 2 : 1;
  const godfatherRecruitCount = state.godfatherRecruitCount || 0;
  let newGodfatherRecruitCount = godfatherRecruitCount;
  if (effectiveGodfatherTarget && godfatherRecruitCount < godfatherMaxRecruits) {
    const godfatherActor = updatedPlayers.find((p) => p.role === "godfather");
    const target = updatedPlayers.find((p) => p.id === effectiveGodfatherTarget);
    if (godfatherActor && target && target.alive && !isMafiaAligned(target)) {
      newGodfatherRecruitCount = godfatherRecruitCount + 1;
      if (target.role === "police") {
        // 영입 실패 - 대부의 정체가 그 경찰에게만 발각된다.
        policeFindings[godfatherActor.id] = ROLES.godfather.label;
        godfatherCaughtResult = { policeId: target.id };
        log.push(`👑 대부가 누군가를 영입하려 했지만, 경찰에게 정체를 들키며 실패했습니다.`);
      } else if (isNeutralSide(target)) {
        // 중립(용병과 짝이 된 건달·흡혈귀 포함)은 마피아팀으로 영입할 수 없다 - 영입 능력 자체가 발동하지 않고, 대신 대부와 그 중립이
        // 서로의 정체(존재)를 알게 된다. 다른 사람에게는 전혀 공개되지 않는다.
        godfatherNeutralEncounterResult = { targetName: target.name, targetRoleLabel: ROLES[target.role].label };
        godfatherNeutralCaughtId = target.id;
        log.push(`👑 대부가 영입을 시도했지만, 대상은 어느 팀에도 속하지 않는 자였습니다.`);
      } else {
        // 영입 성공 - 원래 직업/능력은 그대로 유지한 채 마피아팀으로 편입된다.
        updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, recruitedToMafia: true } : p));
        godfatherRecruitResult = { targetId: target.id, targetName: target.name };
        if (target.role === "soldier") {
          // "최종보스" 업적 - 건달을 영입했다.
          updatedPlayers = updatedPlayers.map((p) => (p.id === godfatherActor.id ? { ...p, godfatherRecruitedSoldier: true } : p));
        }
        log.push(`👑 어둠 속에서 누군가 새로운 동료를 맞이했습니다.`); // 누가 영입됐는지는 공개 로그에 남기지 않는다
      }
    }
  }

  // ── [전설의 사기꾼] - 대부로 위장: 게임당 한 번 영입 (진짜 대부와 같은 규칙) ──
  let legendGodfatherCaught = null, legendNeutralCaught = null, legendRecruitTargetId = null;
  if (legendOn("godfather") && !legendOnceUsed.godfather) {
    const target = updatedPlayers.find((p) => p.id === legendTargetId);
    if (target && target.alive && !isMafiaAligned(target)) {
      legendOnceUsed.godfather = true;
      if (target.role === "police") {
        policeFindings[legendActor.id] = ROLES.godfather.label;
        legendGodfatherCaught = { policeId: target.id, name: legendActor.name };
        conartistLegendResult = { role: "godfather", targetName: target.name, caught: true };
        log.push(`👑 대부가 누군가를 영입하려 했지만, 경찰에게 정체를 들키며 실패했습니다.`);
      } else if (isNeutralSide(target)) {
        legendNeutralCaught = { id: target.id, name: legendActor.name };
        conartistLegendResult = { role: "godfather", targetName: target.name, neutralRoleLabel: ROLES[target.role].label };
        log.push(`👑 대부가 영입을 시도했지만, 대상은 어느 팀에도 속하지 않는 자였습니다.`);
      } else {
        updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, recruitedToMafia: true } : p));
        legendRecruitTargetId = target.id;
        conartistLegendResult = { role: "godfather", targetName: target.name, success: true };
        log.push(`👑 어둠 속에서 누군가 새로운 동료를 맞이했습니다.`);
      }
    }
  }

  // ── 고양이: 게임당 단 한 번, 밤에 한 명을 '집사'로 임명한다. 집사의 소속 팀에 그대로 편입된다. ──
  if (effectiveCatOwnerTarget) {
    const catActor = updatedPlayers.find((p) => p.role === "cat");
    if (catActor && !catActor.catAlignment && effectiveCatOwnerTarget !== catActor.id) {
      const owner = updatedPlayers.find((p) => p.id === effectiveCatOwnerTarget);
      if (owner) {
        const alignment = isMafiaAligned(owner) ? "mafia" : isCitizenAligned(owner) ? "citizen" : null;
        if (alignment) {
          updatedPlayers = updatedPlayers.map((p) =>
            p.id === catActor.id ? { ...p, catAlignment: alignment, catOwnerId: owner.id } : p
          );
          log.push(`🐱 고양이가 ${owner.name}님을 집사로 삼았습니다.`); // 어느 팀에 편입됐는지는 공개하지 않는다
        }
      }
    }
  }

  // ── 뱀파이어: 1일차 제외 홀수일차 밤에만 활동 ──
  if (effectiveVampireTarget && dayNumber >= 3 && dayNumber % 2 === 1) {
    // 같은 밤 앞선 처리로 이미 죽은 뱀파이어는 흡혈할 수 없고, 이미 죽은 사람은 물 수 없다.
    const vampireActor = updatedPlayers.find((p) => p.role === "vampire" && p.alive && !p.inJail);
    const target = updatedPlayers.find((p) => p.id === effectiveVampireTarget);
    if (vampireActor && target && target.alive) {
      if (target.role === "mafia") {
        // 진짜 마피아를 물면 서로 싸우다 둘 다 죽는다.
        updatedPlayers = updatedPlayers.map((p) =>
          p.id === target.id || p.id === vampireActor.id ? { ...p, alive: false, deathCause: "vampireFight" } : p
        );
        vampireFightResult = { vampireName: vampireActor.name, mafiaName: target.name };
        log.push(`⚔️ 밤 사이, 뱀파이어와 마피아가 격돌해 서로 목숨을 잃었습니다.`);
      } else if (actsAsRole(target, "priest")) {
        // 성직자에게는 뱀파이어의 습격이 통하지 않는다 - 대신 성직자가 뱀파이어의 정체를 알게 된다.
        priestFindings[vampireActor.id] = { type: "vampire", name: vampireActor.name };
        // "뱀파이어 사냥꾼" 업적 준비 - 다음날 낮 처형과 대조해서 판정한다.
        updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, priestVampireLead: { vampireId: vampireActor.id, day: dayNumber } } : p));
        log.push(`🧛 뱀파이어가 습격했지만, 성직자에게는 통하지 않았습니다.`);
      } else {
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id === target.id) return { ...p, isThrall: true };
          if ((target.role === "lover" || target.role === "newlywed") && p.id === target.partnerId && p.alive) return { ...p, isThrall: true };
          return p;
        });
      }
    }
  }

  const mercenaryJustRecruitedByMafia = mafiaTriggeredMercContact && mafiaTarget === mercenaryPlayerForContact?.id;
  if (mafiaTarget && mercenaryJustRecruitedByMafia) {
    // 용병이 마피아의 습격 대상이 된 경우, 죽는 대신 그 자리에서 마피아와 접선해 의뢰를 받는다 - 위에서 이미 처리했다.
  } else if (mafiaTarget) {
    if (mafiaVoteTied) log.push(`🎲 마피아팀의 표가 갈려, 대상이 무작위로 정해졌습니다.`);
    const negated = isProtected(mafiaTarget);
    if (!negated) {
      let victim = updatedPlayers.find((p) => p.id === mafiaTarget);
      if (victim && victim.role === "newlywed" && victim.partnerId && !isAbilityDisabled(victim)) {
        const partner = updatedPlayers.find((p) => p.id === victim.partnerId);
        if (partner && partner.alive) {
          // 원래 노려진 사람(victim)은 살아남고, 배우자가 대신 죽는다.
          // 살아남은 사람은 이제 '복수자'가 되어 게임당 한 번 밤에 누군가를 죽일 수 있다.
          updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, isAvenger: true } : p));
          victim = partner;
        }
      } else if (victim && victim.role === "vampire") {
        // 마피아가 뱀파이어를 노리면, 흡혈귀가 살아있는 한 그중 무작위 한 명이 대신 죽는다.
        const aliveThralls = updatedPlayers.filter((p) => p.isThrall && p.alive && !p.inJail && p.id !== victim.id);
        if (aliveThralls.length > 0) victim = aliveThralls[Math.floor(Math.random() * aliveThralls.length)];
      }
      if (victim && victim.alive && victim.role === "cat") {
        // 고양이는 마녀의 저주와 늑대인간의 습격을 제외하면 절대 죽지 않는다 - 조용히 무효 처리.
      } else if (victim && victim.alive && hasNightDefense(victim)) {
        // 군인의 1회용 방어 - 공격을 막아내고 모두에게 공개적으로 알려진다 (직업도 영구 공개).
        updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? consumeDefense(p) : p));
        veteranSurvivedName = victim.name;
        revealedRoles[victim.id] = defenseRoleLabel(victim);
        log.push(`🪖 ${victim.name}님이 마피아의 공격에 맞서 싸워 살아남았습니다!`);
      } else if (victim && victim.alive && guardFor(victim.id)) {
        // 경호원의 보호 - 경호원이 대신 죽고, 순수 마피아(특수직업 제외) 중 한 명도 함께 목숨을 잃는다.
        const bodyguard = guardFor(victim.id);
        if (bodyguard) {
          const plainMafias = updatedPlayers.filter((p) => p.role === "mafia" && p.alive);
          const attacker = plainMafias.length > 0 ? plainMafias[Math.floor(Math.random() * plainMafias.length)] : null;
          updatedPlayers = updatedPlayers.map((p) => {
            if (p.id === bodyguard.id) return { ...p, alive: false, deathCause: "bodyguard" };
            if (attacker && p.id === attacker.id) return { ...p, alive: false, deathCause: "mafia" };
            return p;
          });
          bodyguardSaveResult = { targetName: victim.name, bodyguardName: bodyguard.name, attackerName: attacker?.name || null };
          if (victim.role === "doctor") {
            updatedPlayers = updatedPlayers.map((p) => (p.id === bodyguard.id ? { ...p, bodyguardDiedProtectingDoctor: true } : p));
          }
          log.push(`🛡️ ${bodyguard.name}님이 ${victim.name}님을 지키다 목숨을 잃었습니다${attacker ? `, 습격자 중 한 명도 함께 쓰러졌습니다.` : "."}`);
        } else {
          updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, alive: false, diedToMafiaAttack: true, deathCause: "mafia" } : p));
          lastNightDeath = victim.id;
          applyMafiaApprenticeReveal(victim.id, effectiveRoleLabel(victim), victim.name);
          log.push(`☠️ 밤 사이, ${victim.name}님이 목숨을 잃었습니다.`);
        }
      } else if (victim && victim.alive) {
        updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, alive: false, diedToMafiaAttack: true, deathCause: "mafia" } : p));
        lastNightDeath = victim.id;
        applyMafiaApprenticeReveal(victim.id, effectiveRoleLabel(victim), victim.name);
        log.push(`☠️ 밤 사이, ${victim.name}님이 목숨을 잃었습니다.`);
      }
    } else {
      nightSaveHappened = true;
      const savedByDoctor = updatedPlayers.find((p) => p.id === mafiaTarget);
      nightSavedName = savedByDoctor ? savedByDoctor.name : null;
      updatedPlayers = updatedPlayers.map((p) => (p.role === "doctor" ? { ...p, doctorSaveCount: (p.doctorSaveCount || 0) + 1 } : p));
      log.push(`🩺 의사의 보호 덕분에 ${savedByDoctor ? savedByDoctor.name : "누군가"}님은 목숨을 건졌습니다.`);
    }
  } else if (!vampireFightResult) {
    log.push(`🌤️ 이번 밤은 특별한 일이 일어나지 않았습니다.`);
  }
  // ── 용병: 의뢰를 받은 뒤로는 매일 밤 혼자서 한 명을 죽일 수 있다. ──
  // ── 건달: 용병과 짝을 이루면 기존 협박 능력을 잃고, 대신 용병과 마찬가지로 매일 밤 한 명을 죽일 수 있다. ──
  const applyIndependentKill = (targetId, killerLabel, causeCode) => {
    if (!targetId) return;
    if (isProtected(targetId)) {
      nightSaveHappened = true;
      updatedPlayers = updatedPlayers.map((p) => (p.role === "doctor" ? { ...p, doctorSaveCount: (p.doctorSaveCount || 0) + 1 } : p));
      const savedPlayer = updatedPlayers.find((p) => p.id === targetId);
      nightSavedName = savedPlayer ? savedPlayer.name : nightSavedName;
      log.push(`🩺 의사의 보호 덕분에 ${savedPlayer ? savedPlayer.name : "누군가"}님은 목숨을 건졌습니다.`);
      return;
    }
    // 대상이 신혼부부이고 배우자가 살아있다면, 대상 대신 배우자가 죽고 대상은 복수자가 된다.
    const swapped = applyNewlywedSwap(updatedPlayers, targetId);
    updatedPlayers = swapped.players;
    const actualTargetId = swapped.actualTargetId;
    const victim = updatedPlayers.find((p) => p.id === actualTargetId);
    if (!victim || !victim.alive) return;
    if (victim.role === "cat") return; // 고양이는 마녀의 저주와 늑대인간의 습격을 제외하면 절대 죽지 않는다.
    if (hasNightDefense(victim)) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? consumeDefense(p) : p));
      veteranSurvivedName = victim.name;
      revealedRoles[victim.id] = defenseRoleLabel(victim);
      log.push(`🪖 ${victim.name}님이 ${killerLabel}의 공격에 맞서 싸워 살아남았습니다!`);
      return;
    }
    // 경호원의 보호 - 경호원이 대신 죽고, 습격한 사람도 경호원의 반격으로 함께 쓰러진다 (마피아·늑대인간·히트맨과 같은 규칙).
    const guard = guardFor(victim.id);
    if (guard) {
      const attackerPool = causeCode === "mafia"
        ? updatedPlayers.filter((p) => p.role === "mafia" && p.alive)
        : updatedPlayers.filter((p) => p.role === causeCode && p.alive);
      const attacker = attackerPool.length ? attackerPool[Math.floor(Math.random() * attackerPool.length)] : null;
      updatedPlayers = updatedPlayers.map((p) => {
        if (p.id === guard.id) return { ...p, alive: false, deathCause: "bodyguard" };
        if (attacker && p.id === attacker.id) return { ...p, alive: false, deathCause: "bodyguard" };
        return p;
      });
      bodyguardSaveResult = { targetName: victim.name, bodyguardName: guard.name, attackerName: attacker?.name || null };
      if (victim.role === "doctor") updatedPlayers = updatedPlayers.map((p) => (p.id === guard.id ? { ...p, bodyguardDiedProtectingDoctor: true } : p));
      log.push(`🛡️ ${guard.name}님이 ${victim.name}님을 지키다 목숨을 잃었습니다${attacker ? ", 습격자도 함께 쓰러졌습니다" : ""}.`);
      return;
    }
    updatedPlayers = updatedPlayers.map((p) => (p.id === victim.id ? { ...p, alive: false, deathCause: causeCode } : p));
    lastNightDeath = lastNightDeath || victim.id; // 화면에 뜨는 대표 사망자 - 이미 마피아의 습격으로 하나 정해졌다면 유지
    soloKillVictimId = victim.id; soloKillVictimName = victim.name;
    log.push(`☠️ 밤 사이, ${victim.name}님이 목숨을 잃었습니다.`);
  };
  if (effectiveMercenaryTarget) applyIndependentKill(effectiveMercenaryTarget, "용병", "mercenary");
  // [민간군사] - 군인이 게임당 한 번 밤에 한 명을 직접 사살한다.
  const veteranActorP = updatedPlayers.find((p) => p.role === "veteran" && p.alive && !p.inJail);
  if (veteranActorP?.powerUpgrade === "veteran_pmc" && !veteranActorP.veteranPmcUsed && state.veteranTarget && !isRoleBlocked("veteran")) {
    updatedPlayers = updatedPlayers.map((p) => (p.id === veteranActorP.id ? { ...p, veteranPmcUsed: true } : p));
    applyIndependentKill(state.veteranTarget, "군인", "veteran");
  }
  const pairedSoldier = updatedPlayers.find((p) => p.role === "soldier" && p.pairedWithMercenary);
  if (pairedSoldier && effectiveSoldierTarget && mercenaryContactEvent?.type !== "soldier") {
    // 건달이 용병과 이미 짝을 이룬 상태에서 이번 밤에 고른 대상은, 더 이상 협박(투표 차단)이 아니라 살해 대상이다.
    applyIndependentKill(effectiveSoldierTarget, "건달", "soldier");
  }
  // [무법자] 능력 - 마피아팀의 첫 번째 습격과는 완전히 별개로, 두 번째 대상도 같은 밤에 함께 노린다.
  if (mafiaSecondTarget) {
    applyIndependentKill(mafiaSecondTarget, "마피아", "mafia");
    const secondVictim = updatedPlayers.find((p) => p.id === mafiaSecondTarget);
    if (secondVictim && !secondVictim.alive && secondVictim.deathCause === "mafia") {
      Object.entries(state.mafiaSecondVotes || {}).forEach(([voterId, targetId]) => {
        const voter = updatedPlayers.find((p) => p.id === voterId);
        if (targetId === mafiaSecondTarget && voter?.role === "mafia" && voter.powerUpgrade === "mafia_apprentice") {
          mafiaApprenticeReveal[voterId] = { targetName: secondVictim.name, roleLabel: effectiveRoleLabel(secondVictim) };
        }
      });
    }
  }
  // [암살] 능력 - 스파이가 조사 대신 밤마다 한 명을 죽인다.
  if (spyActorForBlock?.powerUpgrade === "spy_assassin" && effectiveSpyTarget) applyIndependentKill(effectiveSpyTarget, "스파이", "spy");

  // ── 히트맨: 대상의 직업을 정확히 추측해야만 암살에 성공한다. 의사·군인·경호원의 보호를 받는다. ──
  let hitmanResult = null; // { targetName, correct } - 히트맨 본인에게만 비공개로 알려준다
  let hitmanSecondResult = null; // [다중암살] 능력의 두 번째 대상 결과
  const hitmanActorForUpgrade = updatedPlayers.find((p) => p.role === "hitman" && p.alive);
  const hitmanIgnoreProtections = hitmanActorForUpgrade?.powerUpgrade === "hitman_snipe"; // [저격] - 모든 방해를 무시하고 확정 사망
  if (hitmanActorForUpgrade?.powerUpgrade === "hitman_multi" && effectiveHitmanTargetId && hitmanGuessedRole && state.hitmanSecondTargetId && state.hitmanSecondGuessedRole) {
    // [다중암살] - 두 명을 동시에 노리며, 둘 다 직업을 맞춰야만(한 명만 맞으면 아무도 안 죽음) 둘 다 죽는다.
    const t1 = updatedPlayers.find((p) => p.id === effectiveHitmanTargetId);
    const t2 = updatedPlayers.find((p) => p.id === state.hitmanSecondTargetId);
    const correct1 = !!t1 && t1.alive && t1.role === hitmanGuessedRole;
    const correct2 = !!t2 && t2.alive && t2.role === state.hitmanSecondGuessedRole;
    if (t1) hitmanResult = { targetName: t1.name, correct: correct1 };
    if (t2) hitmanSecondResult = { targetName: t2.name, correct: correct2 };
    // 다중암살도 일반 암살과 마찬가지로 의사 보호·고양이·군인 방어·경호원 보호를 받는다 (모든 방해 무시는 [저격]만의 특권).
    const shielded = (x) => isProtected(x.id) || x.role === "cat" || (hasNightDefense(x)) ||
      !!guardFor(x.id);
    if (correct1 && correct2 && t1.id !== t2.id && !shielded(t1) && !shielded(t2)) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === t1.id || p.id === t2.id) ? { ...p, alive: false, deathCause: "hitman" } : p);
      lastNightDeath = lastNightDeath || t1.id;
      hitmanKillVictimId = t2.id; hitmanKillVictimName = t2.name;
      log.push(`☠️ 히트맨의 다중암살로 ${t1.name}님과 ${t2.name}님이 함께 목숨을 잃었습니다.`);
    }
  } else if (effectiveHitmanTargetId && hitmanGuessedRole && hitmanActorForUpgrade?.powerUpgrade !== "hitman_multi") {
    const target = updatedPlayers.find((p) => p.id === effectiveHitmanTargetId);
    if (target && target.alive) {
      const correct = target.role === hitmanGuessedRole;
      hitmanResult = { targetName: target.name, correct };
      if (correct) {
        if (!hitmanIgnoreProtections && isProtected(target.id)) {
          nightSaveHappened = true;
          nightSavedName = target.name;
          updatedPlayers = updatedPlayers.map((p) => (p.role === "doctor" ? { ...p, doctorSaveCount: (p.doctorSaveCount || 0) + 1 } : p));
          log.push(`🩺 의사의 보호 덕분에 ${target.name}님은 목숨을 건졌습니다.`);
        } else {
          // 대상이 신혼부부이고 배우자가 살아있다면, 대상 대신 배우자가 죽고 대상은 복수자가 된다. ([저격]은 이마저 무시한다)
          const swapped = hitmanIgnoreProtections ? { players: updatedPlayers, actualTargetId: target.id } : applyNewlywedSwap(updatedPlayers, target.id);
          updatedPlayers = swapped.players;
          const actualTarget = updatedPlayers.find((p) => p.id === swapped.actualTargetId);
          if (actualTarget.role === "cat") { // 고양이는 [저격]으로도 죽지 않는다
            // 고양이는 마녀의 저주와 늑대인간의 습격을 제외하면 절대 죽지 않는다. (단, [저격] 능력은 이마저 무시한다)
          } else if (!hitmanIgnoreProtections && hasNightDefense(actualTarget)) {
            updatedPlayers = updatedPlayers.map((p) => (p.id === actualTarget.id ? consumeDefense(p) : p));
            veteranSurvivedName = actualTarget.name;
            revealedRoles[actualTarget.id] = defenseRoleLabel(actualTarget);
            log.push(`🪖 ${actualTarget.name}님이 마피아의 공격에 맞서 싸워 살아남았습니다!`);
          } else if (!hitmanIgnoreProtections && guardFor(actualTarget.id)) {
            const bodyguard = guardFor(actualTarget.id);
            if (bodyguard) {
              const hitmanActor = updatedPlayers.find((p) => p.role === "hitman" && p.alive);
              updatedPlayers = updatedPlayers.map((p) => {
                if (p.id === bodyguard.id) return { ...p, alive: false, deathCause: "bodyguard" };
                // 마피아 집단습격과 마찬가지로, 경호원이 막아내면 공격한 쪽도 함께 목숨을 잃는다.
                // 히트맨은 익명의 집단투표가 아니라 신원이 명확한 단독 공격자이므로, 무작위가 아니라 히트맨 본인이 죽는다.
                if (hitmanActor && p.id === hitmanActor.id) return { ...p, alive: false, deathCause: "bodyguard" };
                return p;
              });
              bodyguardSaveResult = { targetName: actualTarget.name, bodyguardName: bodyguard.name, attackerName: hitmanActor?.name || null };
              if (actualTarget.role === "doctor") {
                updatedPlayers = updatedPlayers.map((p) => (p.id === bodyguard.id ? { ...p, bodyguardDiedProtectingDoctor: true } : p));
              }
              log.push(`🛡️ ${bodyguard.name}님이 ${actualTarget.name}님을 지키다 목숨을 잃었습니다${hitmanActor ? `, 습격자도 함께 쓰러졌습니다.` : "."}`);
            } else {
              updatedPlayers = updatedPlayers.map((p) => (p.id === actualTarget.id ? { ...p, alive: false, diedToMafiaAttack: true, deathCause: "hitman" } : p));
              lastNightDeath = lastNightDeath || actualTarget.id;
              hitmanKillVictimId = actualTarget.id; hitmanKillVictimName = actualTarget.name;
              log.push(`☠️ 밤 사이, ${actualTarget.name}님이 목숨을 잃었습니다.`);
            }
          } else {
            updatedPlayers = updatedPlayers.map((p) => (p.id === actualTarget.id ? { ...p, alive: false, diedToMafiaAttack: true, deathCause: "hitman" } : p));
            lastNightDeath = lastNightDeath || actualTarget.id;
            hitmanKillVictimId = actualTarget.id; hitmanKillVictimName = actualTarget.name;
            log.push(`☠️ 밤 사이, ${actualTarget.name}님이 목숨을 잃었습니다.`);
          }
        }
      }
    }
  }

  // ── [전설의 사기꾼] - 히트맨으로 위장: 직업을 맞히면 암살 (의사·고양이·군인·경호원의 보호를 받는다) ──
  if (legendOn("hitman") && state.conartistLegendGuess) {
    const target = updatedPlayers.find((p) => p.id === legendTargetId);
    const attacker = updatedPlayers.find((p) => p.id === legendActor.id);
    if (target && target.alive && attacker?.alive) {
      const correct = target.role === state.conartistLegendGuess;
      conartistLegendResult = { role: "hitman", targetName: target.name, correct };
      if (correct) {
        if (isProtected(target.id)) {
          nightSaveHappened = true;
          nightSavedName = target.name;
          updatedPlayers = updatedPlayers.map((p) => (p.role === "doctor" ? { ...p, doctorSaveCount: (p.doctorSaveCount || 0) + 1 } : p));
          log.push(`🩺 의사의 보호 덕분에 ${target.name}님은 목숨을 건졌습니다.`);
        } else {
          const swapped = applyNewlywedSwap(updatedPlayers, target.id);
          updatedPlayers = swapped.players;
          const actualTarget = updatedPlayers.find((p) => p.id === swapped.actualTargetId);
          const bodyguard = guardFor(actualTarget.id);
          if (actualTarget.role === "cat") {
            // 고양이는 죽지 않는다.
          } else if (hasNightDefense(actualTarget)) {
            updatedPlayers = updatedPlayers.map((p) => (p.id === actualTarget.id ? consumeDefense(p) : p));
            veteranSurvivedName = actualTarget.name;
            revealedRoles[actualTarget.id] = defenseRoleLabel(actualTarget);
            log.push(`🪖 ${actualTarget.name}님이 마피아의 공격에 맞서 싸워 살아남았습니다!`);
          } else if (bodyguard) {
            updatedPlayers = updatedPlayers.map((p) => {
              if (p.id === bodyguard.id) return { ...p, alive: false, deathCause: "bodyguard" };
              if (p.id === attacker.id) return { ...p, alive: false, deathCause: "bodyguard" };
              return p;
            });
            bodyguardSaveResult = { targetName: actualTarget.name, bodyguardName: bodyguard.name, attackerName: attacker.name };
            log.push(`🛡️ ${bodyguard.name}님이 ${actualTarget.name}님을 지키다 목숨을 잃었습니다, 습격자도 함께 쓰러졌습니다.`);
          } else if (actualTarget.alive) {
            updatedPlayers = updatedPlayers.map((p) => (p.id === actualTarget.id ? { ...p, alive: false, diedToMafiaAttack: true, deathCause: "hitman" } : p));
            if (!hitmanKillVictimId) { hitmanKillVictimId = actualTarget.id; hitmanKillVictimName = actualTarget.name; }
            lastNightDeath = lastNightDeath || actualTarget.id;
            log.push(`☠️ 밤 사이, ${actualTarget.name}님이 목숨을 잃었습니다.`);
          }
        }
      }
    }
  }
  // 의사·경호원으로 위장한 경우의 결과
  if (legendOn("doctor") && legendTargetAtStart) {
    conartistLegendResult = { role: "doctor", targetName: legendTargetAtStart.name, saved: nightSaveHappened && nightSavedName === legendTargetAtStart.name };
  }
  if (legendOn("bodyguard") && legendTargetAtStart) {
    conartistLegendResult = { role: "bodyguard", targetName: legendTargetAtStart.name };
  }
  if (legendActor && Object.keys(legendOnceUsed).length) {
    updatedPlayers = updatedPlayers.map((p) => (p.id === legendActor.id ? { ...p, legendOnceUsed } : p));
  }

  if (reporterReveal) log.push(`📰 기자의 취재: ${reporterReveal.name}님의 직업은 [${reporterReveal.roleLabel}]입니다.`);

  // ── 백수: 1일차 밤에 죽은 사람이 직업을 갖고 있었다면(중립/연인/신혼부부 제외) 그 직업을 물려받아 취직한다 ──
  let unemployedJobGrantedPlayerId = null;
  let unemployedJobGrantedLabel = null;
  if (dayNumber === 1 && lastNightDeath) {
    const deadPlayer = updatedPlayers.find((p) => p.id === lastNightDeath);
    const excludedFromInheritance = ["citizen", "lover", "newlywed", "unemployed"];
    if (deadPlayer && !excludedFromInheritance.includes(deadPlayer.role) && ROLES[deadPlayer.role].team !== "neutral") {
      const unemployedPlayer = updatedPlayers.find((p) => p.role === "unemployed" && p.alive);
      if (unemployedPlayer) {
        const inheritedRole = deadPlayer.role;
        const deadPartnerId = deadPlayer.partnerId; // 교사/학생처럼 짝이 있던 직업이면, 살아있는 파트너의 id
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id === unemployedPlayer.id) return { ...p, role: inheritedRole, partnerId: deadPartnerId || null };
          // 살아있는 파트너 쪽도, 죽은 원래 짝이 아니라 새로 물려받은 사람을 가리키도록 갱신해야
          // 채팅방 키와 교사의 능력(파트너 조회)이 정상적으로 이어진다.
          if (deadPartnerId && p.id === deadPartnerId) return { ...p, partnerId: unemployedPlayer.id };
          return p;
        });
        unemployedJobGrantedPlayerId = unemployedPlayer.id;
        unemployedJobGrantedLabel = ROLES[inheritedRole].label;
        log.push(`🛋️ 빈자리가 채워졌습니다.`); // 누가 무엇을 물려받았는지는 본인에게만 비공개로 알려준다
      }
    }
  }

  // ── 1일차 밤이 끝나는 첫 아침에만: 고양이가 있다면 등장 알림을 띄우고, 그제서야 직업을 공개한다 ──
  let catAppearedName = null;
  if (dayNumber === 1) {
    const cat = updatedPlayers.find((p) => p.role === "cat");
    if (cat) {
      catAppearedName = cat.name;
      revealedRoles[cat.id] = ROLES.cat.label; // 첫날 밤까지는 비공개, 첫 아침이 되어서야 플레이어 목록에 표기된다
    }
  }

  // [전설의 등장] 능력 - 이 밤이 시작되기 전에 이미 다른 마피아가 모두 죽어있었다면, 이번 밤 대부가
  // 어떤 이유로든 목숨을 잃었더라도 전성기의 힘으로 다시 일어난다 (밤에는 절대 죽지 않는다).
  const godfatherAtNightStart = state.players.find((p) => p.role === "godfather");
  if (godfatherAtNightStart?.powerUpgrade === "godfather_legend" && godfatherAtNightStart.alive) {
    const otherMafiaWereAlive = state.players.some((p) => p.id !== godfatherAtNightStart.id && isMafiaAligned(p) && p.alive);
    const godfatherDiedThisNight = !updatedPlayers.find((p) => p.id === godfatherAtNightStart.id)?.alive;
    if (!otherMafiaWereAlive && godfatherDiedThisNight) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === godfatherAtNightStart.id ? { ...p, alive: true, deathCause: null } : p));
      // 되살아난 대부가 아침에 "사망한 채로 발견"으로 발표되면 정체가 드러나므로 사망 기록을 지운다.
      const gid = godfatherAtNightStart.id;
      const gname = godfatherAtNightStart.name;
      if (lastNightDeath === gid) lastNightDeath = null;
      if (hitmanKillVictimId === gid) { hitmanKillVictimId = null; hitmanKillVictimName = null; }
      if (soloKillVictimId === gid) { soloKillVictimId = null; soloKillVictimName = null; }
      if (curseVictimName === gname) curseVictimName = null;
      if (werewolfVictimName === gname) werewolfVictimName = null;
      ancientCurseVictimNames = ancientCurseVictimNames.filter((n) => n !== gname);
      arsonVictimNames = arsonVictimNames.filter((n) => n !== gname);
      log = log.filter((l) => !(l.includes(`${gname}님`) && (l.startsWith("☠️") || l.startsWith("🔮") || l.startsWith("🐺"))));
      log.push(`👑 밤사이 누군가가 죽음의 문턱에서 다시 일어났다는 소문이 돕니다.`);
    }
  }

  // ── 누가 누구를 죽였는지 기록 ([명추리]·[결정적 유언]용). 마피아팀의 집단 습격이면 그 대상에 투표한 마피아 중 무작위 한 명. ──
  const randomOf = (arr) => (arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);
  const votersFor = (votes, id) => Object.entries(votes || {}).filter(([, t]) => t === id).map(([v]) => v);
  const idByName = (name) => (name ? players.find((p) => p.name === name)?.id || null : null);
  const roleActorId = (role) => players.find((p) => p.role === role)?.id || null;
  const policeShooter = players.find((p) => p.role === "police" && p.powerUpgrade === "police_hitman");
  const guardAttackerId = () => {
    if (!bodyguardSaveResult) return null;
    const tgt = players.find((p) => p.name === bodyguardSaveResult.targetName);
    if (tgt && tgt.id === mafiaTarget) return randomOf(votersFor(mafiaVotesEffective, mafiaTarget)) || idByName(bodyguardSaveResult.attackerName);
    if (bodyguardSaveResult.attackerName) return idByName(bodyguardSaveResult.attackerName);
    if (policeShooter && effectivePoliceTarget === tgt?.id) return policeShooter.id;
    return null;
  };
  const killerIdOf = (p) => {
    const bgName = bodyguardSaveResult?.bodyguardName;
    switch (p.deathCause) {
      case "mafia": {
        if (policeShooter && effectivePoliceTarget === p.id) return policeShooter.id;
        const v = [...votersFor(mafiaVotesEffective, p.id), ...votersFor(state.mafiaSecondVotes, p.id)];
        return v.length ? randomOf(v) : idByName(bgName);
      }
      case "hitman": return legendOn("hitman") && legendTargetId === p.id ? legendActor.id : roleActorId("hitman");
      case "werewolf": return p.role === "werewolf" ? idByName(bgName) : roleActorId("werewolf");
      case "spy": case "mercenary": case "witch": case "soldier": case "veteran": return roleActorId(p.deathCause);
      case "terroristBomb": return roleActorId("terrorist");
      case "vampireFight": return vampireFightResult ? idByName(p.name === vampireFightResult.vampireName ? vampireFightResult.mafiaName : vampireFightResult.vampireName) : null;
      case "avenger": return avengerActorId || null;
      case "bodyguard": return p.name === bgName ? guardAttackerId() : idByName(bgName);
      default: return null;
    }
  };
  updatedPlayers = updatedPlayers.map((p) => {
    const before = players.find((q) => q.id === p.id);
    if (!before?.alive || p.alive) return p;
    return { ...p, deathNight: dayNumber, killedById: killerIdOf(p) };
  });
  // [결정적 유언] - 경호하다 죽은 경호원이 남긴 유언으로, 자신을 죽인 사람이 다음 날 모두에게 공개된다.
  let bodyguardLastWord = null;
  if (bodyguardSaveResult) {
    const bg = updatedPlayers.find((p) => p.name === bodyguardSaveResult.bodyguardName);
    if (bg && bg.role === "bodyguard" && bg.powerUpgrade === "bodyguard_lastword" && !bg.alive) {
      const killer = players.find((p) => p.id === bg.killedById);
      if (killer) bodyguardLastWord = { bodyguardName: bg.name, killerName: killer.name };
    }
  }
  if (possessActor && possessSpent) {
    updatedPlayers = updatedPlayers.map((p) => (p.id === possessActor.id ? { ...p, possessUsed: true } : p));
  }
  if (possessOn("doctor") && possessResult) possessResult = { ...possessResult, saved: nightSaveHappened && nightSavedName === possessResult.targetName };
  const nightSavedPlayer = nightSavedName ? players.find((p) => p.name === nightSavedName) : null;
  const nightSaveBy = nightSavedPlayer ? saverOf(nightSavedPlayer.id) : null;
  // [골목대장] - 협박에 성공한 건달은 다음 날 2표를 행사한다.
  const soldierActorP = players.find((p) => p.role === "soldier" && p.alive && !p.inJail);
  const soldierBossVoterId = soldierActorP?.powerUpgrade === "soldier_boss" && !soldierActorP.pairedWithMercenary && effectiveSoldierTarget && !soldierTriggeredMercContact ? soldierActorP.id : null;

  // ── 이번 밤 각자 알아낸 직업을 개인 플레이어 목록용으로 누적한다 ──
  let knownRoles = { ...(state.knownRoles || {}) };
  {
    const L = (viewerId, targetId, label) => { knownRoles = learnRole(knownRoles, viewerId, targetId, label); };
    const idOf = (name) => (name ? players.find((p) => p.name === name)?.id || null : null);
    const actorOf = (role) => players.find((p) => p.role === role)?.id || null;
    [policeResult, policeSecondResult].forEach((r) => r?.roleLabel && L(actorOf("police"), idOf(r.targetName), r.roleLabel));
    if (spyResult?.roleLabel) L(actorOf("spy"), idOf(spyResult.targetName), spyResult.roleLabel);
    if (detectiveResult?.identity) L(actorOf("detective"), idOf(detectiveResult.actorName), detectiveResult.roleLabel);
    if (doctorResult?.roleLabel) L(actorOf("doctor"), idOf(doctorResult.targetName), doctorResult.roleLabel);
    if (undertakerResult?.roleLabel) L(actorOf("undertaker"), idOf(undertakerResult.targetName), undertakerResult.roleLabel);
    if (blockerSpyResult?.roleLabel) L(actorOf("blocker"), idOf(blockerSpyResult.targetName), blockerSpyResult.roleLabel);
    if (mediumExorciseResult) L(actorOf("medium"), idOf(mediumExorciseResult.targetName), mediumExorciseResult.roleLabel);
    Object.entries(mafiaApprenticeReveal).forEach(([vid, r]) => L(vid, idOf(r.targetName), r.roleLabel));
    if (legendActor && conartistLegendResult) {
      const r = conartistLegendResult;
      if (r.roleLabel) L(legendActor.id, idOf(r.targetName), r.roleLabel);
      if (r.role === "hitman" && r.correct && state.conartistLegendGuess) L(legendActor.id, idOf(r.targetName), ROLES[state.conartistLegendGuess]?.label);
      if (r.role === "godfather" && r.neutralRoleLabel) L(legendActor.id, idOf(r.targetName), r.neutralRoleLabel);
    }
    if (possessActor && possessResult?.roleLabel) L(possessActor.id, idOf(possessResult.targetName), possessResult.roleLabel);
    if (hitmanResult?.correct && hitmanGuessedRole) L(actorOf("hitman"), idOf(hitmanResult.targetName), ROLES[hitmanGuessedRole]?.label);
    if (hitmanSecondResult?.correct && state.hitmanSecondGuessedRole) L(actorOf("hitman"), idOf(hitmanSecondResult.targetName), ROLES[state.hitmanSecondGuessedRole]?.label);
    Object.entries(veteranSpyAlert).forEach(([vetId]) => L(vetId, actorOf("spy"), ROLES.spy.label));
    Object.entries(priestFindings).forEach(([attackerId, f]) => { if (!state.priestFindings?.[attackerId]) L(actorOf("priest"), attackerId, f.type === "witch" ? ROLES.witch.label : ROLES.vampire.label); });
    if (godfatherCaughtResult) L(godfatherCaughtResult.policeId, actorOf("godfather"), ROLES.godfather.label);
    if (legendGodfatherCaught) L(legendGodfatherCaught.policeId, legendActor?.id, ROLES.godfather.label);
    if (godfatherNeutralEncounterResult) {
      L(actorOf("godfather"), godfatherNeutralCaughtId, godfatherNeutralEncounterResult.targetRoleLabel);
      L(godfatherNeutralCaughtId, actorOf("godfather"), ROLES.godfather.label);
    }
    if (legendNeutralCaught) L(legendNeutralCaught.id, legendActor?.id, ROLES.godfather.label);
    if (conartistDisguiseResult) {
      const t = players.find((p) => p.name === conartistDisguiseResult.targetName);
      if (t && ROLES[t.role].label === conartistDisguiseResult.roleLabel) L(actorOf("conartist"), t.id, conartistDisguiseResult.roleLabel);
    }
    if (unemployedJobGrantedPlayerId && lastNightDeath) L(unemployedJobGrantedPlayerId, lastNightDeath, unemployedJobGrantedLabel);
    if (mercenaryContactEvent?.contactPlayerId && mercenaryPlayerForContact) {
      const contact = players.find((p) => p.id === mercenaryContactEvent.contactPlayerId);
      if (contact) { L(mercenaryPlayerForContact.id, contact.id, ROLES[contact.role].label); L(contact.id, mercenaryPlayerForContact.id, ROLES.mercenary.label); }
    }
  }

  updatedPlayers = clearDeadSheriffFlag(updatedPlayers);
  const announcedNames = new Set([
    players.find((p) => p.id === lastNightDeath)?.name, hitmanKillVictimName, soloKillVictimName, curseVictimName, ...extraCurseVictimNames,
    werewolfVictimName, vampireFightResult?.vampireName, vampireFightResult?.mafiaName, avengerKillResult?.avengerName, avengerKillResult?.targetName,
    bodyguardSaveResult?.bodyguardName, bodyguardSaveResult?.attackerName, ...ancientCurseVictimNames, ...arsonVictimNames,
  ].filter(Boolean));
  const extraNightDeaths = updatedPlayers
    .filter((p) => !p.alive && players.find((q) => q.id === p.id)?.alive && !announcedNames.has(p.name))
    .map((p) => ({ id: p.id, name: p.name }));
  // 괴도는 보석을 모두 모은 채 그 밤을 살아서 넘겨야 승리한다 (같은 밤에 죽거나 감옥에 가면 무효).
  const thiefAliveNow = updatedPlayers.some((p) => p.role === "thief" && p.alive && !p.inJail);
  const winner = stolenGemTypes.length >= GEM_TYPES.length && thiefAliveNow ? "thief" : checkWinner(updatedPlayers);
  return {
    ...state, players: updatedPlayers, extraNightDeaths,
    phase: winner ? "gameover" : "morning", winner,
    dayNumber: state.dayNumber + 1, // 밤이 끝나고 아침이 되는 시점에 날짜가 하루 넘어간다 (밤 N → 아침 N+1)
    lastNightDeath, nightSaveHappened, nightSavedName, hitmanKillVictimId, hitmanKillVictimName, soloKillVictimId, soloKillVictimName, policeResult, policeSecondResult, spyResult, detectiveResult, reporterReveal, doctorResult, undertakerResult, hitmanResult,
    mafiaApprenticeReveal,
    mercenaryPendingContacts,
    veteranSurvivedName, vampireFightResult, curseVictimName, curseCastName, curseTargetId, curseDeathDay, pendingCurses, extraCurseVictimNames,
    hitmanPoisonTargetId: newHitmanPoisonTargetId, hitmanPoisonDeathDay: newHitmanPoisonDeathDay, hitmanSecondResult,
    ancientCurseIds: newAncientCurseIds, ancientCurseDeathDay: newAncientCurseDeathDay, ancientCurseVictimNames,
    avengerKillResult, avengerTarget: null, avengerActorId: null,
    thiefTarget: null, stolenFrom, stolenGemTypes, thiefStealResult,
    werewolfTarget: null, werewolfVictimName,
    priestTarget: null, priestReviveName,
    conartistTarget: null, conartistDisguiseResult, conartistLegendRole: null, conartistLegendTarget: null, conartistLegendGuess: null, conartistLegendResult,
    legendGodfatherCaught, legendNeutralCaught, legendRecruitTargetId,
    arsonVictimNames, terroristArsonPending: null,
    extraBlockedVoterId: legendOn("soldier") ? legendTargetId : null,
    extraBlockedChatterId: legendOn("silencer") ? legendTargetId : null,
    godfatherTarget: null, godfatherRecruitResult, godfatherCaughtResult, godfatherNeutralEncounterResult, godfatherNeutralCaughtId, policeFindings,
    judgePardonTarget: null, judgePardonResult, judgePardonUsed: newJudgePardonUsed,
    teacherLessonChoice: null, teacherLessonResult,
    counselorTarget: null, // 밤이 끝났으니 하루짜리 상담 선택도 초기화 - 내일 낮에 다시 골라야 한다
    bodyguardTarget: null, bodyguardSaveResult,
    catOwnerTarget: null, catDetectTarget: null, catDetectResult,
    catAppearedName,
    unemployedJobGrantedPlayerId, unemployedJobGrantedLabel,
    veteranSpyAlert, revealedRoles, undertakerFindings, spyFindings, priestFindings,
    nightLordResult: nightLordActor ? { active: true } : null, nightLordPendingId: null, knownRoles,
    possessUse: null, possessResult: possessResult && possessActor ? { ...possessResult, actorId: possessActor.id } : null, possessBlockedVoterId,
    mediumTarget: null, mediumExorciseResult, mediumFindings, officialTarget: null, officialAuditResult, detectiveFindings,
    veteranTarget: null, bodyguardLastWord, nightSaveBy, soldierBossVoterId, reporterUseCount: newReporterUseCount,
    cultistTarget: effectiveCultistTarget, // 투표 시점에 다시 대조해야 하므로 막히지 않은 값만 남겨둔다
    blockerPrevTarget: blockerTarget || state.blockerPrevTarget || null,
    spySeducePrevTarget: seduceActive ? spyTarget : null,
    seducedAbilityId: seducedPlayer?.id || null, mindControlledId: mindControlledPlayer?.id || null,
    silencerPrevTarget: silencerTarget || state.silencerPrevTarget || null,
    reporterUsed: newReporterUsed, witchUsed: newWitchCastCount >= witchMaxCasts, witchCastCount: newWitchCastCount, priestUsed: newPriestUsed, conartistUsed: newConartistUsed,
    godfatherUsed: newGodfatherRecruitCount >= godfatherMaxRecruits, godfatherRecruitCount: newGodfatherRecruitCount,
    blockedVoterId: (soldierTriggeredMercContact || updatedPlayers.find((p) => p.role === "soldier")?.pairedWithMercenary) ? null : (effectiveSoldierTarget || null),
    blockedChatterId: effectiveSilencerTarget || null,
    blockedAbilityId: blockerTarget || null,
    virusResult, virusLostId, blockerCharmResult, charmSealedId, blockerSpyResult, hostedVoterId, hostVoterBy,
    framerWiretapTargetId: null, framerTarget: null, reporterInfiltrateTargetId: null,
    legendBlockedAbilityId: legendBlockedPlayer?.id || null,
    timerSeconds: winner ? 0 : 12, timerRunning: !winner,
    log: log.slice(-60), // 로그가 끝없이 커지지 않도록 최근 60개만 유지 (트래픽 절약)
  };
}

function resolveSheriffVerdict(state) {
  const target = state.players.find((p) => p.id === state.sheriffDesignatedTarget);
  // [이단심판]이면 처형을 내리는 사람은 보안관이 아니라 성직자다 (무고해도 감옥에 가지 않는다).
  const inquisitor = state.inquisitionBy ? state.players.find((p) => p.id === state.inquisitionBy) : null;
  const sheriff = inquisitor || state.players.find((p) => p.isSheriff);
  const noJail = !!inquisitor || (sheriff?.role === "politician" && sheriff.powerUpgrade === "politician_dictator");
  let updatedPlayers = state.players;
  let log = [...state.log];
  let sheriffExecutionResult = null;
  let sheriffJustJailedName = state.sheriffJustJailedName || null;
  let terroristBombVictimName = null;
  let cultistStacks = state.cultistStacks || 0;

  if (state.sheriffVerdict === "execute" && target && target.alive) {
    // 스파이·사기꾼·대부는 경찰 조사·처형 공개 등 다른 모든 곳과 마찬가지로, 보안관의 즉결처형에서도
    // 절대 "마피아였다"로 드러나지 않는다 - 실제로는 마피아팀이어도 무고한 처형과 똑같이 취급되어 감옥에 간다.
    // 스파이·사기꾼·대부·대부에게 영입된 사람은 보안관의 즉결처형에서도 절대 마피아로 드러나지 않는다.
    const wasMafia = target.role !== "spy" && target.role !== "conartist" && target.role !== "godfather" && !target.recruitedToMafia && target.powerUpgrade !== "mafia_disguise" && target.powerUpgrade !== "silencer_disguise" && isMafiaAligned(target);
    // 악마 숭배자가 이 대상에게 영혼 수확을 걸어뒀다면, 일반 낮 투표 처형과 마찬가지로 보안관의
    // 즉결처형으로 죽어도 영혼이 수확된다 - "숭배 의식"은 처형 수단을 가리지 않는다.
    const soulHarvested = cultistHarvestOn(state, target.id);
    if (soulHarvested) cultistStacks += 1;
    updatedPlayers = updatedPlayers.map((p) => (p.id === target.id ? { ...p, alive: false, executedByVote: true, deathCause: "execution", soulHarvested } : p));
    const actorLabel = inquisitor ? "성직자" : "보안관";
    if (wasMafia) {
      sheriffExecutionResult = { targetName: target.name, wasMafia: true, byPriest: !!inquisitor };
      log.push(`⭐ ${actorLabel}가 ${target.name}님을 처형했습니다. 그는 마피아팀이었습니다.`);
    } else if (noJail) {
      sheriffExecutionResult = { targetName: target.name, wasMafia: false, byPriest: !!inquisitor };
      log.push(`⭐ ${actorLabel}가 ${target.name}님을 처형했지만, 마피아팀이 아니었습니다.`);
    } else {
      // 무고한 사람을 죽였다 - 보안관 즉시 직위 해제 + 감옥행.
      updatedPlayers = updatedPlayers.map((p) => (sheriff && p.id === sheriff.id ? { ...p, isSheriff: false, inJail: true } : p));
      sheriffExecutionResult = { targetName: target.name, wasMafia: false };
      sheriffJustJailedName = sheriff ? sheriff.name : null;
      log.push(`🚨 보안관이 ${target.name}님을 처형했지만, 마피아팀이 아니었습니다! 보안관은 즉시 감옥에 수감됩니다.`);
    }
    if (actsAsRole(target, "terrorist") && sheriff && sheriff.alive) {
      // 보안관의 즉결처형으로 테러리스트가 처형된 경우, 함께 자폭하는 대상은 무작위가 아니라
      // 무조건 그 처형을 내린 보안관 본인이다 (일반 낮 투표 처형과 다른 부분).
      updatedPlayers = updatedPlayers.map((p) => (p.id === sheriff.id ? { ...p, alive: false, deathCause: "terroristBomb" } : p));
      terroristBombVictimName = sheriff.name;
      log.push(`💣 테러리스트의 자폭으로 보안관 ${sheriff.name}님이 함께 목숨을 잃었습니다.`);
    }
  } else {
    log.push(`⭐ ${inquisitor ? "성직자" : "보안관"}가 ${target ? target.name : "지목된 사람"}님을 처형하지 않기로 했습니다.`);
  }

  updatedPlayers = clearDeadSheriffFlag(updatedPlayers);
  const winner = cultistStacks >= 4 ? "cultist" : checkWinner(updatedPlayers);
  if (winner) {
    return { ...state, players: updatedPlayers, phase: "gameover", winner, timerSeconds: 0, timerRunning: false, log: log.slice(-60), sheriffExecutionResult, sheriffJustJailedName, terroristBombVictimName, cultistStacks, inquisitionBy: null };
  }
  // 보안관이 감옥에 가서 자리가 비어도, 재선출은 당일에 하지 않고 다음날 아침부터 다시 진행한다.
  // 그래서 보안관 유무와 무관하게 항상 그날의 토론으로 돌아간다 (nextDayActivityPhase를 쓰지 않는다).
  return {
    ...state, players: updatedPlayers, phase: "discussion", timerSeconds: 180, timerRunning: true,
    sheriffDesignatedTarget: null, sheriffDesignateResult: null, sheriffDefenseText: "", sheriffVerdict: null, inquisitionBy: null, dictatorResult: null,
    sheriffExecutionResult, sheriffJustJailedName, sheriffElectionVotes: {}, sheriffElectedName: null,
    terroristBombVictimName, cultistStacks,
    log: log.slice(-60),
  };
}

function resolveSheriffElection(state) {
  // 재투표(결선) 라운드라면 동점자들만 후보. 아니라면(첫 라운드) 고양이를 제외한 전원이 후보.
  const candidatePool = state.sheriffRunoffCandidates && state.sheriffRunoffCandidates.length > 0
    ? state.players.filter((p) => state.sheriffRunoffCandidates.includes(p.id) && p.alive)
    : alivePlayers(state.players).filter((p) => p.role !== "cat");
  const candidateIds = new Set(candidatePool.map((p) => p.id));
  const tally = {};
  candidatePool.forEach((p) => (tally[p.id] = 0));
  Object.entries(state.sheriffElectionVotes || {}).forEach(([voterId, targetId]) => {
    if (tally[targetId] !== undefined) tally[targetId] += 1;
  });
  let max = -1, leaders = [];
  Object.entries(tally).forEach(([id, c]) => {
    if (c > max) { max = c; leaders = [id]; } else if (c === max) leaders.push(id);
  });
  let log = [...state.log];
  let updatedPlayers = state.players;
  let sheriffElectedName = null;

  if (max > 0 && leaders.length === 1) {
    const winner = state.players.find((p) => p.id === leaders[0]);
    updatedPlayers = state.players.map((p) => (p.id === winner.id ? { ...p, isSheriff: true } : p));
    sheriffElectedName = winner.name;
    log.push(`⭐ ${winner.name}님이 보안관으로 선출되었습니다.`);
    return {
      ...state, players: updatedPlayers, phase: "discussion", timerSeconds: 180, timerRunning: true,
      sheriffElectionVotes: {}, sheriffRunoffCandidates: null, sheriffElectedName, log: log.slice(-60),
    };
  }

  if (max > 0 && leaders.length > 1) {
    // 동점 - 동점자들만 후보로 남겨 즉시 재투표한다 (한 명이 뽑힐 때까지 반복).
    const tiedNames = leaders.map((id) => state.players.find((p) => p.id === id)?.name).filter(Boolean).join(", ");
    log.push(`🗳️ 동점입니다 (${tiedNames}) - 동점자들만 후보로 재투표합니다.`);
    return {
      ...state, phase: "sheriffElectionVote", timerSeconds: 20, timerRunning: true,
      sheriffElectionVotes: {}, sheriffRunoffCandidates: leaders, log: log.slice(-60),
    };
  }

  log.push(`🗳️ 아무도 투표하지 않아 보안관이 선출되지 못했습니다.`);
  return {
    ...state, players: updatedPlayers, phase: "discussion", timerSeconds: 180, timerRunning: true,
    sheriffElectionVotes: {}, sheriffRunoffCandidates: null, sheriffElectedName, log: log.slice(-60),
  };
}

function resolveNomination(state, { skipOfficial = false } = {}) {
  // 감옥에 간 사람은 죽은 건 아니지만 완전히 탈락 취급이라, 낮 투표 대상(후보)에서도 제외해야 한다.
  const votables = alivePlayers(state.players).filter((p) => !p.inJail);
  const tally = {};
  votables.forEach((p) => (tally[p.id] = 0));
  Object.entries(state.votes).forEach(([voterId, targetId]) => {
    // [투표 조작] 능력으로 지정된 대상에게 가는 표는 모두 무효 처리된다.
    if (state.conartistRiggedTargetId && targetId === state.conartistRiggedTargetId &&
      state.players.some((p) => p.role === "conartist" && p.alive && !p.inJail && !isAbilityDisabled(p) && p.powerUpgrade === "conartist_rig")) return;
    const voter = state.players.find((p) => p.id === voterId);
    if (!voter) return;
    const weight = voteWeight(state, voter);
    if (tally[targetId] !== undefined) tally[targetId] += weight;
  });
  // [선동] - 정치인이 투표한 사람이 받은 표는 두 배가 된다.
  state.players.forEach((pol) => {
    if (pol.role !== "politician" || pol.powerUpgrade !== "politician_incite" || !pol.alive || pol.inJail || isAbilityDisabled(pol)) return;
    const t = state.votes?.[pol.id];
    if (t && tally[t] !== undefined && !isVoteBlocked(state, pol.id)) tally[t] *= 2;
  });
  // [부정투표] - 공무원이 득표 상위 두 명 중 최후 변론에 세울 사람을 직접 고른다.
  const riggingOfficial = skipOfficial ? null : state.players.find((p) => p.role === "official" && p.powerUpgrade === "official_rig" && p.alive && !p.inJail && !isAbilityDisabled(p) && !isChatBlocked(state, p.id));
  if (riggingOfficial) {
    const ranked = shuffle(Object.entries(tally).filter(([, c]) => c > 0)).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
    if (ranked.length === 2) {
      return { ...state, phase: "officialPick", officialPickCandidates: ranked, officialPickTally: tally, nominee: null,
        log: [...state.log, `🗂️ 개표가 진행되고 있습니다...`].slice(-60), timerSeconds: 15, timerRunning: true };
    }
  }
  let max = -1, leaders = [];
  Object.entries(tally).forEach(([id, c]) => {
    if (c > max) { max = c; leaders = [id]; } else if (c === max) leaders.push(id);
  });
  let log = [...state.log];
  if (max <= 0) {
    log.push(`🗳️ 아무도 투표하지 않아 아무도 지목되지 않았습니다.`);
    return { ...state, phase: "voteresult", lastEliminated: null, politicianSaved: false, nominee: null, log: log.slice(-60), timerSeconds: 10, timerRunning: true };
  }
  if (leaders.length > 1) {
    // 판사가 살아있고 본인이 동점자에 포함되지 않았다면, 판사가 동점자 중 한 명을 직접 지명한다.
    const judge = findJudgeActor(state.players, leaders);
    if (judge) {
      log.push(`🔨 표가 갈려 판사가 동점자 중 한 명을 지명하게 됩니다.`);
      return { ...state, phase: "judgetiebreak", tiedNominees: leaders, nominee: null, log: log.slice(-60), timerSeconds: 15, timerRunning: true };
    }
    log.push(`🗳️ 표가 갈려 아무도 지목되지 않았습니다.`);
    return { ...state, phase: "voteresult", lastEliminated: null, politicianSaved: false, nominee: null, log: log.slice(-60), timerSeconds: 10, timerRunning: true };
  }
  const nominee = state.players.find((p) => p.id === leaders[0]);
  log.push(`⚖️ ${nominee.name}님이 최다 득표로 지목되어 최후 변론을 시작합니다.`);
  return { ...state, phase: "defense", nominee: nominee.id, defenseText: "", log: log.slice(-60), timerSeconds: 20, timerRunning: true };
}

/**
 * 처형 여부가 정해진 뒤(공개 찬반투표든 판사의 단독 판결이든) 공통으로 처리하는 로직.
 * shouldExecute: 이번에 처형하기로 결정됐는지, verdictLogLine: 그 결정에 대한 로그 한 줄.
 */
function applyExecutionOutcome(state, shouldExecute, verdictLogLine, { byJudge = null } = {}) {
  const nominee = state.players.find((p) => p.id === state.nominee);
  let log = [...state.log, verdictLogLine];
  let updatedPlayers = state.players;
  let lastEliminated = null;
  let politicianSaved = false;
  let cultistStacks = state.cultistStacks || 0;
  let revealedRoles = { ...(state.revealedRoles || {}) };
  let terroristBombVictimName = null;
  let curseTargetId = state.curseTargetId || null;
  let curseDeathDay = state.curseDeathDay || null;
  let pendingCursesCleared = false;
  const politicianImmune = actsAsRole(nominee, "politician");
  let judgeRulingResult = null, judgePleaResult = null;
  // [사법거래] - 판사가 처형을 결정한 대상이 마피아팀이면 (게임당 한 번) 처형 대신 감옥으로 보내고 다른 마피아팀 한 명을 공개한다.
  const pleaJudge = byJudge && byJudge.role === "judge" && byJudge.powerUpgrade === "judge_plea" && !byJudge.judgePleaUsed ? byJudge : null;
  if (shouldExecute && pleaJudge && !politicianImmune && nominee.role !== "cat" && isMafiaAligned(nominee)) {
    const others = state.players.filter((p) => p.id !== nominee.id && p.alive && isMafiaAligned(p));
    const exposed = others.length ? others[Math.floor(Math.random() * others.length)] : null;
    updatedPlayers = state.players.map((p) => {
      if (p.id === nominee.id) return { ...p, inJail: true, isSheriff: false };
      if (p.id === pleaJudge.id) return { ...p, judgePleaUsed: true };
      return p;
    });
    if (exposed) revealedRoles[exposed.id] = effectiveRoleLabel(exposed);
    judgePleaResult = { jailedName: nominee.name, exposedName: exposed?.name || null, exposedRoleLabel: exposed ? effectiveRoleLabel(exposed) : null };
    log.push(`⚖️ 사법거래 - ${nominee.name}님은 처형 대신 감옥에 수감되었습니다.${exposed ? ` 그 대가로 ${exposed.name}님의 정체 [${judgePleaResult.exposedRoleLabel}]가 공개되었습니다.` : ""}`);
    const winnerP = checkWinner(updatedPlayers);
    return {
      ...state, players: clearDeadSheriffFlag(updatedPlayers), phase: winnerP ? "gameover" : "voteresult", winner: winnerP,
      lastEliminated: null, politicianSaved: false, cultistStacks, revealedRoles, terroristBombVictimName: null, judgePleaResult, judgeRulingResult: null,
      log: log.slice(-60), timerSeconds: winnerP ? 0 : 10, timerRunning: !winnerP,
    };
  }

  if (shouldExecute && !politicianImmune && nominee.role !== "cat") {
    const soulHarvested = cultistHarvestOn(state, nominee.id);
    if (soulHarvested) cultistStacks += 1;
    updatedPlayers = state.players.map((p) => (p.id === nominee.id ? { ...p, alive: false, soulHarvested, executedByVote: true, deathCause: "execution" } : p));
    lastEliminated = nominee.id;
    log.push(`⚖️ ${nominee.name}님이 마을에서 처형되었습니다.`);
    // [판결문] - 판사가 직접 처형을 결정한 사람의 직업은 모두에게 공개된다.
    if (byJudge && byJudge.role === "judge" && byJudge.powerUpgrade === "judge_ruling") {
      revealedRoles[nominee.id] = effectiveRoleLabel(nominee);
      judgeRulingResult = { name: nominee.name, roleLabel: revealedRoles[nominee.id] };
      log.push(`📜 판결문 - ${nominee.name}님의 직업은 [${judgeRulingResult.roleLabel}]였습니다.`);
    }

    // "명탐정 라삐" 업적 - 탐정이 스파이를 정확히 짚었던 바로 다음날, 그 스파이가 처형되면 달성.
    const detectiveWithLead = updatedPlayers.find((p) =>
      p.role === "detective" && p.detectiveSpyLead && p.detectiveSpyLead.spyId === nominee.id && p.detectiveSpyLead.day + 1 === state.dayNumber
    );
    if (detectiveWithLead) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === detectiveWithLead.id ? { ...p, detectiveCaughtSpyThenExecuted: true } : p));
    }
    // "뱀파이어 사냥꾼" 업적 - 성직자가 뱀파이어를 막아냈던 바로 다음날, 그 뱀파이어가 처형되면 달성.
    const priestWithLead = updatedPlayers.find((p) =>
      p.role === "priest" && p.priestVampireLead && p.priestVampireLead.vampireId === nominee.id && p.priestVampireLead.day + 1 === state.dayNumber
    );
    if (priestWithLead) {
      updatedPlayers = updatedPlayers.map((p) => (p.id === priestWithLead.id ? { ...p, priestCaughtVampireThenExecuted: true } : p));
    }

    // 마녀가 처형되면, 아직 발동되지 않은 저주는 그대로 풀린다.
    if (nominee.role === "witch" && (curseTargetId || (state.pendingCurses || []).some((c) => !c.by))) {
      log.push(`🔮 마녀가 처형되어 걸려있던 저주가 풀렸습니다.`);
      curseTargetId = null;
      curseDeathDay = null;
      pendingCursesCleared = true;
    }
    if ((state.pendingCurses || []).some((c) => c.by === nominee.id)) pendingCursesCleared = true;

    if (actsAsRole(nominee, "terrorist")) {
      const beforeAlive = new Set(updatedPlayers.filter((p) => p.alive).map((p) => p.id));
      const bombResult = applyTerroristBomb(updatedPlayers, nominee, log, state.terroristSelfdestructTarget);
      updatedPlayers = bombResult.players;
      terroristBombVictimName = bombResult.victimNames.join(", ") || null;
      const forcedRoleKilled = bombResult.victimNames.length > 0 && updatedPlayers.some((p) => beforeAlive.has(p.id) && !p.alive && (p.role === "police" || p.role === "doctor"));
      if (forcedRoleKilled) {
        // "혼자는 안가요" 업적 - 시민팀 필수직업을 자폭에 끌고 갔다.
        updatedPlayers = updatedPlayers.map((p) => (p.id === nominee.id ? { ...p, terroristKilledForcedRole: true } : p));
      }
    }
  } else if (shouldExecute && politicianImmune) {
    politicianSaved = true;
    revealedRoles[nominee.id] = ROLES.politician.label; // 정치인 면역이 발동하면 직업이 영구 공개된다
    log.push(`🛡️ 과반수가 찬성했지만 정치인은 처형되지 않습니다.`);
  } else if (shouldExecute && nominee.role === "cat") {
    log.push(`🐱 과반수가 찬성했지만, 고양이는 유유히 몸을 피해 처형되지 않습니다.`);
  } else {
    log.push(`🗳️ ${nominee.name}님은 처형되지 않았습니다.`);
  }
  updatedPlayers = clearDeadSheriffFlag(updatedPlayers);
  const winner = cultistStacks >= 4 ? "cultist" : checkWinner(updatedPlayers);
  return {
    ...state, players: updatedPlayers, phase: winner ? "gameover" : "voteresult", winner,
    lastEliminated, politicianSaved, cultistStacks, revealedRoles, terroristBombVictimName, judgeRulingResult, judgePleaResult,
    curseTargetId, curseDeathDay, ...(pendingCursesCleared ? { pendingCurses: (state.pendingCurses || []).filter((c) => c.by ? c.by !== nominee.id : nominee.role !== "witch") } : {}),
    log: log.slice(-60), timerSeconds: winner ? 0 : 10, timerRunning: !winner,
  };
}

function resolveFinalVote(state) {
  const nominee = state.players.find((p) => p.id === state.nominee);
  const eligible = alivePlayers(state.players).filter((p) => p.id !== state.nominee && !isVoteBlocked(state, p.id));
  let agree = 0, disagree = 0;
  eligible.forEach((p) => {
    const v = state.finalVotes[p.id];
    const weight = voteWeight(state, p);
    if (v === "agree") agree += weight; else if (v === "disagree") disagree += weight;
  });
  const majorityAgree = agree > disagree && agree > 0;
  return applyExecutionOutcome(state, majorityAgree, `🗳️ 찬성 ${agree} : 반대 ${disagree}`);
}

/**
 * 판사가 살아있을 때(그리고 본인이 지목당하지 않았을 때), 공개 찬반투표 대신 판사 혼자
 * 처형 여부를 결정한다. 판사의 정체는 이 과정에서 절대 드러나지 않는다.
 */
function resolveJudgeVerdict(state) {
  const shouldExecute = state.judgeVerdict === "agree";
  return applyExecutionOutcome(state, shouldExecute, `🔨 판사가 판결을 내렸습니다.`, { byJudge: findJudgeActor(state.players, [state.nominee]) });
}

/**
 * 치지직 채팅에서 들어온 메시지를 낮 채팅 피드로 중계한다.
 * 게임에 참여 중이고 현재 살아있는 플레이어의 메시지만, 토론/최후변론 시간에만 반영한다.
 */
export function relayDayChat(state, senderChannelId, message) {
  const allowedNow =
    state.phase === "discussion" || (state.phase === "defense" && senderChannelId === state.nominee);
  if (!allowedNow) return state;
  if (isChatBlocked(state, senderChannelId)) return state;
  if (puppeteerOf(state, senderChannelId)) return state; // 꼭두각시는 치지직 채팅으로도 말할 수 없다
  const player = state.players.find((p) => p.id === senderChannelId);
  if (!player || !player.alive) return state;
  const text = String(message || "").slice(0, 300);
  if (!text.trim()) return state;
  const dayChat = [...(state.chats.day || []), { sender: player.name, senderId: player.id, text, day: state.dayNumber, phase: state.phase }].slice(-200);
  return { ...state, chats: { ...state.chats, day: dayChat } };
}

export function autoAdvance(state) {
  switch (state.phase) {
    case "reveal":
      // 15초가 지나면 아직 확인 버튼을 안 누른 사람이 있어도 강제로 밤으로 진행한다.
      // (전원이 먼저 누르면 REVEAL_ACK 쪽에서 그전에 즉시 넘어감)
      return {
        ...state, phase: "night", timerSeconds: 60, timerRunning: true,
        log: [...state.log, `🌒 ${state.dayNumber}일차 밤이 찾아왔습니다.`].slice(-60),
      };
    case "night": return resolveNight(state);
    case "morning": {
      // 7일차 아침이라면, 원래의 다음 단계(토론/보안관 선출) 대신 능력 선택 단계로 먼저 들어간다.
      const powerCardsOffered = {};
      if (state.dayNumber === 7) {
        state.players.forEach((p) => {
          // 용병과 동료가 된 건달은 카드를 고를 수 없다.
          if (p.alive && !p.inJail && POWER_CARDS[p.role] && !p.powerUpgrade && !(p.role === "soldier" && p.pairedWithMercenary)) powerCardsOffered[p.id] = POWER_CARDS[p.role];
        });
      }
      // 카드를 받을 생존자가 한 명도 없으면 30초짜리 빈 단계를 건너뛰고 바로 낮으로 넘어간다.
      if (Object.keys(powerCardsOffered).length > 0) {
        return {
          ...state, phase: "powerSelection", timerSeconds: 30, timerRunning: true,
          powerCardsOffered, votes: {}, skipVotes: {}, chats: { ...state.chats, day: [] },
        };
      }
      const next = nextDayActivityPhase(state);
      return { ...state, phase: next.phase, timerSeconds: next.timerSeconds, timerRunning: true, votes: {}, skipVotes: {}, sheriffElectionVotes: {}, sheriffElectedName: null, sheriffExecutionResult: null, sheriffJustJailedName: null, sheriffDesignatedToday: false, catVoteRemovedId: null, chats: { ...state.chats, day: [] } };
    }
    case "powerSelection": {
      // 시간 안에 고르지 못한 사람은 제안받은 카드 중 무작위로 하나가 적용된다.
      const updatedPlayers = state.players.map((p) => {
        const offered = state.powerCardsOffered?.[p.id];
        if (p.alive && !p.inJail && offered && !p.powerUpgrade) {
          const picked = offered[Math.floor(Math.random() * offered.length)];
          return { ...p, powerUpgrade: picked.id };
        }
        return p;
      });
      const dictated = applyDictator({ ...state, players: updatedPlayers });
      const next = nextDayActivityPhase(dictated);
      return {
        ...dictated, phase: next.phase, timerSeconds: next.timerSeconds, timerRunning: true,
        sheriffElectionVotes: {}, sheriffElectedName: null, sheriffExecutionResult: null, sheriffJustJailedName: null,
        sheriffDesignatedToday: false, catVoteRemovedId: null,
      };
    }
    case "discussion": {
      // 여러 곳에서 접선 요청을 받은 용병이 낮이 끝날 때까지 고르지 않았다면, 살아있는 요청 중 하나로 자동 확정한다.
      const merc = state.players.find((p) => p.role === "mercenary" && p.alive && !p.inJail && !p.mercenaryContactedBy);
      const pending = merc ? (state.mercenaryPendingContacts || []).filter((c) => {
        const cp = state.players.find((p) => p.id === c.contactPlayerId);
        return cp && cp.alive && !cp.inJail && !(c.type === "soldier" && cp.recruitedToMafia);
      }) : [];
      let s2 = state;
      if (merc && pending.length > 0) {
        const chosen = pending[Math.floor(Math.random() * pending.length)];
        s2 = applyAction(state, { type: "CHOOSE_MERCENARY_CONTACT", contactType: chosen.type, __byPuppeteer: true, __auto: true }, merc.id);
      }
      return { ...s2, phase: "vote", timerSeconds: 15, timerRunning: true, votes: {}, skipVotes: {}, mercenaryPendingContacts: [] };
    }
    case "sheriffElection": return { ...state, phase: "sheriffElectionVote", timerSeconds: 20, timerRunning: true, skipVotes: {} };
    case "sheriffDefense": return { ...state, phase: "sheriffVerdict", timerSeconds: 15, timerRunning: true };
    case "sheriffVerdict": return resolveSheriffVerdict(state);
    case "vote": return resolveNomination(state);
    case "officialPick": {
      // 공무원이 시간 안에 고르지 못하면 [부정투표] 없이 원래 투표 결과대로 진행한다.
      return resolveNomination({ ...state, officialPickCandidates: null }, { skipOfficial: true });
    }
    case "sheriffElectionVote": return resolveSheriffElection(state);
    case "judgetiebreak": {
      // 판사가 시간 안에 고르지 못하면 동점자 중 무작위로 정해진다 (마피아 내부 동표 처리와 같은 맥락).
      const picked = state.tiedNominees[Math.floor(Math.random() * state.tiedNominees.length)];
      const t = state.players.find((p) => p.id === picked);
      return {
        ...state, phase: "defense", nominee: picked, tiedNominees: [], defenseText: "", timerSeconds: 20, timerRunning: true,
        log: [...state.log, `🎲 판사가 시간 안에 결정하지 못해 무작위로 ${t?.name}님이 지목되었습니다.`].slice(-60),
      };
    }
    case "defense": {
      // 판사가 살아있고 본인이 이번 지목자가 아니라면, 공개 찬반투표 대신 판사 혼자 결정한다.
      const judge = findJudgeActor(state.players, [state.nominee]);
      if (judge) return { ...state, phase: "judgeverdict", timerSeconds: 15, timerRunning: true, judgeVerdict: null };
      return { ...state, phase: "finalvote", timerSeconds: 10, timerRunning: true, finalVotes: {} };
    }
    case "judgeverdict": return resolveJudgeVerdict({ ...state, judgeVerdict: state.judgeVerdict || "disagree" });
    case "finalvote": return resolveFinalVote(state);
    case "voteresult": {
      if (state.winner) return { ...state, phase: "gameover", timerRunning: false };
      return {
        ...state, phase: "night",
        mafiaVotes: {}, mafiaSecondVotes: {}, spyTarget: null, framerTarget: null, blockerTarget: null, silencerTarget: null,
        policeTarget: null, policeSecondTarget: null, doctorTarget: null, soldierTarget: null, reporterTarget: null, detectiveTarget: null, mercenaryTarget: null,
        hitmanTargetId: null, hitmanGuessedRole: null, hitmanSecondTargetId: null, hitmanSecondGuessedRole: null,
        cultistTarget: null, vampireTarget: null, witchTarget: null, undertakerTarget: null,
        avengerTarget: null, avengerActorId: null, avengerKillResult: null,
        thiefTarget: null, thiefStealResult: null,
        werewolfTarget: null, werewolfVictimName: null,
        priestTarget: null, priestReviveName: null,
        catOwnerTarget: null, catDetectTarget: null, catDetectResult: null, catAppearedName: null,
        unemployedJobGrantedPlayerId: null, unemployedJobGrantedLabel: null,
        conartistTarget: null,
        bodyguardTarget: null, bodyguardSaveResult: null,
        godfatherTarget: null, godfatherRecruitResult: null, godfatherCaughtResult: null, godfatherNeutralEncounterResult: null, godfatherNeutralCaughtId: null,
        judgePardonTarget: null, judgePardonResult: null,
        teacherLessonChoice: null, teacherLessonResult: null,
        policeResult: null, policeSecondResult: null, spyResult: null, detectiveResult: null, reporterReveal: null, doctorResult: null, undertakerResult: null,
        extraNightDeaths: [], extraCurseVictimNames: [], seducedAbilityId: null, mindControlledId: null,
        conartistLegendRole: null, conartistLegendTarget: null, conartistLegendResult: null, silencerBrainwashResultId: null, silencerBrainwashOutcome: null,
        terroristActedDay: null, arsonVictimNames: [], terroristArsonPending: null, conartistLegendGuess: null,
        extraBlockedVoterId: null, extraBlockedChatterId: null, legendGodfatherCaught: null, legendNeutralCaught: null, legendRecruitTargetId: null,
        veteranSurvivedName: null, vampireFightResult: null, terroristBombVictimName: null,
        curseVictimName: null, curseCastName: null, veteranSpyAlert: {}, mafiaApprenticeReveal: {},
        blockedVoterId: null, blockedChatterId: null, blockedAbilityId: null, legendBlockedAbilityId: null,
        virusResult: null, virusLostId: null, blockerCharmResult: null, charmSealedId: null, blockerSpyResult: null,
        hostedVoterId: null, hostVoterBy: null, framerProxyResult: null,
        nightLordResult: null, possessResult: null, possessBlockedVoterId: null, mediumExorciseResult: null, officialAuditResult: null,
        bodyguardLastWord: null, nightSaveBy: null, soldierBossVoterId: null, detectiveDeduceResult: null, dictatorResult: null,
        judgeRulingResult: null, judgePleaResult: null, officialPickCandidates: null, officialPickTally: null, inquisitionBy: null,
        nominee: null, defenseText: "", votes: {}, finalVotes: {}, tiedNominees: [], judgeVerdict: null,
        // 공무원 전용 - 방금 지나간 낮의 투표 데이터가 위에서 초기화되기 전에 스냅샷으로 남겨둔다.
        lastDayVotes: state.votes, lastDayFinalVotes: state.finalVotes, lastDayJudgeDecided: state.judgeVerdict !== null,
        timerSeconds: 60, timerRunning: true,
        log: [...state.log, `🌒 ${state.dayNumber}일차 밤이 찾아왔습니다.`].slice(-60),
      };
    }
    default: return { ...state, timerRunning: false };
  }
}

/**
 * applyAction: 클라이언트에서 온 개별 플레이어 행동을 상태에 반영합니다.
 * playerId는 소켓 인증에서 검증된 값만 들어오므로, 여기서는 "그 행동을 할 자격이 있는지"만 확인합니다.
 */
export function applyAction(state, action, playerId) {
  const player = state.players.find((p) => p.id === playerId);
  // 감옥에 간 사람은 죽은 건 아니지만 완전히 탈락 취급 - 어떤 행동도 할 수 없다 (채팅·투표·능력 전부 포함).
  // 단, 교도관과의 대화(wardenChat)만은 감옥에 갇힌 사람도 할 수 있어야 하므로 예외로 둔다.
  const isWardenChatSend = action.type === "CHAT_SEND" && action.channel === "wardenChat";
  if (player?.inJail && !isWardenChatSend) return state;
  // [정신 지배] - 꼭두각시가 된 사람은 스스로 아무것도 할 수 없다. 마녀가 대신 조작한 행동(__byPuppeteer)만 통과한다.
  if (player && puppeteerOf(state, playerId) && !action.__byPuppeteer) return state;
  // [바이러스]/[현혹]으로 능력을 잃은 사람은 직업 능력과 관련된 행동을 할 수 없다 (채팅·투표는 가능).
  const ABILITY_ACTIONS = ["SET_NIGHT_TARGET", "SET_HITMAN_TARGET", "SET_HITMAN_SECOND_TARGET", "HITMAN_POISON", "SET_CONARTIST_RIG_TARGET",
    "WITCH_ANCIENT_CURSE", "SILENCER_TRAFFICKING", "SILENCER_BRAINWASH", "DOCTOR_HOSPITALIZE", "SET_MAFIA_SECOND_TARGET", "SET_POLICE_SECOND_TARGET",
    "COUNSELOR_SELECT", "PHISHING_SEND", "TEACHER_TEACH", "TERRORIST_MARK", "TERRORIST_ARSON", "SET_TERRORIST_SELFDESTRUCT_TARGET",
    "CORONER_INVESTIGATE", "CAT_REMOVE_VOTE", "SET_FRAMER_WIRETAP_TARGET", "SET_REPORTER_INFILTRATE_TARGET",
    "GODFATHER_NIGHTLORD", "WITCH_MINDCONTROL", "POSSESS_PICK", "POSSESS_USE", "DETECTIVE_DEDUCE", "PRIEST_INQUISITION", "CAST_OFFICIAL_PICK"];
  if (player && isAbilityDisabled(player) && ABILITY_ACTIONS.includes(action.type)) return state;

  switch (action.type) {
    case "SET_FRAMER_WIRETAP_TARGET": {
      // 해커 [도청] - 낮에 한 명을 골라두면, 그날 밤 그 사람이 속한 비밀 채팅방의 대화를 엿볼 수 있다.
      if (state.phase === "night" || state.phase === "gameover" || !player || !player.alive || player.role !== "framer") return state;
      if (player.powerUpgrade !== "framer_wiretap") return state;
      if (!action.targetId) return { ...state, framerWiretapTargetId: null };
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || !target.alive || target.id === playerId) return state;
      return { ...state, framerWiretapTargetId: target.id };
    }

    case "SET_REPORTER_INFILTRATE_TARGET": {
      // 기자 [잠입취재] - 낮에 한 명을 골라두면, 그날 밤 그 사람이 속한 비밀 채팅방의 대화를 엿볼 수 있다. (밤이 되면 바꿀 수 없음)
      if (state.phase === "night" || state.phase === "gameover" || !player || !player.alive || player.inJail || player.role !== "reporter") return state;
      if (player.powerUpgrade !== "reporter_infiltrate") return state;
      if (!action.targetId) return { ...state, reporterInfiltrateTargetId: null };
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || !target.alive || target.id === playerId) return state;
      return { ...state, reporterInfiltrateTargetId: target.id };
    }

    case "GODFATHER_NIGHTLORD": {
      // [밤의 지배자] - 게임당 한 번, 오늘 밤 마피아팀이 아닌 모든 플레이어의 직업 능력을 무효화한다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "godfather") return state;
      if (player.powerUpgrade !== "godfather_nightlord" || player.nightLordUsed) return state;
      const updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, nightLordUsed: true } : p));
      return { ...state, players: updatedPlayers, nightLordPendingId: playerId, log: [...state.log, `👑 밤의 지배자가 깨어났습니다.`].slice(-60) };
    }

    case "POSSESS_PICK": {
      // [빙의](영매)·[유품수거](장의사) - 게임당 한 번, 죽은 사람을 골라 그 직업의 능력을 빌려둔다.
      if (state.phase !== "night" || !player || !player.alive) return state;
      const okCard = (player.role === "medium" && player.powerUpgrade === "medium_possess") || (player.role === "undertaker" && player.powerUpgrade === "undertaker_relic");
      if (!okCard || player.possessPicked) return state;
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || target.alive || target.id === playerId) return state;
      const role = target.role === "conartist" && target.disguisedAs ? null : target.role;
      const ok = !!role && POSSESSABLE_ROLES.includes(role);
      const updatedPlayers = state.players.map((p) => (p.id === playerId
        ? { ...p, possessPicked: true, possessRole: ok ? role : null, possessFromName: target.name, possessFailed: !ok }
        : p));
      return { ...state, players: updatedPlayers };
    }

    case "POSSESS_USE": {
      // 빌려둔 능력을 오늘 밤 사용한다 (밤이 끝날 때 한 번 발동하고 사라진다). 대상은 밤이 끝나기 전까지 바꿀 수 있다.
      if (state.phase !== "night" || !player || !player.alive || !player.possessRole || player.possessUsed) return state;
      const role = player.possessRole;
      if (!action.targetId) return { ...state, possessUse: null };
      const t = state.players.find((p) => p.id === action.targetId);
      if (!t) return state;
      const needsDead = role === "undertaker" || role === "priest";
      if (needsDead ? t.alive : !t.alive) return state;
      if (role === "judge" ? !t.inJail : (t.inJail && !needsDead)) return state;
      if (t.id === playerId && role !== "doctor") return state;
      if (role === "reporter" && state.dayNumber < 2) return state;
      return { ...state, possessUse: { actorId: playerId, role, targetId: t.id } };
    }

    case "DETECTIVE_DEDUCE": {
      // [명추리] - 게임당 한 번, 낮에 전날 밤 죽은 사람을 골라 누가 죽였는지 알아낸다.
      if (state.phase !== "discussion" || !player || !player.alive || player.role !== "detective") return state;
      if (player.powerUpgrade !== "detective_deduce" || player.detectiveDeduceUsed || isChatBlocked(state, playerId)) return state;
      const t = state.players.find((p) => p.id === action.targetId);
      if (!t || t.alive || t.deathNight !== state.dayNumber - 1) return state;
      const killer = t.killedById ? state.players.find((p) => p.id === t.killedById) : null;
      const updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, detectiveDeduceUsed: true } : p));
      return { ...state, players: updatedPlayers, detectiveDeduceResult: { actorId: playerId, targetName: t.name, killerName: killer?.name || null, suicide: !!killer && killer.id === t.id } };
    }

    case "PRIEST_INQUISITION": {
      // [이단심판] - 게임당 한 번, 낮 토론 중 한 명을 처형대에 세운다 (최후 변론 뒤 성직자가 처형 여부를 결정).
      if (state.phase !== "discussion" || !player || !player.alive || player.role !== "priest") return state;
      if (player.powerUpgrade !== "priest_inquisition" || player.inquisitionUsed || isChatBlocked(state, playerId)) return state;
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || !target.alive || target.inJail || target.id === playerId || target.role === "cat") return state; // 고양이는 처형할 수 없다
      const updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, inquisitionUsed: true } : p));
      return {
        ...state, players: updatedPlayers, phase: "sheriffDefense", timerSeconds: 20, timerRunning: true, inquisitionBy: playerId,
        sheriffDesignatedTarget: target.id, sheriffDesignateResult: { targetName: target.name, byPriest: true },
        sheriffDefenseText: "", sheriffVerdict: null,
        log: [...state.log, `✝️ 성직자가 ${target.name}님을 이단으로 고발해 처형대에 세웠습니다.`].slice(-60),
      };
    }

    case "CAST_OFFICIAL_PICK": {
      if (state.phase !== "officialPick" || !player || !player.alive || player.role !== "official" || player.powerUpgrade !== "official_rig") return state;
      if (!(state.officialPickCandidates || []).includes(action.targetId)) return state;
      const nominee = state.players.find((p) => p.id === action.targetId);
      return {
        ...state, phase: "defense", nominee: nominee.id, defenseText: "", officialPickCandidates: null, timerSeconds: 20, timerRunning: true,
        log: [...state.log, `⚖️ ${nominee.name}님이 지목되어 최후 변론을 시작합니다.`].slice(-60),
      };
    }

    case "REVEAL_ACK": {
      if (!player) return state;
      const revealAckIds = state.revealAckIds.includes(playerId)
        ? state.revealAckIds
        : [...state.revealAckIds, playerId];
      if (revealAckIds.length >= state.players.length) {
        return { ...state, phase: "night", revealAckIds, timerSeconds: 60, timerRunning: true,
          log: [...state.log, `🌒 ${state.dayNumber}일차 밤이 찾아왔습니다.`].slice(-60) };
      }
      return { ...state, revealAckIds };
    }

    case "SET_HITMAN_TARGET": {
      if (state.phase !== "night" || !player || !player.alive || player.role !== "hitman") return state;
      if (player.powerUpgrade === "hitman_poison") return state; // [독살]을 고르면 기존 밤 암살 능력은 사라진다.
      if (!action.targetId || !action.guessedRole) return state;
      const targetPlayer = state.players.find((p) => p.id === action.targetId);
      if (!targetPlayer || !targetPlayer.alive || targetPlayer.id === playerId) return state;
      if (!ROLES[action.guessedRole]) return state;
      return { ...state, hitmanTargetId: action.targetId, hitmanGuessedRole: action.guessedRole };
    }

    case "SET_HITMAN_SECOND_TARGET": {
      // [다중암살] 능력을 고른 히트맨만, 첫 번째 대상과 별도로 두 번째 대상+예상 직업을 지정할 수 있다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "hitman") return state;
      if (player.powerUpgrade !== "hitman_multi") return state;
      if (!action.targetId || !action.guessedRole) return state;
      const targetPlayer = state.players.find((p) => p.id === action.targetId);
      if (!targetPlayer || !targetPlayer.alive || targetPlayer.id === playerId || targetPlayer.id === state.hitmanTargetId) return state;
      if (!ROLES[action.guessedRole]) return state;
      return { ...state, hitmanSecondTargetId: action.targetId, hitmanSecondGuessedRole: action.guessedRole };
    }

    case "HITMAN_POISON": {
      // [독살] 능력 - 기존 능력 대신, 낮에 플레이어 한 명에게 독을 먹여 다음 날 죽게 만든다.
      if (state.phase === "night" || !player || !player.alive || player.role !== "hitman") return state;
      if (player.powerUpgrade !== "hitman_poison") return state;
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || !target.alive || target.id === playerId || target.role === "cat") return state; // 고양이에게는 독이 듣지 않는다
      // 독을 먹인 시점의 dayNumber를 그대로 사용한다 - 이날 밤이 지나 다음날 아침이 될 때(그 밤의 resolveNight 시점에는
      // 아직 dayNumber가 증가하기 전이라 값이 그대로 일치한다) 죽는다. +1을 하면 하루가 더 늦게 죽어버린다.
      return { ...state, hitmanPoisonTargetId: action.targetId, hitmanPoisonDeathDay: state.dayNumber, log: [...state.log, `☠️ 히트맨이 누군가에게 독을 먹였습니다.`].slice(-60) };
    }

    case "SET_CONARTIST_RIG_TARGET": {
      // [투표 조작] 능력 - 낮에 플레이어 한 명을 지정하면, 그 사람에게 가는 낮 투표가 모두 무효 처리된다.
      if (state.phase === "night" || !player || !player.alive || player.role !== "conartist") return state;
      if (player.powerUpgrade !== "conartist_rig") return state;
      if (!action.targetId) return { ...state, conartistRiggedTargetId: null };
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || !target.alive || target.id === playerId) return state;
      return { ...state, conartistRiggedTargetId: action.targetId };
    }

    case "WITCH_MINDCONTROL": {
      // [정신 지배] - 게임당 단 한 번, 밤에 한 명을 골라 마녀가 죽을 때까지 꼭두각시로 삼는다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "witch") return state;
      if (player.powerUpgrade !== "witch_mindcontrol" || player.mindControlUsed || action.__byPuppeteer) return state;
      const target = state.players.find((p) => p.id === proxyRedirectTarget(state, action.targetId, playerId));
      if (!target || !target.alive || target.inJail || target.id === playerId || target.mindControlledBy) return state;
      const updatedPlayers = state.players.map((p) => {
        if (p.id === target.id) return { ...p, mindControlledBy: playerId };
        if (p.id === playerId) return { ...p, mindControlUsed: true };
        return p;
      });
      return { ...state, players: updatedPlayers };
    }

    case "WITCH_ANCIENT_CURSE": {
      // [고대 주술] 능력 - 게임당 단 한 번, 모든 생존자에게 개별적으로 30% 확률로 저주를 건다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "witch") return state;
      if (player.powerUpgrade !== "witch_ancient" || player.witchAncientUsed) return state;
      const cursedIds = state.players.filter((p) => p.alive && !p.inJail && p.id !== playerId && Math.random() < 0.3).map((p) => p.id);
      const updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, witchAncientUsed: true } : p));
      return {
        ...state, players: updatedPlayers, ancientCurseIds: cursedIds, ancientCurseDeathDay: state.dayNumber + 3,
        log: [...state.log, `🔮 마녀가 고대 주술을 시전했습니다.`].slice(-60),
      };
    }

    case "SILENCER_TRAFFICKING": {
      // 유괴범 [인신매매] 능력 - 게임당 단 한 번, 납치 능력 대신 플레이어 한 명을 팔아넘겨 게임에서 제외시킨다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "silencer") return state;
      if (player.powerUpgrade !== "silencer_trafficking" || player.silencerTraffickingUsed) return state;
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === proxyRedirectTarget(state, action.targetId, playerId));
      if (!target || !target.alive || target.inJail || target.id === playerId) return state;
      const updatedPlayers = state.players.map((p) => {
        if (p.id === target.id) return { ...p, inJail: true };
        if (p.id === playerId) return { ...p, silencerTraffickingUsed: true };
        return p;
      });
      const winner = checkWinner(updatedPlayers);
      const log = [...state.log, `⛓️ 유괴범이 누군가를 인신매매로 팔아넘겼습니다.`].slice(-60);
      const cleared = clearNightActionsOf(state, [target]);
      if (winner) return { ...state, ...cleared, players: updatedPlayers, phase: "gameover", winner, timerSeconds: 0, timerRunning: false, log };
      return { ...state, ...cleared, players: updatedPlayers, log };
    }

    case "SILENCER_BRAINWASH": {
      // 유괴범 [세뇌] 능력 - 게임당 단 한 번, 납치 능력 대신 플레이어 한 명을 세뇌시켜 마피아팀으로 영입한다 (중립은 불가능).
      if (state.phase !== "night" || !player || !player.alive || player.role !== "silencer") return state;
      if (player.powerUpgrade !== "silencer_brainwash" || player.silencerBrainwashUsed) return state;
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === proxyRedirectTarget(state, action.targetId, playerId));
      if (!target || !target.alive || target.inJail || target.id === playerId) return state;
      // 이미 마피아팀이면 대상이 될 수 없다. 경찰도 세뇌할 수 있다.
      if (isMafiaAligned(target)) return state;
      // 중립은 세뇌할 수 없다 - 조용히 무시하면 유괴범이 "이 사람은 중립"이라는 정보를 공짜로 얻게 되므로,
      // 기회는 소모되고 실패 사실만 유괴범 본인에게 알려준다.
      if (isNeutralSide(target)) {
        const failedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, silencerBrainwashUsed: true } : p));
        return { ...state, players: failedPlayers, silencerBrainwashOutcome: { targetName: target.name, success: false } };
      }
      const updatedPlayers = state.players.map((p) => {
        if (p.id === target.id) return { ...p, recruitedToMafia: true };
        if (p.id === playerId) return { ...p, silencerBrainwashUsed: true };
        return p;
      });
      const winner = checkWinner(updatedPlayers);
      const log = [...state.log, `🧠 유괴범이 누군가를 세뇌시켜 새로운 동료로 맞이했습니다.`].slice(-60);
      const outcome = { targetName: target.name, success: true };
      if (winner) return { ...state, players: updatedPlayers, phase: "gameover", winner, timerSeconds: 0, timerRunning: false, log, silencerBrainwashResultId: target.id, silencerBrainwashOutcome: outcome };
      return { ...state, players: updatedPlayers, log, silencerBrainwashResultId: target.id, silencerBrainwashOutcome: outcome };
    }

    case "DOCTOR_HOSPITALIZE": {
      // [강제 입원] 능력 - 게임당 단 한 번, 플레이어 한 명을 강제로 입원시켜 제외시킨다 (죽는 건 아님, 보안관 감옥과 동일 시스템).
      if (state.phase !== "night" || !player || !player.alive || player.role !== "doctor") return state;
      if (player.powerUpgrade !== "doctor_hospitalize" || player.doctorHospitalizeUsed) return state;
      if (state.nightLordPendingId) return state; // [밤의 지배자]가 깨어난 밤에는 쓸 수 없다
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === proxyRedirectTarget(state, action.targetId, playerId));
      if (!target || !target.alive || target.inJail || target.id === playerId) return state;
      const updatedPlayers = state.players.map((p) => {
        if (p.id === target.id) return { ...p, inJail: true };
        if (p.id === playerId) return { ...p, doctorHospitalizeUsed: true };
        return p;
      });
      const winner = checkWinner(updatedPlayers);
      const log = [...state.log, `🏥 의사가 누군가를 강제로 입원시켰습니다.`].slice(-60);
      const cleared = clearNightActionsOf(state, [target]);
      if (winner) return { ...state, ...cleared, players: updatedPlayers, phase: "gameover", winner, timerSeconds: 0, timerRunning: false, log };
      return { ...state, ...cleared, players: updatedPlayers, log };
    }

    case "SET_MAFIA_SECOND_TARGET": {
      // [무법자] 능력을 고른 마피아가 있을 때만, 첫 번째 습격 대상과 별도로 두 번째 습격 대상에 투표할 수 있다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "mafia") return state;
      const hasOutlaw = state.players.some((p) => p.role === "mafia" && p.alive && !p.inJail && p.powerUpgrade === "mafia_outlaw");
      if (!hasOutlaw) return state;
      if (action.targetId) {
        const target = state.players.find((p) => p.id === action.targetId);
        if (!target || !target.alive) return state;
      }
      return { ...state, mafiaSecondVotes: { ...state.mafiaSecondVotes, [playerId]: action.targetId } };
    }

    case "SET_POLICE_SECOND_TARGET": {
      // [강력 수사] 능력을 고른 경찰만, 첫 번째 조사 대상과 별도로 두 번째 조사 대상을 지정할 수 있다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "police") return state;
      if (player.powerUpgrade !== "police_double") return state;
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || !target.alive || target.id === state.policeTarget) return state;
      return { ...state, policeSecondTarget: action.targetId };
    }

    case "SET_NIGHT_TARGET": {
      if (state.phase !== "night" || !player || !player.alive) return state;
      if (action.role === "avenger") {
        // [피의 복수] - 상대 연인이 대신 죽었고, 그 카드를 고른 경우에만 쓸 수 있다.
        if (!player.isAvenger || player.avengerUsed || player.powerUpgrade !== "newlywed_revenge") return state;
      } else if (action.role === "cat") {
        // 고양이의 집사 임명은 게임당 단 한 번 - 이미 편입됐다면(catAlignment 존재) 다시 쓸 수 없다.
        if (player.role !== "cat" || player.catAlignment) return state;
      } else if (action.role === "cat_detect") {
        // 시민팀에 편입된 고양이만 쓸 수 있는, 탐정과 동일한 매일 밤 능력.
        if (player.role !== "cat" || player.catAlignment !== "citizen") return state;
      } else if (player.role === "conartist" && player.powerUpgrade === "conartist_legend" && player.disguisedAs === action.role && action.role !== "conartist") {
        // [전설의 사기꾼] 능력 - 위장한 직업의 밤 능력을 쓸 수 있다. 진짜 그 직업을 가진 사람의 선택을 덮어쓰지 않도록
        // 마피아의 습격 투표를 제외하면 사기꾼 전용 칸에 따로 저장하고, 결과도 사기꾼 본인에게만 알려준다.
        if (!CONARTIST_LEGEND_ROLES.includes(action.role) || CONARTIST_LEGEND_PASSIVE_ROLES.includes(action.role)) return state;
        if (action.role !== "mafia") {
          if (CONARTIST_LEGEND_ONCE_ROLES.includes(action.role) && player.legendOnceUsed?.[action.role]) return state;
          const t = action.targetId ? state.players.find((p) => p.id === action.targetId) : null;
          if (action.targetId) {
            if (!t) return state;
            const needsDead = action.role === "undertaker" || action.role === "priest";
            if (needsDead ? t.alive : !t.alive) return state;
            if (action.role === "judge" ? !t.inJail : (t.inJail && !needsDead)) return state;
            if (t.id === playerId && action.role !== "doctor" && action.role !== "bodyguard") return state;
            if (action.role === "hitman" && !ROLES[action.guessedRole]) return state;
          }
          return { ...state, conartistLegendRole: action.targetId ? action.role : null, conartistLegendTarget: action.targetId || null,
            conartistLegendGuess: action.role === "hitman" ? action.guessedRole || null : null };
        }
      } else if (action.role === "mafia" && player.role === "godfather" && player.powerUpgrade === "godfather_legend" &&
        !state.players.some((p) => p.id !== playerId && isMafiaAligned(p) && p.alive)) {
        // [전설의 등장] 능력 - 다른 마피아가 모두 죽으면, 대부 본인이 직접 마피아의 습격 투표에 참여할 수 있다.
      } else if (player.role !== action.role) {
        return state; // 본인 직업이 아니면 무시
      }
      if (action.role === "reporter" && (state.dayNumber < 2 ||
        (state.reporterUseCount ?? (state.reporterUsed ? 1 : 0)) >= (player.powerUpgrade === "reporter_abuse" ? 2 : 1))) return state;
      if (action.role === "medium" && player.powerUpgrade !== "medium_exorcise") return state;
      if (action.role === "official" && player.powerUpgrade !== "official_audit") return state;
      if (action.role === "veteran" && (player.powerUpgrade !== "veteran_pmc" || player.veteranPmcUsed)) return state;
      if (action.role === "detective" && player.powerUpgrade === "detective_deduce") return state;
      if (action.role === "vampire" && !(state.dayNumber >= 3 && state.dayNumber % 2 === 1)) return state;
      if (action.role === "witch" && player.role === "witch" && player.powerUpgrade === "witch_mindcontrol") return state; // 저주 능력은 사라진다
      if (action.role === "witch" && player.role === "witch" &&
        (state.witchCastCount || 0) >= (player.powerUpgrade === "witch_high" ? 3 : 1)) return state;
      if (action.role === "cultist" && action.targetId === playerId) return state; // 숭배자는 자기 자신을 제물로 지목할 수 없다
      const priestSaint = action.role === "priest" && player.powerUpgrade === "priest_saint";
      if (action.role === "priest" && !priestSaint && state.priestUsed) return state;
      if ((priestSaint || action.role === "veteran" || action.role === "official") && action.targetId === playerId) return state;
      if (action.role === "conartist" && state.conartistUsed && player.powerUpgrade !== "conartist_master") return state;
      if (action.role === "godfather" && (state.godfatherRecruitCount || 0) >= (player.powerUpgrade === "godfather_deal" ? 2 : 1)) return state;
      // 유괴범이 [인신매매]/[세뇌]를 고르면 납치 능력은 사라진다.
      if (action.role === "silencer" && (player.powerUpgrade === "silencer_trafficking" || player.powerUpgrade === "silencer_brainwash")) return state;
      if (action.role === "judge" && state.judgePardonUsed) return state;
      // 용병은 의뢰를 받기(접선) 전까지는 혼자서 아무것도 할 수 없다.
      if (action.role === "mercenary" && !player.mercenaryContactedBy) return state;
      if (action.role === "blocker" && player.role === "blocker" && player.powerUpgrade === "blocker_charm" && player.blockerCharmUsed) return state;
      if (action.role === "blocker" && action.targetId && action.targetId === state.blockerPrevTarget && player.powerUpgrade !== "blocker_charm") return state;
      if (action.role === "framer" && player.role === "framer" && action.targetId) {
        if (action.targetId === playerId && (player.powerUpgrade === "framer_virus" || player.powerUpgrade === "framer_proxy")) return state;
        if (player.powerUpgrade === "framer_virus" && (player.virusTriedIds || []).includes(action.targetId)) return state;
      }
      if (action.role === "silencer" && action.targetId && action.targetId === state.silencerPrevTarget) return state;
      if (action.role === "thief" && action.targetId && state.stolenFrom?.[action.targetId]) return state;
      // [미인계] 능력을 고른 스파이는 연속으로 같은 사람을 지목할 수 없다.
      if (action.role === "spy" && player.powerUpgrade === "spy_seduce" && action.targetId && action.targetId === state.spySeducePrevTarget) return state;
      if (action.targetId) {
        const targetPlayer = state.players.find((p) => p.id === action.targetId);
        if (!targetPlayer) return state;
        // 장의사와 성직자는 죽은 사람만, [부검] 능력을 고른 스파이도 죽은 사람까지 조사 가능,
        // 그 외 모든 능력은 살아있는 사람만 대상으로 할 수 있다.
        const targetsDead = action.role === "undertaker" || (action.role === "priest" && !priestSaint) || action.role === "medium";
        if (action.role === "medium" && targetPlayer.exorcised) return state;
        const spyAutopsy = action.role === "spy" && player.powerUpgrade === "spy_autopsy";
        if (!spyAutopsy && (targetsDead ? targetPlayer.alive : !targetPlayer.alive)) return state;
        // 판사의 사면은 감옥에 간 사람만 대상으로 할 수 있다 (감옥은 죽은 게 아니라 살아있는 상태라 위 체크만으론 부족).
        if (action.role === "judge" && !targetPlayer.inJail) return state;
      }
      if (action.role === "mafia") {
        return { ...state, mafiaVotes: { ...state.mafiaVotes, [playerId]: action.targetId } };
      }
      if (action.role === "avenger") {
        return { ...state, avengerTarget: action.targetId, avengerActorId: playerId };
      }
      return { ...state, [ROLE_TARGET_KEY[action.role]]: action.targetId };
    }

    case "CAST_VOTE": {
      if (state.phase !== "vote" || !player || !player.alive) return state;
      if (player.role === "cat") return state; // 고양이는 투표권이 없다
      // 유괴범에게 납치당한 사람은 낮 동안 어떤 활동도 할 수 없다 - 투표도 포함.
      if (isVoteBlocked(state, playerId) || playerId === state.catVoteRemovedId || isChatBlocked(state, playerId)) return state;
      return { ...state, votes: { ...state.votes, [playerId]: action.targetId } };
    }

    case "CAST_SHERIFF_ELECTION_VOTE": {
      if (state.phase !== "sheriffElectionVote" || !player || !player.alive) return state;
      if (player.role === "cat") return state; // 고양이는 어떤 투표권도 없다
      if (isChatBlocked(state, playerId)) return state; // 유괴당한 사람은 보안관 선출 투표도 할 수 없다.
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || target.role === "cat") return state; // 고양이는 보안관이 될 수 없다
      if (state.sheriffRunoffCandidates && state.sheriffRunoffCandidates.length > 0
        && !state.sheriffRunoffCandidates.includes(action.targetId)) return state; // 재투표에선 동점자만 후보
      return { ...state, sheriffElectionVotes: { ...state.sheriffElectionVotes, [playerId]: action.targetId } };
    }

    case "COUNSELOR_SELECT": {
      // 상담원이 낮 회의 시간에 그날 밤 상담할 대상을 고른다. 하루짜리 선택이라 다음날 다시 골라야 한다.
      if (state.phase !== "discussion" || !player || !player.alive || player.role !== "counselor") return state;
      if (isChatBlocked(state, playerId)) return state; // 유괴당한 사람은 낮 동안 능력도 쓸 수 없다.
      if (!action.targetId || action.targetId === playerId) return state;
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || !target.alive) return state;
      return { ...state, counselorTarget: action.targetId };
    }

    case "PHISHING_SEND": {
      // 피싱이 밤마다 스팸 문자(전체 공지)를 보낸다. 새 메시지는 이전 메시지를 그대로 대체한다.
      // 발신자는 완전히 익명이라 이름 자체를 저장하지 않는다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "idol") return state;
      const text = String(action.text || "").slice(0, 120).trim();
      if (!text) return state;
      return { ...state, idolMessage: { text } };
    }

    case "SHERIFF_DESIGNATE": {
      // 보안관이 낮 회의 시간에 한 명을 처형대에 세운다 - 즉시 회의가 강제 종료되고 최후 변론으로 넘어간다.
      // 하루에 단 한 번만 세울 수 있다 - 이미 오늘 세웠다면 다시 쓸 수 없다.
      if (state.phase !== "discussion" || !player || !player.alive || !player.isSheriff) return state;
      if (isChatBlocked(state, playerId)) return state; // 유괴당한 보안관은 처형 권한도 쓸 수 없다.
      if (state.sheriffDesignatedToday) return state;
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || !target.alive || target.role === "cat") return state; // 고양이는 처형할 수 없다
      const log = [...state.log, `⭐ 보안관이 ${target.name}님을 처형대에 세웠습니다.`].slice(-60);
      return {
        ...state, phase: "sheriffDefense", timerSeconds: 20, timerRunning: true,
        sheriffDesignatedTarget: target.id, sheriffDesignateResult: { targetName: target.name }, sheriffDesignatedToday: true,
        sheriffDefenseText: "", sheriffVerdict: null, log,
      };
    }

    case "TEACHER_TEACH": {
      // 교사가 밤마다 학생에게 시민팀 직업 하나를 골라 수업한다. 학생이 이미 졸업(직업 획득)했다면 더 쓸 수 없다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "teacher") return state;
      const student = state.players.find((p) => p.id === player.partnerId);
      if (!student || student.role !== "student" || !student.alive) return state;
      const teachable = [...TEACHABLE_FORCED_ROLES, ...TEACHABLE_SPECIAL_ROLES, ...TEACHABLE_GENERAL_ROLES];
      if (!teachable.includes(action.roleKey)) return state;
      return { ...state, teacherLessonChoice: action.roleKey };
    }

    case "SHERIFF_DEFENSE_TEXT": {
      if (state.phase !== "sheriffDefense" || !player || playerId !== state.sheriffDesignatedTarget) return state;
      return { ...state, sheriffDefenseText: String(action.text || "").slice(0, 300) };
    }

    case "CAST_SHERIFF_VERDICT": {
      if (state.phase !== "sheriffVerdict" || !player || !isVerdictActor(state, player) || !player.alive) return state;
      if (action.choice !== "execute" && action.choice !== "release") return state;
      // 판결 버튼을 누르는 즉시 결과를 처리한다 - 타이머가 끝날 때까지 기다리지 않는다.
      return resolveSheriffVerdict({ ...state, sheriffVerdict: action.choice });
    }

    case "CAST_SKIP_VOTE": {
      if ((state.phase !== "discussion" && state.phase !== "sheriffElection") || !player || !player.alive) return state;
      const nextSkipVotes = { ...state.skipVotes };
      if (nextSkipVotes[playerId]) delete nextSkipVotes[playerId];
      else nextSkipVotes[playerId] = true;
      const aliveCount = alivePlayers(state.players).length;
      const skipCount = Object.keys(nextSkipVotes).length;
      // 살아있는 플레이어의 70% 이상이 스킵에 찬성하면 토론을 즉시 강제 종료한다.
      if (aliveCount > 0 && skipCount / aliveCount >= 0.7) {
        return autoAdvance({ ...state, skipVotes: nextSkipVotes });
      }
      return { ...state, skipVotes: nextSkipVotes };
    }

    case "CAST_JUDGE_TIEBREAK": {
      if (state.phase !== "judgetiebreak" || !player || findJudgeActor(state.players, state.tiedNominees)?.id !== playerId) return state;
      if (!state.tiedNominees.includes(action.targetId)) return state;
      return { ...state, nominee: action.targetId, tiedNominees: [], phase: "defense", defenseText: "", timerSeconds: 20, timerRunning: true };
    }

    case "CAST_JUDGE_VERDICT": {
      if (state.phase !== "judgeverdict" || !player || findJudgeActor(state.players, [state.nominee])?.id !== playerId) return state;
      if (action.choice !== "agree" && action.choice !== "disagree") return state;
      return resolveJudgeVerdict({ ...state, judgeVerdict: action.choice });
    }

    case "SET_DEFENSE_TEXT": {
      if (state.phase !== "defense" || !player || player.id !== state.nominee) return state;
      return { ...state, defenseText: action.text.slice(0, 500) };
    }

    case "CAST_FINAL_VOTE": {
      if (state.phase !== "finalvote" || !player || !player.alive) return state;
      if (player.role === "cat") return state; // 고양이는 투표권이 없다
      if (playerId === state.nominee || isVoteBlocked(state, playerId) || playerId === state.catVoteRemovedId || isChatBlocked(state, playerId)) return state;
      return { ...state, finalVotes: { ...state.finalVotes, [playerId]: action.choice } };
    }

    case "CHOOSE_MERCENARY_CONTACT": {
      // 같은 밤에 여러 곳에서 동시에 접선 요청이 왔을 경우, 용병이 다음날 낮에 그중 하나를 직접 고른다.
      if (state.phase !== "discussion" || !player || !player.alive || player.role !== "mercenary") return state;
      if (isChatBlocked(state, playerId) && !action.__auto) return state; // 유괴당한 사람은 낮 동안 능력도 쓸 수 없다. (낮이 끝날 때 자동 확정은 예외)
      if (!state.mercenaryPendingContacts || state.mercenaryPendingContacts.length === 0) return state;
      const chosen = state.mercenaryPendingContacts.find((c) => c.type === action.contactType);
      if (!chosen) return state;
      const chosenContact = state.players.find((p) => p.id === chosen.contactPlayerId);
      if (!chosenContact || !chosenContact.alive || chosenContact.inJail) return state; // 이미 죽거나 수감된 상대와는 접선할 수 없다
      const updatedPlayers = state.players.map((p) => {
        if (p.id === player.id) return { ...p, mercenaryContactedBy: chosen.type, mercenaryContactPlayerId: chosen.contactPlayerId };
        if (chosen.type === "soldier" && p.id === chosen.contactPlayerId) return { ...p, pairedWithMercenary: true };
        return p;
      });
      const contactLabel = chosen.type === "mafia" ? "마피아" : chosen.type === "police" ? "경찰" : "건달";
      const contactP = state.players.find((p) => p.id === chosen.contactPlayerId);
      let knownRoles = state.knownRoles || {};
      if (contactP) { knownRoles = learnRole(learnRole(knownRoles, player.id, contactP.id, ROLES[contactP.role].label), contactP.id, player.id, ROLES.mercenary.label); }
      return {
        ...state, players: updatedPlayers, mercenaryPendingContacts: [], knownRoles,
        log: [...state.log, `🗡️ 용병이 ${contactLabel}와(과)의 의뢰를 받아들이기로 했습니다.`].slice(-60),
      };
    }

    case "CHOOSE_POWER_CARD": {
      // 7일차 낮 능력 선택 - 본인에게 제안된 카드 중 하나를 골라 게임당 단 한 번 확정한다.
      if (state.phase !== "powerSelection" || !player || !player.alive) return state;
      if (player.powerUpgrade) return state; // 이미 골랐다면 다시 바꿀 수 없다.
      const offered = state.powerCardsOffered?.[playerId];
      if (!offered) return state;
      const card = offered.find((c) => c.id === action.cardId);
      if (!card) return state;
      const updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, powerUpgrade: card.id } : p));
      // 누가 카드를 골랐는지 로그에 남기면 특수직업 여부가 드러나므로 공개 로그는 남기지 않는다.
      return { ...state, players: updatedPlayers };
    }

    case "TERRORIST_MARK": {
      // [방화] 능력 - 밤마다 한 명에게 표식을 남긴다. 표식은 여러 밤에 걸쳐 누적된다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "terrorist") return state;
      if (player.powerUpgrade !== "terrorist_arson") return state;
      if (state.terroristActedDay === state.dayNumber) return state; // 밤마다 표식 또는 방화 중 하나만
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === proxyRedirectTarget(state, action.targetId, playerId));
      if (!target || !target.alive || target.id === playerId) return state;
      const marked = new Set(player.terroristMarkedIds || []);
      if (marked.has(target.id)) return state;
      marked.add(target.id);
      const updatedPlayers = state.players.map((p) => (p.id === playerId ? { ...p, terroristMarkedIds: [...marked] } : p));
      return { ...state, players: updatedPlayers, terroristActedDay: state.dayNumber, log: [...state.log, `🔥 테러리스트가 누군가에게 표식을 남겼습니다.`].slice(-60) };
    }

    case "TERRORIST_ARSON": {
      // [방화] 능력 - 지금까지 표식을 남긴 모든 사람과 테러리스트 본인이 함께 불타 죽는다.
      // 의사의 보호·군인의 방어가 적용되어야 하므로 즉시 죽이지 않고 예약만 해두고, 밤이 끝날 때(resolveNight) 처리한다.
      if (state.phase !== "night" || !player || !player.alive || player.role !== "terrorist") return state;
      if (player.powerUpgrade !== "terrorist_arson") return state;
      if (state.terroristActedDay === state.dayNumber) return state; // 밤마다 표식 또는 방화 중 하나만
      return { ...state, terroristArsonPending: playerId, terroristActedDay: state.dayNumber };
    }

    case "SET_TERRORIST_SELFDESTRUCT_TARGET": {
      // [자폭] 능력 - 낮 동안 언제든 플레이어 한 명을 지목해둘 수 있다. 이후 자폭이 발동하면
      // 다른 조건과 무관하게 무조건 이 사람과 함께 죽는다 (단, 보안관 즉결처형으로 발동한 경우는 예외).
      if (state.phase === "night" || !player || !player.alive || player.role !== "terrorist") return state;
      if (player.powerUpgrade !== "terrorist_selfdestruct") return state;
      if (!action.targetId) return { ...state, terroristSelfdestructTarget: null };
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || !target.alive || target.id === playerId || target.role === "cat") return state; // 고양이는 폭발에 휘말리지 않는다
      return { ...state, terroristSelfdestructTarget: action.targetId };
    }

    case "CORONER_INVESTIGATE": {
      // 검시관은 매일 낮 토론 시간에 한 번, 죽은 사람 한 명을 부검해 사망 원인(단서)만 알아낼 수 있다.
      // 누구에게 죽었는지는 알 수 없다 - deathCause를 통해 "어떤 방식으로" 죽었는지만 노출한다.
      if (state.phase !== "discussion" || !player || !player.alive || player.role !== "coroner") return state;
      if (isChatBlocked(state, playerId)) return state; // 유괴당한 사람은 낮 동안 능력도 쓸 수 없다.
      if (state.coronerUsedDay === state.dayNumber) return state; // 오늘은 이미 사용함
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === action.targetId);
      if (!target || target.alive) return state; // 죽은 사람만 부검 대상이 될 수 있다
      const flavor = (target.deathCause && DEATH_CAUSE_FLAVOR[target.deathCause]) || "사망 원인을 알아낼 수 없다.";
      return { ...state, coronerUsedDay: state.dayNumber, coronerResult: { targetName: target.name, flavor } };
    }

    case "CAT_REMOVE_VOTE": {
      // 마피아팀에 편입된 고양이만, 낮 토론 시간에 한 명의 투표권을 없앨 수 있다.
      if (state.phase !== "discussion" || !player || !player.alive) return state;
      if (player.role !== "cat" || player.catAlignment !== "mafia") return state;
      if (isChatBlocked(state, playerId)) return state; // 유괴당한 사람은 낮 동안 능력도 쓸 수 없다.
      if (!action.targetId) return state;
      const target = state.players.find((p) => p.id === action.targetId);
      // 투표권이 없는 고양이 자신이나 같은 마피아팀 동료는 대상이 될 수 없다.
      if (!target || !target.alive || target.id === playerId || isMafiaAligned(target)) return state;
      return { ...state, catVoteRemovedId: action.targetId };
    }

    case "CHAT_SEND": {
      if (!player) return state;
      const channel = action.channel;
      const catCanUseLoverChannel = player.role === "cat" && player.catAlignment === "citizen" && player.catOwnerId;
      // 고양이가 집사로 삼은 사람이 연인/신혼부부가 아닌 "일반 시민"이라면, 그 집사 본인도 이 채널을 쓸 수 있어야 한다.
      // (집사가 연인/신혼부부라면 본인의 기존 lover/newlywed 조건으로 이미 허용되므로 여기서는 그 경우만 따로 챙긴다.)
      const catOfMine = !player.partnerId
        ? state.players.find((p) => p.role === "cat" && p.catAlignment === "citizen" && p.catOwnerId === playerId)
        : null;
      const allowed =
        (channel === "mafia" && player.alive && isMafiaAligned(player)) ||
        (channel === "lover" && player.alive && (
          ((player.role === "lover" || player.role === "newlywed") && player.partnerId && !player.isThrall &&
            state.players.find((p) => p.id === player.partnerId)?.alive) ||
          catCanUseLoverChannel ||
          !!catOfMine
        )) ||
        (channel === "lover" && soulwedChatOpen(state, player)) ||
        (channel === "vampire" && player.alive && (player.role === "vampire" || player.isThrall)) ||
        (channel === "teacherStudent" && player.alive && !!player.partnerId &&
          state.players.find((p) => p.id === player.partnerId)?.alive &&
          (player.role === "teacher" || state.players.find((p) => p.id === player.partnerId)?.role === "teacher")) ||
        (channel === "counselor" && player.alive && state.phase === "night" && !!state.counselorTarget &&
          (player.role === "counselor" || state.counselorTarget === playerId)) ||
        (channel === "mercenaryContact" && player.alive && (() => {
          const merc = state.players.find((p) => p.role === "mercenary");
          // 마피아에게 접선된 경우는 기존 마피아 채팅을 쓰므로 여기서는 경찰/건달 접선만 다룬다.
          if (!merc || !merc.mercenaryContactedBy || merc.mercenaryContactedBy === "mafia") return false;
          return playerId === merc.id || playerId === merc.mercenaryContactPlayerId;
        })()) ||
        (channel === "wardenChat" && player.alive && state.phase === "night" && (() => {
          // 감옥에 여러 명이 있으면 전원이 교도관과 같은 면회실(채팅방 하나)에 들어간다.
          const warden = state.players.find((p) => p.role === "warden" && p.alive && !p.inJail && !isAbilityDisabled(p));
          if (!warden || !state.players.some((p) => p.inJail && p.alive)) return false;
          return playerId === warden.id || player.inJail;
        })()) ||
        (channel === "medium" && ((player.alive && actsAsRole(player, "medium")) || (!player.alive && !player.soulHarvested && !player.exorcised))) ||
        (channel === "day" && player.alive && !isChatBlocked(state, playerId) &&
          (state.phase === "discussion" || state.phase === "sheriffElection" ||
            (state.phase === "defense" && playerId === state.nominee) ||
            (state.phase === "sheriffDefense" && (playerId === state.sheriffDesignatedTarget || isVerdictActor(state, player)))));
      // [정신 지배] 능력을 쓴 마녀에게 지배당한 대상은 그 밤 동안 어떤 채팅도 칠 수 없다.
      if (mindControlledChatId(state) === playerId) return state;
      if (!allowed) return state;
      let text = String(action.text || "").slice(0, 300);
      if (!text.trim()) return state;
      // 고양이는 사람의 말을 할 줄 몰라, 어떤 채팅을 치든 음절 수만큼 "냥"으로 변환되어 나간다.
      if (player.role === "cat") {
        const meowCount = text.replace(/\s/g, "").length;
        text = "냥".repeat(Math.max(1, meowCount));
      }
      if (channel === "lover") {
        // 연인/신혼부부 채팅은 쌍(pair)별로 격리된다 - 다른 커플에게 새지 않도록.
        // 고양이가 집사로 삼은 사람이 이미 연인/신혼부부라면, 그 기존 채팅방에 그대로 합류한다.
        let key;
        if (catCanUseLoverChannel) {
          const owner = state.players.find((p) => p.id === player.catOwnerId);
          key = (owner && (owner.role === "lover" || owner.role === "newlywed") && owner.partnerId)
            ? [owner.id, owner.partnerId].sort().join("|")
            : [player.id, player.catOwnerId].sort().join("|");
        } else if (catOfMine) {
          // 집사 본인(일반 시민) 시점 - 고양이와 자신 사이의 전용 채팅방 키
          key = [catOfMine.id, player.id].sort().join("|");
        } else {
          key = [player.id, player.partnerId].sort().join("|");
        }
        const nextPair = [...(state.chats.lover[key] || []), { sender: player.name, senderId: player.id, text, day: state.dayNumber, phase: state.phase }].slice(-200);
        return { ...state, chats: { ...state.chats, lover: { ...state.chats.lover, [key]: nextPair } } };
      }
      if (channel === "teacherStudent") {
        // 교사-학생 채팅도 쌍별로 격리된다. partnerId는 졸업 후에도 유지되므로 계속 같은 방을 쓴다.
        const key = [player.id, player.partnerId].sort().join("|");
        const nextPair = [...(state.chats.teacherStudent[key] || []), { sender: player.name, senderId: player.id, text, day: state.dayNumber, phase: state.phase }].slice(-200);
        return { ...state, chats: { ...state.chats, teacherStudent: { ...state.chats.teacherStudent, [key]: nextPair } } };
      }
      if (channel === "counselor") {
        // 상담원 채팅은 그날 밤 정해진 상대와만 격리된 방을 쓴다 - 매일 상대가 바뀔 수 있다.
        // 상담원 본인이 보낸 메시지는 실명 대신 '상담원'으로 고정 표시하고, senderId 자체도 저장하지 않는다
        // (senderId가 있으면 클라이언트가 프사·직업색상 등으로 신원을 역추적할 수 있기 때문).
        const counselorPlayer = state.players.find((p) => p.role === "counselor");
        const key = [counselorPlayer.id, state.counselorTarget].sort().join("|");
        const isCounselor = player.role === "counselor";
        const displayName = isCounselor ? "상담원" : player.name;
        const nextPair = [...(state.chats.counselor[key] || []), { sender: displayName, senderId: isCounselor ? null : player.id, text, day: state.dayNumber, phase: state.phase }].slice(-200);
        return { ...state, chats: { ...state.chats, counselor: { ...state.chats.counselor, [key]: nextPair } } };
      }
      if (channel === "mercenaryContact") {
        const merc = state.players.find((p) => p.role === "mercenary");
        const key = [merc.id, merc.mercenaryContactPlayerId].sort().join("|");
        const nextPair = [...(state.chats.mercenaryContact[key] || []), { sender: player.name, senderId: player.id, text, day: state.dayNumber, phase: state.phase }].slice(-200);
        return { ...state, chats: { ...state.chats, mercenaryContact: { ...state.chats.mercenaryContact, [key]: nextPair } } };
      }
      if (channel === "wardenChat") {
        const key = "jail";
        const nextPair = [...(state.chats.wardenChat[key] || []), { sender: player.name, senderId: player.id, text, day: state.dayNumber, phase: state.phase }].slice(-200);
        return { ...state, chats: { ...state.chats, wardenChat: { ...state.chats.wardenChat, [key]: nextPair } } };
      }
      const nextChannel = [...state.chats[channel], { sender: player.name, senderId: player.id, text, day: state.dayNumber, phase: state.phase }].slice(-200);
      return {
        ...state,
        chats: { ...state.chats, [channel]: nextChannel },
      };
    }

    default:
      return state;
  }
}
