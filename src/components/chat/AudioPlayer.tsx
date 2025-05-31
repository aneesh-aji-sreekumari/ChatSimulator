
"use client";

import type { MessageSender } from "@/types/chat";
import { Play, Pause, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  sender: MessageSender;
  onPlaybackEnd?: () => void;
  initialDuration?: number; // Duration in ms
  friendAvatarUrlForAudio?: string;
}

export default function AudioPlayer({ audioUrl, autoPlay = false, sender, onPlaybackEnd, initialDuration, friendAvatarUrlForAudio }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(initialDuration ? initialDuration / 1000 : 0); // in seconds

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (audio.duration !== Infinity && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const setAudioTime = () => {
      if (audio.duration !== Infinity && !isNaN(audio.duration) && audio.currentTime <= audio.duration) {
         setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
      onPlaybackEnd?.();
    };

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("durationchange", setAudioData); // Handles cases where duration becomes available later
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", handleEnded);

    if (autoPlay) {
      audio.play().catch(error => console.warn("Autoplay prevented:", error));
    }

    if (!initialDuration && audio.preload !== 'none') {
       audio.load();
    }


    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("durationchange", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl, autoPlay, onPlaybackEnd, initialDuration]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => console.error("Error playing audio:", error));
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const bubbleColor = sender === "me" ? "text-accent-foreground" : "text-foreground";

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg w-full max-w-[200px] ${bubbleColor}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button onClick={togglePlayPause} aria-label={isPlaying ? "Pause audio" : "Play audio"} className="focus:outline-none">
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>
      <div className="flex-grow relative h-5 flex items-center">
        <div className="w-full h-1 bg-muted-foreground/30 rounded-full">
          <div
            className={`h-1 rounded-full ${sender === 'me' ? 'bg-accent-foreground/70' : 'bg-primary'}`}
            style={{ width: `${progress}%` }}
          ></div>
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${sender === 'me' ? 'bg-accent-foreground' : 'bg-primary'} shadow`}
            style={{ left: `calc(${progress}% - 6px)`}}
            role="slider"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          ></div>
        </div>
      </div>
       <span className="text-xs w-10 text-right">{formatTime(duration * (progress / 100))}</span>
       {sender === 'friend' && friendAvatarUrlForAudio && (
        <Image src={friendAvatarUrlForAudio} alt="friend avatar" width={24} height={24} className="rounded-full" data-ai-hint="profile avatar" />
       )}
    </div>
  );
}
