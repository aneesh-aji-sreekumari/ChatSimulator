export type MessageSender = "me" | "friend";
export type MessageType = "text" | "audio" | "image" | "gif" | "sticker" | "video";

export interface Message {
  id: string;
  sender: MessageSender;
  type: MessageType;
  content: string; // Text or URL to media
  timestamp: Date;
  ticks?: "sent" | "delivered";
  audioDuration?: number; // For audio messages, used in simulation if known
  isPlaying?: boolean; // For UI state of audio player
  videoDuration?: number; // For video messages
  isVideoPlaying?: boolean; // For UI state of video player
}

export interface MessageQueueItem {
  id: string; // Added for composer management
  sender: MessageSender;
  type: MessageType;
  content: string;
  delayAfter: number; // ms to wait after this message (and its internal animations/durations) before processing next
  audioDuration?: number; // If type is audio, actual or estimated duration for simulation
  videoDuration?: number; // If type is video, actual or estimated duration for simulation
}
