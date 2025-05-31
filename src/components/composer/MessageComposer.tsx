
"use client";

import type { MessageQueueItem, MessageSender, MessageType } from "@/types/chat";
import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XCircle, Edit3, Trash2, PlusCircle, FileUp } from "lucide-react";

interface MessageComposerProps {
  queue: MessageQueueItem[];
  setQueue: (newQueue: MessageQueueItem[]) => void;
}

const initialFormState: Omit<MessageQueueItem, "id"> = {
  sender: "me",
  type: "text" as MessageType,
  content: "",
  delayAfter: 1000,
  audioDuration: undefined,
  videoDuration: undefined,
};

export default function MessageComposer({ queue, setQueue }: MessageComposerProps) {
  const [formData, setFormData] = useState<Omit<MessageQueueItem, "id">>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "content" && formData.type !== "text") { // URL input for media
      // If user types in URL, it takes precedence over any uploaded file for this draft
      setFormData(prev => ({
        ...prev,
        content: value, 
      }));
      // No need to clear fileInputRef.current.value here, as data URI in formData.content is what matters
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: (name === "delayAfter" || name === "audioDuration" || name === "videoDuration") 
                  ? parseInt(value, 10) || 0 
                  : value 
      }));
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          content: reader.result as string, // This will be a data URI
        }));
      };
      reader.readAsDataURL(file);
    } else {
      // If file selection is cancelled, and content was a data URI, clear it
      // This allows URL input to become active again.
      setFormData(prev => ({
        ...prev,
        content: prev.content.startsWith("data:") ? "" : prev.content,
      }));
    }
  };

  const handleSelectChange = (name: "sender" | "type") => (value: string) => {
    const newType = value as MessageType; // if name is 'type', otherwise it's MessageSender
    
    setFormData(prev => {
      const oldType = prev.type;
      let newContent = prev.content;

      // If current content is an uploaded file (data URI) and type is changing, clear it.
      if (name === 'type' && prev.content.startsWith("data:")) {
        newContent = "";
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input field
        }
      }
      // If switching from text to media, and content was text (not a URL), clear it.
      // This might be too aggressive if user typed a URL then switched type.
      // For simplicity, we'll only clear data URIs on type change for now.
      // URLs will persist.

      const activeType = name === 'type' ? newType : prev.type;

      return {
        ...prev,
        [name]: value, // Updates either 'sender' or 'type'
        content: newContent,
        audioDuration: activeType === "audio" ? prev.audioDuration || 2000 : undefined,
        videoDuration: activeType === "video" ? prev.videoDuration || 5000 : undefined,
      };
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setQueue(queue.map(item => item.id === editingId ? { ...formData, id: editingId } : item));
    } else {
      const newItemId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
      setQueue([...queue, { ...formData, id: newItemId }]);
    }
    resetForm();
  };

  const handleEdit = (messageToEdit: MessageQueueItem) => {
    setFormData({
      sender: messageToEdit.sender,
      type: messageToEdit.type,
      content: messageToEdit.content,
      delayAfter: messageToEdit.delayAfter,
      audioDuration: messageToEdit.type === "audio" ? messageToEdit.audioDuration : undefined,
      videoDuration: messageToEdit.type === "video" ? messageToEdit.videoDuration : undefined,
    });
    setEditingId(messageToEdit.id);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input when starting an edit
    }
  };

  const handleDelete = (idToDelete: string) => {
    setQueue(queue.filter(item => item.id !== idToDelete));
    if (editingId === idToDelete) {
      resetForm();
    }
  };

  const handleClearQueue = () => {
    setQueue([]);
    resetForm();
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const clearUploadedFile = () => {
    setFormData(prev => ({...prev, content: ''}));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isMediaUploaded = formData.content.startsWith("data:");

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Message Queue Composer</CardTitle>
        <CardDescription>Create and manage the sequence of messages for the simulation.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-6 overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sender">Sender</Label>
            <Select name="sender" value={formData.sender} onValueChange={handleSelectChange("sender")}>
              <SelectTrigger id="sender">
                <SelectValue placeholder="Select sender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Me</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select name="type" value={formData.type} onValueChange={handleSelectChange("type")}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="gif">GIF</SelectItem>
                <SelectItem value="sticker">Sticker</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            {formData.type === "text" ? (
              <Textarea id="content" name="content" value={formData.content} onChange={handleInputChange} placeholder="Enter message text..." />
            ) : (
              <div className="space-y-2">
                <Input 
                  id="content-url" 
                  name="content" 
                  value={isMediaUploaded ? '' : formData.content}
                  onChange={handleInputChange} 
                  placeholder={`Enter ${formData.type} URL...`} 
                  disabled={isMediaUploaded}
                />
                <div className="text-sm text-muted-foreground text-center my-1">OR</div>
                
                <Label htmlFor="content-file-input" className={`w-full inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 ${isMediaUploaded ? 'bg-secondary/50 cursor-not-allowed' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer'}`}>
                  <FileUp className="mr-2 h-4 w-4" /> Upload File
                </Label>
                <Input 
                  id="content-file-input" 
                  ref={fileInputRef}
                  type="file"
                  accept={
                    formData.type === "audio" ? "audio/*" :
                    formData.type === "video" ? "video/*" :
                    formData.type === "image" ? "image/*" :
                    formData.type === "gif" ? "image/gif" :
                    formData.type === "sticker" ? "image/*" : // Stickers are often images (png, webp)
                    undefined
                  }
                  onChange={handleFileChange}
                  className="hidden" // Styled by the label
                  disabled={isMediaUploaded}
                />

                {isMediaUploaded && (
                  <div className="mt-2 p-2 border rounded-md space-y-2">
                    <Label className="text-xs font-medium">Uploaded File Preview:</Label>
                    {formData.type.match(/^(image|gif|sticker)$/) && <Image src={formData.content} alt="Preview" width={150} height={100} className="max-w-full h-auto rounded border object-contain" />}
                    {formData.type === 'video' && <video src={formData.content} controls className="max-w-full h-auto max-h-32 rounded border" />}
                    {formData.type === 'audio' && <audio src={formData.content} controls className="w-full" />}
                    <Button variant="outline" size="sm" onClick={clearUploadedFile} className="w-full mt-1">
                      <XCircle className="mr-2 h-4 w-4" /> Clear Uploaded File
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {formData.type === "audio" && (
            <div>
              <Label htmlFor="audioDuration">Audio Duration (ms)</Label>
              <Input id="audioDuration" name="audioDuration" type="number" value={formData.audioDuration || ""} onChange={handleInputChange} placeholder="e.g., 2000" />
            </div>
          )}

          {formData.type === "video" && (
            <div>
              <Label htmlFor="videoDuration">Video Duration (ms)</Label>
              <Input id="videoDuration" name="videoDuration" type="number" value={formData.videoDuration || ""} onChange={handleInputChange} placeholder="e.g., 5000" />
            </div>
          )}

          <div>
            <Label htmlFor="delayAfter">Delay After Message (ms)</Label>
            <Input id="delayAfter" name="delayAfter" type="number" value={formData.delayAfter} onChange={handleInputChange} placeholder="e.g., 1000" />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-grow">
              {editingId ? <Edit3 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
              {editingId ? "Update Message" : "Add Message"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                <XCircle className="mr-2 h-4 w-4" /> Cancel Edit
              </Button>
            )}
          </div>
        </form>

        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Current Queue ({queue.length})</h3>
            {queue.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearQueue}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
              </Button>
            )}
          </div>
          {queue.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">The message queue is empty. Add some messages to get started!</p>
          ) : (
            <ScrollArea className="flex-grow border rounded-md">
              <div className="p-4 space-y-3">
                {queue.map((item) => (
                  <Card key={item.id} className="p-3 bg-card/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">
                          <span className={`capitalize px-2 py-0.5 rounded-full text-xs mr-2 ${item.sender === 'me' ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
                            {item.sender}
                          </span>
                          <span className="capitalize text-muted-foreground">({item.type})</span>
                        </p>
                        <p className="text-sm mt-1 break-all max-w-[180px] sm:max-w-[230px] md:max-w-[180px] lg:max-w-[230px] xl:max-w-xs truncate" title={item.content.startsWith("data:") ? "[Uploaded File]" : item.content}>
                          {item.content.startsWith("data:") ? `[Uploaded ${item.type}]` : item.content}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span>Delay: {item.delayAfter}ms</span>
                          {item.type === 'audio' && item.audioDuration && <span> / Duration: {item.audioDuration}ms</span>}
                          {item.type === 'video' && item.videoDuration && <span> / Duration: {item.videoDuration}ms</span>}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 ml-2">
                        <Button variant="outline" size="iconSm" onClick={() => handleEdit(item)} aria-label="Edit message">
                          <Edit3 size={14} />
                        </Button>
                        <Button variant="destructive" size="iconSm" onClick={() => handleDelete(item.id)} aria-label="Delete message">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for Image to avoid direct next/image in CDATA if problematic
// For simplicity, direct <img> used for data URIs or basic <audio>/<video>
const Image = ({ src, alt, width, height, className }: { src: string, alt: string, width?: number, height?: number, className?: string }) => {
  // In a real scenario, you might want to use next/image if URLs are external and need optimization
  // For data URIs, <img> is fine.
  if (width && height) {
    return <img src={src} alt={alt} width={width} height={height} className={className} style={{objectFit: 'contain'}} />;
  }
  return <img src={src} alt={alt} className={className} style={{maxWidth: '100%', height: 'auto', objectFit: 'contain'}} />;
};
