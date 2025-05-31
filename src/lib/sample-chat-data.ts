import type { MessageQueueItem } from '@/types/chat';

// Sample audio file (short piano chord)
const sampleAudioFriend = "https://ccrma.stanford.edu/~jos/mp3/pno-cs.mp3";
// Sample audio file for 'me' (slightly different or longer if needed for demo)
const sampleAudioMe = "https://www.sfu.ca/~truax/CAL.mp3"; // A short bell sound
const sampleImage = "https://placehold.co/300x200.png";
const sampleGif = "https://placehold.co/250x150.png"; // Static placeholder, but treated as GIF
const sampleSticker = "https://placehold.co/120x120.png";
const sampleVideo = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4";


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
    type: "image",
    content: sampleImage,
    delayAfter: 2000,
  },
  {
    sender: "me",
    type: "text",
    content: "Nice pic!",
    delayAfter: 1000,
  },
  {
    sender: "friend",
    type: "audio",
    content: sampleAudioFriend,
    audioDuration: 2000, 
    delayAfter: 1000,
  },
  {
    sender: "me",
    type: "sticker",
    content: sampleSticker,
    delayAfter: 1500,
  },
  {
    sender: "friend",
    type: "gif",
    content: sampleGif, // Will be displayed as an image
    delayAfter: 2000,
  },
  {
    sender: "me",
    type: "text",
    content: "Haha, cool GIF!",
    delayAfter: 1000,
  },
  {
    sender: "friend",
    type: "video",
    content: sampleVideo,
    videoDuration: 10000, // Duration of the sample video in ms
    delayAfter: 1000,
  },
  {
    sender: "me",
    type: "text",
    content: "Wow, a video!",
    delayAfter: 1200,
  },
  {
    sender: "me",
    type: "audio",
    content: sampleAudioMe,
    audioDuration: 1500, 
    delayAfter: 1000,
  },
  {
    sender: "friend",
    type: "text",
    content: "Yep! This simulator is getting fancy.",
    delayAfter: 0, 
  },
];
