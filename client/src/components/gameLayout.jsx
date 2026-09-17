import React, { createContext, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 플레이어 화면 레이아웃 컨텍스트.
 *  - mode: "desktop"(PC 3단 배치) | "mobile"(하단 탭) | null(레이아웃 밖 - 예전처럼 제자리에 그린다)
 *  - chatEl: 채팅 패널들이 모여야 하는 DOM 노드. 각 단계 화면 안에 흩어져 있던 채팅창은
 *    이 노드로 포털되어, PC에서는 오른쪽 열에, 모바일에서는 "채팅" 탭에 모인다.
 *  - topTimer: 상단 바에 타이머가 떠 있으면, 각 화면 안의 큰 타이머는 숨긴다.
 */
export const GameLayoutContext = createContext({ mode: null, chatEl: null, topTimer: false });
export const useGameLayout = () => useContext(GameLayoutContext);

export const DESKTOP_MIN_WIDTH = 1024;

export function useIsDesktop() {
  const query = `(min-width: ${DESKTOP_MIN_WIDTH}px)`;
  const get = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia(query).matches;
  const [isDesktop, setIsDesktop] = useState(get);
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () => (mq.removeEventListener ? mq.removeEventListener("change", onChange) : mq.removeListener(onChange));
  }, [query]);
  return isDesktop;
}

/** 채팅 패널을 레이아웃의 채팅 영역으로 옮겨 그린다. inline이면(또는 레이아웃 밖이면) 제자리에 그린다. */
export function ChatSlot({ children, inline }) {
  const { chatEl } = useGameLayout();
  if (inline || !chatEl) return children;
  return createPortal(children, chatEl);
}

/** 채팅 영역 안에 그려지는 중인지 (높이를 꽉 채우는 스타일로 바꿀 때 사용) */
export function useInChatSlot(inline) {
  const { chatEl } = useGameLayout();
  return !inline && !!chatEl;
}

/**
 * 채팅방 목록 컨텍스트 - 밤에 채팅방이 여러 개(마피아·연인·영매 등)면 채팅 영역 위에 방 탭을 띄워
 * 한 번에 한 방만 크게 보여준다. 각 채팅창은 자기 자신을 등록하고, 탭에는 안 읽은 메시지 수가 뜬다.
 *  - rooms: [{ key, title, count }]
 *  - isVisible(key): 지금 이 방이 화면에 보이는지 (탭이 하나거나, 선택됐거나, "모두 보기"일 때)
 */
export const ChatRoomsContext = createContext(null);
export const useChatRooms = () => useContext(ChatRoomsContext);

export function useRegisterChatRoom(key, title, count, enabled) {
  const api = useChatRooms();
  const upsert = api?.upsert;
  const remove = api?.remove;
  useEffect(() => {
    if (!upsert || !enabled) return;
    upsert(key, title, count);
  }, [upsert, key, title, count, enabled]);
  useEffect(() => {
    if (!remove || !enabled) return undefined;
    return () => remove(key);
  }, [remove, key, enabled]);
}
