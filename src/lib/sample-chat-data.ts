import type { MessageQueueItem } from '@/types/chat';

// Sample audio file (short piano chord)
const sampleAudioFriend = "https://ccrma.stanford.edu/~jos/mp3/pno-cs.mp3";
// Sample audio file for 'me' (slightly different or longer if needed for demo)
const sampleAudioMe = "https://www.sfu.ca/~truax/CAL.mp3"; // A short bell sound

export const messageQueue: MessageQueueItem[] = [
  {
    sender: "me",
    type: "text",
    content: "Hey! How's it going?",
    delayAfter: 1000,
  },
  {
    sender: "friend",
    type: "text",
    content: "Pretty good! Just chilling. You?",
    delayAfter: 1500,
  },
  {
    sender: "me",
    type: "text",
    content: "Same here. Working on a new project.",
    delayAfter: 1200,
  },
  {
    sender: "friend",
    type: "audio",
    content: sampleAudioFriend,
    audioDuration: 2000, // Estimated duration for simulation if actual can't be fetched easily
    delayAfter: 1000,
  },
  {
    sender: "me",
    type: "text",
    content: "Nice! Sounds interesting.",
    delayAfter: 2000,
  },
  {
    sender: "friend",
    type: "text",
    content: "Yeah, it's a chat simulator. Pretty meta, huh?",
    delayAfter: 1500,
  },
  {
    sender: "me",
    type: "audio",
    content: sampleAudioMe,
    audioDuration: 3000, // Estimated duration for outgoing audio recording simulation
    delayAfter: 1000,
  },
  {
    sender: "friend",
    type: "text",
    content: "Haha, definitely! Let me know how it turns out.",
    delayAfter: 0, // Last message
  },
];
