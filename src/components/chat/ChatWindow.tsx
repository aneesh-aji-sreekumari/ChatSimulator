"use client";

import type { Message } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef } from "react";

interface ChatWindowProps {
  messages: Message[];
  showTypingIndicator: boolean;
  onAudioPlaybackEnd?: (messageId: string) => void;
  onVideoPlaybackEnd?: (messageId: string) => void;
}

export default function ChatWindow({ messages, showTypingIndicator, onAudioPlaybackEnd, onVideoPlaybackEnd }: ChatWindowProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, showTypingIndicator]);

  return (
    <ScrollArea className="flex-grow p-4 bg-whatsapp-bg" ref={scrollAreaRef}>
      <div className="flex flex-col space-y-2" aria-live="polite">
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            onAudioPlaybackEnd={onAudioPlaybackEnd}
            onVideoPlaybackEnd={onVideoPlaybackEnd}
          />
        ))}
        {showTypingIndicator && <TypingIndicator />}
      </div>
    </ScrollArea>
  );
}
