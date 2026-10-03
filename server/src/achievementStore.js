import fs from "fs";
import path from "path";

/**
 * 업적/칭호 영구 저장소. honorStore.js와 동일한 파일시스템 저장 방식을 쓴다.
 * Render 등에서 재배포해도 유지되게 하려면 ACHIEVEMENT_DATA_PATH를 Persistent Disk
 * 마운트 경로 아래로 지정해야 한다(HONOR_DATA_PATH와 동일한 원리).
 */
const DATA_PATH = process.env.ACHIEVEMENT_DATA_PATH || path.join(process.cwd(), "data", "achievements.json");

/** 업적 카탈로그 - 여기 새 업적을 추가하면 관리자 페이지에서 바로 수여할 수 있게 된다. */
export const ACHIEVEMENTS = {
  honorable_citizen: {
    id: "honorable_citizen",
    name: "명예시민",
    title: "🌾 명예시민",
    desc: "직업이 없는 무직 시민 상태로 게임에서 승리",
  },
  master_physician: {
    id: "master_physician",
    name: "명의",
    title: "💉 명의",
    desc: "의사 상태로 한 게임에서 다섯 번 사람을 살림",
  },
  elite_detective: {
    id: "elite_detective",
    name: "엘리트 수사관",
    title: "🔍 엘리트 수사관",
    desc: "경찰 상태로 조사만으로 그 게임의 마피아팀을 전부 찾아냄 (조사로 밝힐 수 없는 마피아팀 특수직업 제외)",
  },
  righteous_journalist: {
    id: "righteous_journalist",
    name: "정론직필",
    title: "📰 정론직필",
    desc: "기자 상태로 특종 능력으로 마피아를 밝혀냄",
  },
  tanker: {
    id: "tanker",
    name: "탱커",
    title: "🛡️ 탱커",
    desc: "군인 상태로 마피아의 습격을 막아낸 뒤, 다시 마피아에게 습격당해 목숨을 잃음",
  },
  this_is_my_turf: {
    id: "this_is_my_turf",
    name: "여긴 내 구역이야",
    title: "🗡️ 여긴 내 구역이야",
    desc: "건달 상태로 용병과 접선해 중립으로 승리",
  },
  for_you: {
    id: "for_you",
    name: "너를 위해서",
    title: "💍 너를 위해서",
    desc: "연인 상태로 [피의 복수]를 발동해 마피아를 처치",
  },
  great_detective_rabbi: {
    id: "great_detective_rabbi",
    name: "명탐정 라삐",
    title: "🕵️ 명탐정 라삐",
    desc: "탐정 상태로 스파이의 정체를 알아낸 뒤, 다음날 낮 투표로 그 스파이를 처형시킴",
  },
  vampire_hunter: {
    id: "vampire_hunter",
    name: "뱀파이어 사냥꾼",
    title: "🥀 뱀파이어 사냥꾼",
    desc: "성직자 상태로 뱀파이어의 정체를 알아낸 뒤, 다음날 낮 투표로 그 뱀파이어를 처형시킴",
  },
  ill_leave_my_back_to_you: {
    id: "ill_leave_my_back_to_you",
    name: "뒤를 부탁한다",
    title: "🕴️ 뒤를 부탁한다",
    desc: "경호원 상태로 의사를 지키다 대신 목숨을 잃음",
  },
  best_teacher: {
    id: "best_teacher",
    name: "최고의 스승",
    title: "🍎 최고의 스승",
    desc: "교사 상태로 학생을 졸업시키고, 교사·학생 둘 다 끝까지 살아남아 시민팀 승리",
  },
  best_student: {
    id: "best_student",
    name: "최고의 제자",
    title: "🎓 최고의 제자",
    desc: "학생 상태로 졸업에 성공하고, 교사·학생 둘 다 끝까지 살아남아 시민팀 승리",
  },
  tried_to_destroy_the_world: {
    id: "tried_to_destroy_the_world",
    name: "세계를 멸망시켜봤습니다",
    title: "😈 세계를 멸망시켜봤습니다",
    desc: "악마 숭배자 상태로 중립 승리",
  },
  vampire_lord: {
    id: "vampire_lord",
    name: "뱀파이어 로드",
    title: "🧛 뱀파이어 로드",
    desc: "뱀파이어 상태로 끝까지 살아남아 중립 승리",
  },
  well_fed_im_off: {
    id: "well_fed_im_off",
    name: "잘 먹고 갑니다",
    title: "💎 잘 먹고 갑니다",
    desc: "괴도 상태로 중립 승리",
  },
  alpha: {
    id: "alpha",
    name: "ALPHA",
    title: "🐺 ALPHA",
    desc: "늑대인간 상태로, 마피아와 동맹하지 않고 단독으로 중립 승리",
  },
  im_a_detective_nya: {
    id: "im_a_detective_nya",
    name: "탐정이다냥",
    title: "🐱 탐정이다냥",
    desc: "고양이 상태로 시민팀에 편입되어 끝까지 살아남아 시민팀 승리",
  },
  nyanya_punch: {
    id: "nyanya_punch",
    name: "냥냥펀치",
    title: "🐾 냥냥펀치",
    desc: "고양이 상태로 마피아팀에 편입되어 끝까지 살아남아 마피아팀 승리",
  },
  stray_cat: {
    id: "stray_cat",
    name: "길냥이",
    title: "🐈 길냥이",
    desc: "고양이 상태로 집사를 선택하지 않았는데도 시민팀이 승리",
  },
  final_boss: {
    id: "final_boss",
    name: "최종보스",
    title: "👑 최종보스",
    desc: "대부 상태로 건달을 영입한 뒤, 건달과 함께 끝까지 살아남아 마피아팀 승리",
  },
  wont_go_alone: {
    id: "wont_go_alone",
    name: "혼자는 안가요",
    title: "💣 혼자는 안가요",
    desc: "테러리스트 상태로 투표로 처형되며, 시민팀 필수직업 중 한 명과 함께 자폭",
  },
  genius_hacker: {
    id: "genius_hacker",
    name: "천재 해커",
    title: "💻 천재 해커",
    desc: "해커 상태로 조작한 대상이 다음날 낮 기자의 특종으로 마피아로 공개됨",
  },
  good_citizen: {
    id: "good_citizen",
    name: "선량한 시민",
    title: "🌱 선량한 시민",
    desc: "시민팀 소속으로 끝까지 살아남아 시민팀 승리",
  },
  honorable_mafia: {
    id: "honorable_mafia",
    name: "명예 마피아",
    title: "🔫 명예 마피아",
    desc: "마피아팀 소속으로 끝까지 살아남아 마피아팀 승리",
  },
  why_did_i_win: {
    id: "why_did_i_win",
    name: "왜 이겼지?",
    title: "🛋️ 왜 이겼지?",
    desc: "백수 상태로 끝내 직업을 갖지 못한 채 끝까지 살아남아 시민팀 승리",
  },  corrupt_cop: {
    id: "corrupt_cop",
    name: "부패경찰",
    title: "🚔 부패경찰",
    desc: "경찰 상태로 마피아팀에게 편입되어 끝까지 살아남아 승리",
  },
  virus: {
    id: "virus",
    name: "바이러스",
    title: "🦠 바이러스",
    desc: "해커 상태로 [바이러스] 능력을 통해 플레이어 3명의 직업 능력을 영구적으로 잃게 함",
  },
  assassination: {
    id: "assassination",
    name: "암살",
    title: "🎯 암살",
    desc: "스파이 상태로 [암살] 능력을 통해 플레이어 3명을 암살",
  },
  femme_fatale: {
    id: "femme_fatale",
    name: "미녀",
    title: "💄 미녀",
    desc: "마담 상태로 [현혹] 능력을 통해 플레이어를 현혹한 뒤 끝까지 살아남아 승리",
  },
  youve_been_kidnapped: {
    id: "youve_been_kidnapped",
    name: "너 납치된거야",
    title: "⛓️ 너 납치된거야",
    desc: "유괴범 상태로 [인신매매] 능력을 통해 플레이어를 게임에서 제외시키고 끝까지 살아남아 승리",
  },
  explosion_is_art: {
    id: "explosion_is_art",
    name: "폭발은 예술이다",
    title: "💥 폭발은 예술이다",
    desc: "테러리스트 상태로 [거대 폭탄] 능력을 통해 시민팀 필수·특수직업 플레이어 두 명과 함께 자폭",
  },
  burn_burn: {
    id: "burn_burn",
    name: "활활",
    title: "🔥 활활",
    desc: "테러리스트 상태로 [방화] 능력을 통해 플레이어 3명 이상을 한 번에 죽임",
  },
  ancient_sorcerer: {
    id: "ancient_sorcerer",
    name: "고대 주술사",
    title: "🔮 고대 주술사",
    desc: "마녀 상태로 [고대 주술] 능력을 통해 플레이어 3명 이상에게 한 번에 저주를 건 뒤 저주로 살해",
  },
  puppet: {
    id: "puppet",
    name: "꼭두각시",
    title: "🎎 꼭두각시",
    desc: "마녀 상태로 [정신 지배] 능력으로 플레이어를 지배하고, 지배당한 플레이어와 함께 끝까지 살아남아 승리",
  },
  fake_news: {
    id: "fake_news",
    name: "가짜뉴스",
    title: "📰 가짜뉴스",
    desc: "사기꾼 상태로 [전설의 사기꾼] 능력으로 기자로 변장한 뒤 특종으로 시민팀을 마피아로 공개",
  },
  legend: {
    id: "legend",
    name: "LEGEND",
    title: "👑 LEGEND",
    desc: "대부 상태로 [전설의 등장] 능력을 선택한 뒤 끝까지 살아남아 승리",
  },
  poisoned: {
    id: "poisoned",
    name: "중독",
    title: "☠️ 중독",
    desc: "히트맨 상태로 [독살] 능력으로 플레이어 3명을 죽인 뒤 끝까지 살아남아 승리",
  },
  fbi: {
    id: "fbi",
    name: "FBI",
    title: "🔫 FBI",
    desc: "경찰 상태로 [사살 작전] 능력으로 '마피아'를 사살하고 끝까지 살아남아 승리",
  },
  best_partner: {
    id: "best_partner",
    name: "최고의 파트너",
    title: "👻 최고의 파트너",
    desc: "영매 상태로 [빙의] 능력으로 '성직자'의 능력을 빌려 플레이어 한 명을 부활시킨 뒤 끝까지 살아남아 승리",
  },
  bring_it_on: {
    id: "bring_it_on",
    name: "팍쒸, 드루와",
    title: "👊 팍쒸, 드루와",
    desc: "건달 상태로 [불굴의 집념] 능력으로 공격을 한 번 버티고 끝까지 살아남아 승리",
  },
  dictator: {
    id: "dictator",
    name: "독재자",
    title: "🎩 독재자",
    desc: "정치인 상태로 [독재] 능력으로 마피아팀 플레이어 3명을 처형하고 끝까지 살아남아 승리",
  },
  my_name_is_rabbi: {
    id: "my_name_is_rabbi",
    name: "내 이름은 라삐, 탐정이죠",
    title: "🔎 내 이름은 라삐, 탐정이죠",
    desc: "탐정 상태로 [명추리] 능력으로 마피아팀 플레이어를 밝혀낸 뒤 끝까지 살아남아 승리",
  },
  immortal: {
    id: "immortal",
    name: "불사신",
    title: "🪖 불사신",
    desc: "군인 상태로 [불굴의 의지] 능력으로 죽음을 두 번 극복하고, 한 번 죽었다가 성직자에 의해 부활해 끝까지 살아남아 승리",
  },
  just_borrowing: {
    id: "just_borrowing",
    name: "한번만 빌리겠습니다.",
    title: "⚰️ 한번만 빌리겠습니다.",
    desc: "장의사 상태로 [유품수거] 능력으로 '의사'의 능력을 빌려 플레이어 한 명을 보호한 뒤 끝까지 살아남아 승리",
  },
  betrayal: {
    id: "betrayal",
    name: "배신",
    title: "⚖️ 배신",
    desc: "판사 상태로 [사법거래] 능력으로 마피아팀 한 명을 밝혀낸 뒤 끝까지 살아남아 승리",
  },
  first_class_official: {
    id: "first_class_official",
    name: "1급 공무원",
    title: "🗂️ 1급 공무원",
    desc: "공무원 상태로 [행정조사]로 마피아팀임을 밝힌 플레이어를 다음 날 낮 보안관 처형 또는 투표로 처형시킨 뒤 끝까지 살아남아 승리",
  },
  saint: {
    id: "saint",
    name: "성녀",
    title: "😇 성녀",
    desc: "성직자 상태로 [성녀] 능력으로 플레이어를 한 명 이상 보호하는 데 성공하고 끝까지 살아남아 승리",
  },
  inquisitor: {
    id: "inquisitor",
    name: "이단심판관",
    title: "🔥 이단심판관",
    desc: "성직자 상태로 [이단심판] 능력으로 마피아팀을 처형하고 끝까지 살아남아 승리",
  },
  dying_message: {
    id: "dying_message",
    name: "다잉메세지",
    title: "📜 다잉메세지",
    desc: "경호원 상태로 [결정적 유언]으로 마피아팀을 공개하고, 그날 보안관 처형 또는 투표로 처형시킴",
  },

  /* ── 중간 난이도 ─────────────────────────────────────────
     능력이 눈에 띄지 않아 업적이 하나도 없던 직업, 그리고 업적이 하나뿐이던 직업들의 몫.
     기존 업적 대부분이 "7일차 능력을 썼는가"에 몰려 있어서,
     여기 있는 것들은 일부러 기본 능력과 판 전개 쪽에서 조건을 뽑았다.
     한 판을 성실히 굴리면 닿는 수준이고, 연출도 전설급보다 한 단계 담백하다. ── */
  in_the_name_of_the_dead: {
    id: "in_the_name_of_the_dead",
    name: "고인의 명의로",
    title: "🎭 고인의 명의로",
    desc: "사기꾼 상태로 위장한 상대가 먼저 죽고 난 뒤에도, 끝까지 그 행세로 살아남아 마피아팀 승리",
  },
  i_memorize_the_list: {
    id: "i_memorize_the_list",
    name: "명단은 외우고 다닙니다",
    title: "🔪 명단은 외우고 다닙니다",
    desc: "히트맨 상태로 두 번 이상 암살을 시도해 직업 추측을 단 한 번도 틀리지 않고 마피아팀 승리",
  },
  both_of_you_rest: {
    id: "both_of_you_rest",
    name: "두 분 다 오늘은 쉬세요",
    title: "💄 두 분 다 오늘은 쉬세요",
    desc: "마담 상태로 한 판에 경찰과 의사를 모두 한 번 이상 유혹해 능력을 막고 마피아팀 승리",
  },
  must_have_reasons: {
    id: "must_have_reasons",
    name: "말 못 할 사정이 있겠죠",
    title: "⛓️ 말 못 할 사정이 있겠죠",
    desc: "유괴범 상태로 입을 막아둔 사람이 그날 낮에 변명도 못 하고 처형된 적이 두 번 이상, 마피아팀 승리",
  },
  it_was_a_misprint: {
    id: "it_was_a_misprint",
    name: "오보였습니다",
    title: "📰 오보였습니다",
    desc: "기자 상태로 특종을 터뜨렸는데 공개된 사람이 마피아팀이 아니었고, 그 뒤 본인이 투표로 처형당했는데도 시민팀 승리",
  },
  for_your_share_too: {
    id: "for_your_share_too",
    name: "당신 몫까지",
    title: "💍 당신 몫까지",
    desc: "연인 상태로 상대가 자신을 대신해 목숨을 잃고, 그 뒤 끝까지 살아남아 시민팀 승리",
  },
  late_bloomer: {
    id: "late_bloomer",
    name: "늦깎이 신입",
    title: "🛋️ 늦깎이 신입",
    desc: "백수로 시작해 직업을 물려받고, 그 직업으로 끝까지 살아남아 시민팀 승리",
  },
  early_graduation: {
    id: "early_graduation",
    name: "조기 졸업",
    title: "🍎 조기 졸업",
    desc: "교사 상태로 단 한 번도 다른 직업으로 갈아타지 않고 한 우물만 파서 학생을 졸업시키고 시민팀 승리",
  },
  i_can_do_it_alone_now: {
    id: "i_can_do_it_alone_now",
    name: "이제 혼자 할 수 있어요",
    title: "🎓 이제 혼자 할 수 있어요",
    desc: "학생 상태로 졸업한 뒤 교사가 먼저 세상을 떠났는데도, 혼자 끝까지 살아남아 시민팀 승리",
  },
  all_allegations_are_baseless: {
    id: "all_allegations_are_baseless",
    name: "의혹은 모두 사실무근입니다",
    title: "🎩 의혹은 모두 사실무근입니다",
    desc: "정치인 상태로 최다 득표로 지목되고도 처형 면책으로 살아난 적이 두 번 이상, 끝까지 살아남아 시민팀 승리",
  },
  all_fine_people: {
    id: "all_fine_people",
    name: "다들 좋은 분이셨습니다",
    title: "⚰️ 다들 좋은 분이셨습니다",
    desc: "장의사 상태로 네 명 이상을 조사했는데 그중 마피아팀이 단 한 명도 없었고, 그래도 시민팀 승리",
  },
  i_find_you_not_guilty: {
    id: "i_find_you_not_guilty",
    name: "무죄를 선고합니다",
    title: "⚖️ 무죄를 선고합니다",
    desc: "판사 상태로 두 번 이상 처형을 기각했고, 살려준 사람이 전부 마피아팀이 아니었던 채 시민팀 승리",
  },
  never_absent: {
    id: "never_absent",
    name: "무단결근은 없습니다",
    title: "🗂️ 무단결근은 없습니다",
    desc: "공무원 상태로 살아 있던 낮 투표에 세 번 이상 빠짐없이 참여하고, 끝까지 살아남아 시민팀 승리",
  },
  hands_in_sync: {
    id: "hands_in_sync",
    name: "손발이 척척",
    title: "🔫 손발이 척척",
    desc: "마피아 상태로, 마피아팀의 밤 지목이 만장일치였던 밤이 세 번 이상 나온 채 마피아팀 승리",
  },
  everyone_drops_by: {
    id: "everyone_drops_by",
    name: "다들 한 번씩은 오시네요",
    title: "💬 다들 한 번씩은 오시네요",
    desc: "상담원 상태로 서로 다른 사람 네 명 이상과 상담하고, 끝까지 살아남아 시민팀 승리",
  },
  no_unsubscribe: {
    id: "no_unsubscribe",
    name: "수신거부는 안 받습니다",
    title: "📧 수신거부는 안 받습니다",
    desc: "피싱 상태로 네 번 이상 문자를 돌리고, 끝까지 살아남아 시민팀 승리",
  },
  all_different_causes: {
    id: "all_different_causes",
    name: "다 다르게 죽으셨네요",
    title: "🔬 다 다르게 죽으셨네요",
    desc: "검시관 상태로 서로 다른 사인 세 가지 이상을 부검으로 밝혀내고 시민팀 승리",
  },
  visiting_hours: {
    id: "visiting_hours",
    name: "면회 시간입니다",
    title: "🔑 면회 시간입니다",
    desc: "교도관 상태로 감옥에 갇힌 사람과 면회에서 대화를 주고받고, 끝까지 살아남아 시민팀 승리",
  },
  my_gut_never_misses: {
    id: "my_gut_never_misses",
    name: "제 촉은 틀린 적이 없어요",
    title: "🌱 제 촉은 틀린 적이 없어요",
    desc: "시민 상태로 낮 투표를 세 번 이상 하면서 단 한 번도 무고한 사람을 찍지 않고, 끝까지 살아남아 시민팀 승리",
  },
  a_deal_is_a_deal: {
    id: "a_deal_is_a_deal",
    name: "계약은 계약이니까",
    title: "🗡️ 계약은 계약이니까",
    desc: "용병 상태로 의뢰를 받은 뒤 세 명 이상을 처치하고, 의뢰한 쪽과 함께 승리",
  },

  /* ── 전설급 ──────────────────────────────────────────────
     한 판을 거의 완벽하게 풀어냈을 때만 나오는 업적들.
     칭호 연출도 가장 공들여 만들어져 있다. ────────────────── */
  no_id_for_you: {
    id: "no_id_for_you",
    name: "신분증은 못 보여드립니다",
    title: "🪪 신분증은 못 보여드립니다",
    desc: "경찰 상태로 최후 변론대에 두 번 이상 서고도 두 번 다 살아 돌아와, 끝까지 살아남아 시민팀 승리",
  },
  heart_never_stops: {
    id: "heart_never_stops",
    name: "심장이 멈추지 않는 한",
    title: "🫀 심장이 멈추지 않는 한",
    desc: "의사 상태로 같은 사람을 세 번 이상 공격에서 살려냄",
  },
  frame_is_part_of_the_job: {
    id: "frame_is_part_of_the_job",
    name: "누명도 업무의 일부",
    title: "⚜️ 누명도 업무의 일부",
    desc: "경호원 상태로 마을 투표에 몰려 처형당했지만, 마지막으로 경호하던 사람이 끝까지 살아남아 시민팀 승리",
  },
  council_of_the_dead: {
    id: "council_of_the_dead",
    name: "죽은 자들의 의회",
    title: "⚱️ 죽은 자들의 의회",
    desc: "영매 상태로 죽은 사람 다섯 명 이상의 정체를 알아냄",
  },
  i_am_the_law: {
    id: "i_am_the_law",
    name: "법은 나야",
    title: "🎖️ 법은 나야",
    desc: "보안관으로서 두 번 이상 처형하고 단 한 번도 틀리지 않은 채 승리",
  },
  prayer_cannot_be_blocked: {
    id: "prayer_cannot_be_blocked",
    name: "기도는 막히지 않습니다",
    title: "🕯️ 기도는 막히지 않습니다",
    desc: "성직자 상태로 능력을 봉인당하거나 영구히 잃은 적이 있는데도, 끝까지 살아남아 시민팀 승리",
  },
  perfect_crime: {
    id: "perfect_crime",
    name: "완전범죄",
    title: "🃏 완전범죄",
    desc: "마피아팀 전원이 끝까지 정체가 밝혀지지 않은 채 마피아팀 승리",
  },
  i_make_the_public_opinion: {
    id: "i_make_the_public_opinion",
    name: "민심은 제가 만듭니다",
    title: "🗳️ 민심은 제가 만듭니다",
    desc: "스파이 상태로 자신이 투표한 사람이 세 번 이상 처형되고, 그중 마피아팀이 단 한 명도 없이 마피아팀 승리",
  },
  before_lunch: {
    id: "before_lunch",
    name: "점심 전에 끝냅시다",
    title: "🍷 점심 전에 끝냅시다",
    desc: "대부 상태로 3일차가 끝나기 전에 마피아팀 승리",
  },
  the_last_witch: {
    id: "the_last_witch",
    name: "마지막 마녀",
    title: "🕸️ 마지막 마녀",
    desc: "마녀 상태로 마피아팀에 자기 혼자만 남았던 적이 있는데도, 끝까지 살아남아 마피아팀 승리",
  },
  day_off_today: {
    id: "day_off_today",
    name: "오늘은 쉬는 날",
    title: "🧨 오늘은 쉬는 날",
    desc: "테러리스트 상태로 방화도 자폭도 한 번도 쓰지 않고, 끝까지 살아남아 마피아팀 승리",
  },
  quietly_as_always: {
    id: "quietly_as_always",
    name: "오늘도 조용히",
    title: "🪶 오늘도 조용히",
    desc: "괴도 상태로 보석을 전부 모으고, 끝까지 아무에게도 정체를 들키지 않은 채 승리",
  },
  legion_of_night: {
    id: "legion_of_night",
    name: "밤의 군단",
    title: "🦇 밤의 군단",
    desc: "뱀파이어 상태로 권속을 셋 이상 만들고 중립 승리",
  },
  i_only_work_nights: {
    id: "i_only_work_nights",
    name: "밤에만 일합니다",
    title: "🌕 밤에만 일합니다",
    desc: "늑대인간 상태로 3일차 이후까지 가면서 낮 투표에 단 한 번도 참여하지 않고, 끝까지 살아남아 중립 승리",
  },
  four_is_enough: {
    id: "four_is_enough",
    name: "제물은 넷이면 충분해",
    title: "🩸 제물은 넷이면 충분해",
    desc: "악마 숭배자 상태로 한 번도 최후 변론대에 서지 않고 영혼 넷을 모아 중립 승리",
  },
};

let cache = null; // { [channelId]: { nickname, achievements: [id,...], activeTitle: string|null } }

function ensureLoaded() {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    cache = JSON.parse(raw);
    if (!cache || typeof cache !== "object" || Array.isArray(cache)) throw new Error("형식이 올바르지 않음");
  } catch (e) {
    if (e && e.code === "ENOENT") {
      cache = {}; // 아직 저장 파일이 없는 첫 실행 - 정상
    } else {
      // 파일이 깨졌다면 조용히 빈 상태로 시작하면 다음 저장 때 그대로 덮어써서 영영 복구할 수 없다.
      // 깨진 파일을 따로 보관하고, 사람이 알아볼 수 있게 크게 경고한다.
      const broken = `${DATA_PATH}.corrupt-${Date.now()}`;
      try { fs.renameSync(DATA_PATH, broken); } catch { /* 옮기지 못해도 진행은 한다 */ }
      console.error(`\n[중요] 업적·칭호 저장 파일을 읽지 못했습니다 (${e.message}).\n       깨진 파일은 ${broken} 로 옮겨두었고, 빈 상태로 시작합니다.\n       예전 기록이 필요하면 그 파일을 확인해주세요.\n`);
      cache = {};
    }
  }
  return cache;
}

/**
 * 저장은 "임시 파일에 쓴 뒤 이름 바꾸기"로 한다.
 * 바로 덮어쓰면 쓰는 도중에 서버가 죽었을 때 반쪽짜리 파일이 남아 기록이 통째로 날아간다.
 */
let persistTimer = null;
function persistNow() {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    const tmp = `${DATA_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cache), "utf-8");
    fs.renameSync(tmp, DATA_PATH);
  } catch (e) {
    console.error("[achievementStore] 저장 실패:", e.message, "- 경로:", DATA_PATH);
  }
}
/** 짧은 시간에 여러 번 바뀌어도 디스크 쓰기는 한 번만 한다 (게임 종료 직후처럼 몰릴 때) */
function persist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => { persistTimer = null; persistNow(); }, 300);
  persistTimer.unref?.();
}
/** 서버를 끄기 전처럼 즉시 확정 저장이 필요할 때 */
export function flush() {
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
  persistNow();
}

function getOrCreateEntry(data, channelId, nickname) {
  const entry = data[channelId] || { nickname, achievements: [], activeTitle: null };
  if (nickname) entry.nickname = nickname;
  entry.achievements = entry.achievements || [];
  data[channelId] = entry;
  return entry;
}

/** 특정 사람에게 업적을 수여한다. 이미 갖고 있으면 아무 일도 하지 않는다(중복 방지).
 *  칭호를 자동으로 장착하지는 않는다 - 장착 여부는 본인이 대기실에서 직접 고른다. */
export function grantAchievement(channelId, nickname, achievementId) {
  if (!ACHIEVEMENTS[achievementId]) return { ok: false, error: "존재하지 않는 업적입니다." };
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, nickname);
  // 이미 갖고 있던 업적인지, 방금 처음 딴 것인지 알려준다.
  // 게임이 끝났을 때 "새로 얻은 칭호" 연출을 띄울지 판단하는 데 쓰인다.
  const isNew = !entry.achievements.includes(achievementId);
  if (isNew) entry.achievements.push(achievementId);
  persist();
  return { ok: true, entry, isNew };
}

/** 관리자가 특정 사람의 활성 칭호를 직접 지정한다 (소유 여부 확인 없이 강제로, 또는 해제하려면 null). */
export function setActiveTitle(channelId, title) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, null);
  entry.activeTitle = title || null;
  persist();
  return entry;
}

/**
 * "무작위" 칭호를 뜻하는 특별한 값.
 * 이 값을 걸어두면 게임이 시작되는 순간 보유 칭호 중 하나가 그 판 동안 쓰인다.
 * 실제 칭호 문자열과 절대 겹치지 않도록 일반 칭호가 쓰지 않는 모양으로 잡았다.
 */
export const RANDOM_TITLE = "__random__";

/** 그 사람이 보유한 칭호 중 하나를 무작위로 뽑는다. 하나도 없으면 null. */
export function rollRandomTitle(channelId) {
  const owned = getOwnedTitles(channelId);
  if (owned.length === 0) return null;
  return owned[Math.floor(Math.random() * owned.length)].title;
}

/** 플레이어 본인이 자신의 칭호를 장착/해제한다. 본인이 실제로 보유한 업적의 칭호인지 확인 후에만 허용한다. */
export function setMyActiveTitle(channelId, title) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, null);
  if (!title) {
    entry.activeTitle = null; // 해제는 항상 허용
    persist();
    return { ok: true, entry };
  }
  if (title === RANDOM_TITLE) {
    // 무작위는 특정 칭호를 고르는 게 아니므로 보유 검사를 하지 않는다.
    // 하나도 없는 사람이 걸어둬도 그냥 칭호 없이 시작할 뿐이라 문제될 게 없다.
    entry.activeTitle = RANDOM_TITLE;
    persist();
    return { ok: true, entry };
  }
  const owns = (entry.achievements || []).some((id) => ACHIEVEMENTS[id]?.title === title);
  if (!owns) return { ok: false, error: "보유하지 않은 칭호입니다." };
  entry.activeTitle = title;
  persist();
  return { ok: true, entry };
}

/** 특정 사람의 업적을 전부 초기화한다(칭호도 함께 해제). 관리자 전용. */
export function resetAchievements(channelId) {
  const data = ensureLoaded();
  const entry = getOrCreateEntry(data, channelId, null);
  entry.achievements = [];
  entry.activeTitle = null;
  persist();
  return { ok: true, entry };
}

/** 특정 사람이 보유한 업적 id 목록. */
export function getAchievements(channelId) {
  const data = ensureLoaded();
  return data[channelId]?.achievements || [];
}

/** 특정 사람이 업적을 통해 얻어 "장착 가능한" 칭호 목록. */
export function getOwnedTitles(channelId) {
  const ids = getAchievements(channelId);
  return ids.map((id) => ACHIEVEMENTS[id]).filter(Boolean).map((a) => ({ achievementId: a.id, title: a.title, name: a.name }));
}

/** 특정 사람의 현재 활성 칭호 (없으면 null). */
export function getActiveTitle(channelId) {
  const data = ensureLoaded();
  return data[channelId]?.activeTitle || null;
}

/** 관리자 페이지용 - 기록이 있는 모든 사람의 업적/칭호 목록. */
export function getAllAchievementProfiles() {
  const data = ensureLoaded();
  return Object.entries(data).map(([channelId, v]) => ({
    channelId,
    nickname: v.nickname,
    achievements: v.achievements || [],
    activeTitle: v.activeTitle || null,
  }));
}
