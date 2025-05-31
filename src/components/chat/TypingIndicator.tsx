export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 p-2 self-start">
      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-typing-dots-bounce [animation-delay:-0.32s]"></div>
      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-typing-dots-bounce [animation-delay:-0.16s]"></div>
      <div className="h-2 w-2 bg-muted-foreground rounded-full animate-typing-dots-bounce"></div>
    </div>
  );
}
