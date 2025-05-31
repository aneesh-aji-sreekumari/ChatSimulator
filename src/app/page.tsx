
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Message, MessageQueueItem } from "@/types/chat";
import { messageQueue as defaultMessageQueue } from "@/lib/sample-chat-data";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatWindow from "@/components/chat/ChatWindow";
import KeypadArea from "@/components/chat/KeypadArea";
import MessageComposer from "@/components/composer/MessageComposer";
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
  const [customMessageQueue, setCustomMessageQueue] = useState<MessageQueueItem[]>(() => {
    // Ensure defaultMessageQueue items have IDs if they are to be editable by composer
    // This is now handled in sample-chat-data.ts
    return JSON.parse(JSON.stringify(defaultMessageQueue)); // Deep copy
  });


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
    if (!queue || queue.length === 0) {
      console.warn("Message queue is empty. Nothing to simulate.");
      // Optionally, show a toast or message to the user
      // For now, just return
      return;
    }
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
            const audio = new Audio(item.content);
            const playbackPromise = new Promise<void>((resolve, reject) => {
              audio.oncanplaythrough = () => audio.play().catch(err => { console.error("Error playing recording sim audio:", err); reject(err); });
              audio.onended = resolve;
              audio.onerror = (e) => { console.error("Error during recording sim audio playback:", e); reject(e); };
              audio.load(); 
            });
             try {
                await playbackPromise;
             } catch (error) {
                console.error("Failed to play audio during 'me' sending simulation:", error);
                // Fallback to duration if playback fails
                await delay(item.audioDuration || 2000);
             }
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
          setCurrentTypingText(`Sending ${item.type}...`);
          setShowSendButton(true); 
          await delay(700); 

          sentMessageId = addMessage({
            sender: "me",
            type: item.type,
            content: item.content,
            videoDuration: item.videoDuration, // only relevant for video type
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
           if (!item.content) {
            console.warn("Friend's audio message has no content. Skipping playback wait.");
            addMessage({ sender: "friend", type: "audio", content: "", isPlaying: false, audioDuration: item.audioDuration });
            await delay(item.audioDuration || 1000); // Fallback delay
          } else {
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
          }
        } else if (item.type === "video") {
          if (!item.content) {
             console.warn("Friend's video message has no content. Skipping playback wait.");
             addMessage({ sender: "friend", type: "video", content: "", isVideoPlaying: false, videoDuration: item.videoDuration });
             await delay(item.videoDuration || 2000); // Fallback delay
          } else {
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
          }
        } else if (item.type === "image" || item.type === "gif" || item.type === "sticker") {
           addMessage({ sender: "friend", type: item.type, content: item.content });
           await delay(1500); 
        }
      }
      await delay(item.delayAfter);
    }

    setIsSimulating(false);
    setShowKeypadInputArea(false);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-200 dark:bg-slate-800 p-4 gap-4">
      <div className="md:w-1/3 lg:w-1/4 h-full md:max-h-[calc(100vh-2rem)]">
        <MessageComposer queue={customMessageQueue} setQueue={setCustomMessageQueue} />
      </div>
      
      <div className="md:w-2/3 lg:w-3/4 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm h-[calc(100vh-2rem-env(safe-area-inset-bottom))] sm:h-[calc(100vh-4rem-env(safe-area-inset-bottom))] max-h-[800px] bg-background flex flex-col shadow-2xl rounded-xl overflow-hidden border-4 border-slate-700 dark:border-slate-600">
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
              onClick={() => simulateChat(customMessageQueue)}
              disabled={isSimulating || customMessageQueue.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              aria-label="Start chat simulation"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              {isSimulating ? "Simulating..." : "Simulate Chat"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
