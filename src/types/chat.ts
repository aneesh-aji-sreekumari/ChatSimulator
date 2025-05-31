export type MessageSender = "me" | "friend";
export type MessageType = "text" | "audio";

export interface Message {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content: string; // Text or URL to audio
  timestamp: Date;
  ticks?: "sent" | "delivered";
  audioDuration?: number; // For audio messages, used in simulation if known
  isPlaying?: boolean; // For UI state of audio player
}

export interface MessageQueueItem {
  sender: MessageSender;
  type: MessageType;
  content: string;
  delayAfter: number; // ms to wait after this message (and its internal animations/durations) before processing next
  audioDuration?: number; // If type is audio, actual or estimated duration for simulation
}
