// 채팅 관련 공용 타입들

export interface ChatRoomListItem {
  roomId: string;
  counterpartUsername?: string | null;
  lastMessage?: { content: string; createdAt?: string } | null;
}

export interface ChatMessageItem {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}


