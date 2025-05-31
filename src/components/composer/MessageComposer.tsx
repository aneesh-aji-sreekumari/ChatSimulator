
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
import NextImage from "next/image"; // Use NextImage for consistency

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
    if (name === "content" && formData.type !== "text") {
      setFormData(prev => ({
        ...prev,
        content: value,
      }));
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
          content: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        content: prev.content.startsWith("data:") ? "" : prev.content,
      }));
    }
  };

  const handleSelectChange = (name: "sender" | "type") => (value: string) => {
    const newType = value as MessageType;

    setFormData(prev => {
      let newContent = prev.content;

      if (name === 'type' && prev.content.startsWith("data:")) {
        newContent = "";
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }

      const activeType = name === 'type' ? newType : prev.type;

      return {
        ...prev,
        [name]: value,
        content: newContent,
        audioDuration: activeType === "audio" ? prev.audioDuration || 2000 : undefined,
        videoDuration: activeType === "video" ? prev.videoDuration || 5000 : undefined,
      };
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.content && (formData.type !== 'text' && !formData.audioDuration && !formData.videoDuration )) {
        if (formData.type === 'audio' && !formData.audioDuration && !formData.content) {
          console.warn(`Content or duration is required for audio message type`);
          return;
        }
        if (formData.type === 'video' && !formData.videoDuration && !formData.content) {
          console.warn(`Content or duration is required for video message type`);
          return;
        }
        if (formData.type !== 'text' && formData.type !== 'audio' && formData.type !== 'video' && !formData.content) {
          console.warn(`Content is required for message type: ${formData.type}`);
          return;
        }
    }

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
      audioDuration: messageToEdit.audioDuration,
      videoDuration: messageToEdit.videoDuration,
    });
    setEditingId(messageToEdit.id);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
                  value={isMediaUploaded ? "Using uploaded file" : formData.content}
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
                    formData.type === "sticker" ? "image/*" :
                    undefined
                  }
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isMediaUploaded}
                />

                {isMediaUploaded && formData.content && (
                  <div className="mt-2 p-2 border rounded-md space-y-2">
                    <Label className="text-xs font-medium">Uploaded File Preview:</Label>
                    {formData.type.match(/^(image|gif|sticker)$/) && <NextImage src={formData.content} alt="Preview" width={150} height={100} className="max-w-full h-auto rounded border object-contain" data-ai-hint="media preview"/>}
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
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0 overflow-hidden"> {/* Added overflow-hidden */}
                        <p className="text-sm font-medium">
                          <span className={`capitalize px-2 py-0.5 rounded-full text-xs mr-2 ${item.sender === 'me' ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
                            {item.sender}
                          </span>
                          <span className="capitalize text-muted-foreground">({item.type})</span>
                        </p>
                        <p className="text-sm mt-1 truncate" title={item.content.startsWith("data:") ? "[Uploaded File]" : item.content}> {/* Removed break-all, rely on truncate */}
                          {item.content.startsWith("data:") ? `[Uploaded ${item.type}]` : item.content}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span>Delay: {item.delayAfter}ms</span>
                          {item.type === 'audio' && typeof item.audioDuration === 'number' && <span> / Duration: {item.audioDuration}ms</span>}
                          {item.type === 'video' && typeof item.videoDuration === 'number' && <span> / Duration: {item.videoDuration}ms</span>}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-1 flex-shrink-0"> {/* Added items-center */}
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
