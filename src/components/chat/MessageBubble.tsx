
import type { Message } from "@/types/chat";
import { format } from "date-fns";
import { Check, CheckCheck, Clock } from "lucide-react";
import AudioPlayer from "./AudioPlayer";
import Image from "next/image";

interface MessageBubbleProps {
  message: Message;
  onAudioPlaybackEnd?: (messageId: string) => void;
  onVideoPlaybackEnd?: (messageId: string) => void;
  friendAvatarUrl: string;
}

export default function MessageBubble({ message, onAudioPlaybackEnd, onVideoPlaybackEnd, friendAvatarUrl }: MessageBubbleProps) {
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
    return <Clock size={16} className="text-muted-foreground group-hover:text-primary-foreground" />;
  };

  const renderMedia = () => {
    switch (message.type) {
      case "text":
        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
      case "audio":
        return (
          <AudioPlayer
            audioUrl={message.content}
            autoPlay={message.isPlaying}
            sender={message.sender}
            onPlaybackEnd={() => onAudioPlaybackEnd?.(message.id)}
            initialDuration={message.audioDuration}
            friendAvatarUrlForAudio={message.sender === 'friend' ? friendAvatarUrl : undefined}
          />
        );
      case "image":
        return (
          <Image
            src={message.content}
            alt="Image"
            width={300}
            height={200}
            className="rounded-lg object-cover max-w-full h-auto"
            data-ai-hint="chat photo"
          />
        );
      case "gif": // GIFs are rendered like images
        return (
          <Image
            src={message.content}
            alt="GIF"
            width={250}
            height={150}
            className="rounded-lg object-cover max-w-full h-auto"
            data-ai-hint="funny animation"
          />
        );
      case "sticker":
        return (
          <Image
            src={message.content}
            alt="Sticker"
            width={120}
            height={120}
            className="object-contain"
            data-ai-hint="cute sticker"
          />
        );
      case "video":
        return (
          <video
            src={message.content}
            controls
            autoPlay={message.isVideoPlaying && message.sender === 'friend'} // Autoplay only for friend's incoming video
            onEnded={() => onVideoPlaybackEnd?.(message.id)}
            className="rounded-lg max-w-full h-auto max-h-64 outline-none"
            playsInline // Important for mobile
          >
            Your browser does not support the video tag.
          </video>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`group max-w-[75%] md:max-w-[65%] p-2 px-3 my-1 shadow ${bubbleClasses}`}>
      {renderMedia()}
      <div className="flex justify-end items-center mt-1 text-xs text-muted-foreground group-hover:text-primary-foreground/80">
        <span className="mr-1">{format(message.timestamp, "HH:mm")}</span>
        {renderTicks()}
      </div>
    </div>
  );
}
