import type { Message } from "@/types/chat";
import { format } from "date-fns";
import { Check, CheckCheck, Clock } from "lucide-react";
import AudioPlayer from "./AudioPlayer";

interface MessageBubbleProps {
  message: Message;
  onAudioPlaybackEnd?: (messageId: string) => void;
}

export default function MessageBubble({ message, onAudioPlaybackEnd }: MessageBubbleProps) {
  const isMe = message.sender === "me";
  const bubbleClasses = isMe
    ? "bg-accent text-accent-foreground self-end rounded-l-lg rounded-tr-lg"
    : "bg-card text-card-foreground self-start rounded-r-lg rounded-tl-lg shadow-md";
  
  const renderTicks = () => {
    if (!isMe || !message.ticks) return null;
    if (message.ticks === "delivered") {
      return <CheckCheck size={16} className="text-primary group-hover:text-primary-foreground" />;
    }
    if (message.ticks === "sent") {
      return <Check size={16} className="text-muted-foreground group-hover:text-primary-foreground" />;
    }
    return <Clock size={16} className="text-muted-foreground group-hover:text-primary-foreground" />; // Default to clock if undefined
  };

  return (
    <div className={`group max-w-[75%] md:max-w-[65%] p-2 px-3 my-1 shadow ${bubbleClasses}`}>
      {message.type === "text" && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
      {message.type === "audio" && (
        <AudioPlayer 
          audioUrl={message.content} 
          autoPlay={message.isPlaying} 
          sender={message.sender}
          onPlaybackEnd={() => onAudioPlaybackEnd?.(message.id)}
          initialDuration={message.audioDuration}
        />
      )}
      <div className="flex justify-end items-center mt-1 text-xs text-muted-foreground group-hover:text-primary-foreground/80">
        <span className="mr-1">{format(message.timestamp, "HH:mm")}</span>
        {renderTicks()}
      </div>
    </div>
  );
}
