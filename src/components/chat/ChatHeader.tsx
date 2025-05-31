import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical, UserCircle } from "lucide-react";

interface ChatHeaderProps {
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export default function ChatHeader({ name, avatarUrl, isOnline }: ChatHeaderProps) {
  return (
    <header className="bg-primary/10 dark:bg-primary/20 p-3 flex items-center justify-between shadow-sm border-b border-primary/20">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-background">
          <AvatarImage src={avatarUrl} alt={name} data-ai-hint="profile avatar" />
          <AvatarFallback>
            <UserCircle className="h-10 w-10 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-base text-foreground">{name}</h2>
          {isOnline && <p className="text-xs text-primary">Online</p>}
        </div>
      </div>
      <button aria-label="More options">
        <MoreVertical className="text-primary" />
      </button>
    </header>
  );
}
