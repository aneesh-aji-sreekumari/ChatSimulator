"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Message, MessageQueueItem } from "@/types/chat";
import { messageQueue as defaultMessageQueue } from "@/lib/sample-chat-data";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatWindow from "@/components/chat/ChatWindow";
import KeypadArea from "@/components/chat/KeypadArea";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

const TYPING_SPEED_MS = 80; // Milliseconds per character
const FRIEND_TYPING_INDICATOR_DURATION_MS = 1500; // How long "friend is typing..." shows
const READING_WORDS_PER_MINUTE = 200;

// Helper to pause execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function ChatterSimPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState(""); // For "me" typing
  const [showFriendTypingIndicator, setShowFriendTypingIndicator] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showKeypadInputArea, setShowKeypadInputArea] = useState(false); // Simulates keyboard pop-up
  const [showSendButton, setShowSendButton] = useState(false);

  const audioCompletionPromises = useRef<Record<string, () => void>>({});

  const addMessage = (newMessage: Omit<Message, "id" | "timestamp">) => {
    setMessages(prev => [
      ...prev,
      { ...newMessage, id: Date.now().toString() + Math.random(), timestamp: new Date() },
    ]);
  };

  const updateMessageTicks = (messageId: string, ticks: "sent" | "delivered") => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, ticks } : msg));
  };

  const handleAudioPlaybackEnd = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
    audioCompletionPromises.current[messageId]?.();
    delete audioCompletionPromises.current[messageId];
  }, []);

  const simulateChat = async (queue: MessageQueueItem[]) => {
    setIsSimulating(true);
    setShowKeypadInputArea(false); 
    setCurrentTypingText("");
    setIsRecordingAudio(false);
    setShowFriendTypingIndicator(false);
    setMessages([]); // Clear previous messages

    await delay(500); // Initial small delay

    for (const item of queue) {
      if (item.sender === "me") {
        setShowKeypadInputArea(true);
        await delay(300); // keyboard pop-up animation

        if (item.type === "text") {
          setShowSendButton(false);
          for (let i = 0; i < item.content.length; i++) {
            setCurrentTypingText(item.content.substring(0, i + 1));
            await delay(TYPING_SPEED_MS);
          }
          setShowSendButton(true);
          await delay(500); // Pause before "send"
          
          const sentMessageId = Date.now().toString() + Math.random();
          setMessages(prev => [
            ...prev,
            { 
              id: sentMessageId, 
              sender: "me", 
              type: "text", 
              content: item.content, 
              timestamp: new Date(), 
              ticks: "sent" 
            },
          ]);
          setCurrentTypingText("");
          setShowSendButton(false);
          await delay(300); // Simulate send animation
          updateMessageTicks(sentMessageId, "delivered");

        } else if (item.type === "audio") {
          setIsRecordingAudio(true);
          setCurrentTypingText(""); // Clear any text
          setShowSendButton(false);
          await delay(item.audioDuration || 2000); // Simulate recording duration
          setIsRecordingAudio(false);
          addMessage({
            sender: "me",
            type: "audio",
            content: item.content,
            ticks: "delivered", // Directly to delivered for simplicity
            audioDuration: item.audioDuration,
          });
        }
        setShowKeypadInputArea(false); 

      } else { // sender is "friend"
        setShowKeypadInputArea(false); 
        if (item.type === "text") {
          setShowFriendTypingIndicator(true);
          await delay(FRIEND_TYPING_INDICATOR_DURATION_MS);
          setShowFriendTypingIndicator(false);
          addMessage({ sender: "friend", type: "text", content: item.content });
          
          const wordCount = item.content.split(/\s+/).length;
          const readingTimeMs = (wordCount / READING_WORDS_PER_MINUTE) * 60 * 1000;
          await delay(Math.max(readingTimeMs, 1000)); // Minimum 1s reading time

        } else if (item.type === "audio") {
          const audioMessageId = Date.now().toString() + Math.random();
          setMessages(prev => [
            ...prev,
            { 
              id: audioMessageId, 
              sender: "friend", 
              type: "audio", 
              content: item.content, 
              timestamp: new Date(), 
              isPlaying: true,
              audioDuration: item.audioDuration
            },
          ]);
          
          // Wait for audio to finish
          // For actual audio duration, this would involve getting duration from the <audio> element
          // and awaiting its 'ended' event.
          // For simulation with known duration:
          if (item.audioDuration) {
            await new Promise<void>(resolve => {
              audioCompletionPromises.current[audioMessageId] = resolve;
              // Fallback timeout if onPlaybackEnd isn't called (e.g., audio error)
              // This is a simplified wait; a more robust solution would involve the AudioPlayer component.
              setTimeout(() => {
                if (audioCompletionPromises.current[audioMessageId]) {
                  resolve(); // Resolve if not already resolved by onPlaybackEnd
                  delete audioCompletionPromises.current[audioMessageId];
                }
              }, item.audioDuration + 500); // Wait for duration + buffer
            });
          } else {
            await delay(3000); // Default wait if duration unknown
          }
        }
      }
      await delay(item.delayAfter);
    }

    setIsSimulating(false);
    setShowKeypadInputArea(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-200 dark:bg-slate-800">
      <div className="w-full max-w-sm h-[calc(100vh-2rem)] sm:h-[calc(100vh-4rem)] max-h-[800px] bg-background flex flex-col shadow-2xl rounded-xl overflow-hidden border-4 border-slate-700 dark:border-slate-600">
        <ChatHeader name="Alice" avatarUrl="https://placehold.co/80x80.png" isOnline={isSimulating || showFriendTypingIndicator} />
        <ChatWindow messages={messages} showTypingIndicator={showFriendTypingIndicator} onAudioPlaybackEnd={handleAudioPlaybackEnd} />
        {(showKeypadInputArea || isRecordingAudio) && (
          <KeypadArea
            isSimulating={isSimulating && (currentTypingText !== "" || isRecordingAudio)}
            isRecordingAudio={isRecordingAudio}
            typedText={currentTypingText}
            showSendButton={showSendButton}
          />
        )}
        <div className="p-4 border-t bg-background">
          <Button 
            onClick={() => simulateChat(defaultMessageQueue)} 
            disabled={isSimulating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="Start chat simulation"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            {isSimulating ? "Simulating..." : "Simulate Chat"}
          </Button>
        </div>
      </div>
    </div>
  );
}
