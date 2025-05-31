
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Message, MessageQueueItem } from "@/types/chat";
import { messageQueue as defaultMessageQueue } from "@/lib/sample-chat-data";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatWindow from "@/components/chat/ChatWindow";
import KeypadArea from "@/components/chat/KeypadArea";
import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

const TYPING_SPEED_MS = 80; 
const FRIEND_TYPING_INDICATOR_DURATION_MS = 1500;
const READING_WORDS_PER_MINUTE = 200;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function ChatterSimPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState(""); 
  const [showFriendTypingIndicator, setShowFriendTypingIndicator] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showKeypadInputArea, setShowKeypadInputArea] = useState(false); 
  const [showSendButton, setShowSendButton] = useState(false);

  const audioCompletionPromises = useRef<Record<string, () => void>>({});
  const videoCompletionPromises = useRef<Record<string, () => void>>({});


  const addMessage = (newMessageOmitIdTimestamp: Omit<Message, "id" | "timestamp">) => {
    const newMessage = { 
      ...newMessageOmitIdTimestamp, 
      id: Date.now().toString() + Math.random(), 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  };

  const updateMessageTicks = (messageId: string, ticks: "sent" | "delivered") => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, ticks } : msg));
  };

  const handleAudioPlaybackEnd = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isPlaying: false } : msg));
    audioCompletionPromises.current[messageId]?.();
    delete audioCompletionPromises.current[messageId];
  }, []);

  const handleVideoPlaybackEnd = useCallback((messageId: string) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, isVideoPlaying: false } : msg));
    videoCompletionPromises.current[messageId]?.();
    delete videoCompletionPromises.current[messageId];
  }, []);


  const simulateChat = async (queue: MessageQueueItem[]) => {
    setIsSimulating(true);
    setShowKeypadInputArea(false);
    setCurrentTypingText("");
    setIsRecordingAudio(false);
    setShowFriendTypingIndicator(false);
    setMessages([]); 

    await delay(500); 

    for (const item of queue) {
      if (item.sender === "me") {
        setShowKeypadInputArea(true);
        await delay(300); 

        let sentMessageId: string | undefined;

        if (item.type === "text") {
          setShowSendButton(false);
          for (let i = 0; i < item.content.length; i++) {
            setCurrentTypingText(item.content.substring(0, i + 1));
            await delay(TYPING_SPEED_MS);
          }
          setShowSendButton(true);
          await delay(500); 
          
          sentMessageId = addMessage({
            sender: "me",
            type: "text",
            content: item.content,
            ticks: "sent"
          });
          setCurrentTypingText("");
          setShowSendButton(false);

        } else if (item.type === "audio") {
          setIsRecordingAudio(true);
          setCurrentTypingText(""); 
          setShowSendButton(false);
          
          if (item.content) {
             // Simulate recording by playing the audio
            const audio = new Audio(item.content);
            await new Promise<void>((resolve) => {
              audio.oncanplaythrough = () => audio.play().catch(err => { console.error("Error playing recording sim audio:", err); resolve(); });
              audio.onended = resolve;
              audio.onerror = (e) => { console.error("Error during recording sim audio playback:", e); resolve(); };
              audio.load();
            });
          } else {
            await delay(item.audioDuration || 2000);
          }
          setIsRecordingAudio(false);
          sentMessageId = addMessage({
            sender: "me",
            type: "audio",
            content: item.content,
            audioDuration: item.audioDuration,
            ticks: "sent"
          });
        } else if (item.type === "image" || item.type === "gif" || item.type === "sticker" || item.type === "video") {
          // For other media types, simulate selection and send
          setCurrentTypingText(`Sending ${item.type}...`); // Optional: show some text
          setShowSendButton(true); // Or an attach icon
          await delay(700); // Simulate user selecting media

          sentMessageId = addMessage({
            sender: "me",
            type: item.type,
            content: item.content,
            videoDuration: item.videoDuration,
            ticks: "sent"
          });
          setCurrentTypingText("");
          setShowSendButton(false);
        }
        
        if (sentMessageId) {
          await delay(300); 
          updateMessageTicks(sentMessageId, "delivered");
        }
        setShowKeypadInputArea(false);

      } else { // sender is "friend"
        setShowKeypadInputArea(false);
        setShowFriendTypingIndicator(true);
        await delay(FRIEND_TYPING_INDICATOR_DURATION_MS);
        setShowFriendTypingIndicator(false);

        if (item.type === "text") {
          addMessage({ sender: "friend", type: "text", content: item.content });
          const wordCount = item.content.split(/\s+/).length;
          const readingTimeMs = (wordCount / READING_WORDS_PER_MINUTE) * 60 * 1000;
          await delay(Math.max(readingTimeMs, 1000)); 

        } else if (item.type === "audio") {
          const audioMessageId = addMessage({
            sender: "friend",
            type: "audio",
            content: item.content,
            isPlaying: true, 
            audioDuration: item.audioDuration 
          });
          await new Promise<void>(resolve => {
             audioCompletionPromises.current[audioMessageId] = resolve;
          });
        } else if (item.type === "video") {
          const videoMessageId = addMessage({
            sender: "friend",
            type: "video",
            content: item.content,
            isVideoPlaying: true,
            videoDuration: item.videoDuration
          });
           await new Promise<void>(resolve => {
             videoCompletionPromises.current[videoMessageId] = resolve;
          });
        } else if (item.type === "image" || item.type === "gif" || item.type === "sticker") {
           addMessage({ sender: "friend", type: item.type, content: item.content });
           await delay(1500); // Generic delay for viewing image/gif/sticker
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
        <ChatWindow 
          messages={messages} 
          showTypingIndicator={showFriendTypingIndicator} 
          onAudioPlaybackEnd={handleAudioPlaybackEnd}
          onVideoPlaybackEnd={handleVideoPlaybackEnd} 
        />
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
