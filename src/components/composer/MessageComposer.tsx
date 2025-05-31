
"use client";

import type { MessageQueueItem, MessageSender, MessageType } from "@/types/chat";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XCircle, Edit3, Trash2, PlusCircle } from "lucide-react";

interface MessageComposerProps {
  queue: MessageQueueItem[];
  setQueue: (newQueue: MessageQueueItem[]) => void;
}

const initialFormState: Omit<MessageQueueItem, "id"> = {
  sender: "me",
  type: "text" as MessageType, // Cast because form limited to text/audio but type is broader
  content: "",
  delayAfter: 1000,
  audioDuration: undefined,
};

export default function MessageComposer({ queue, setQueue }: MessageComposerProps) {
  const [formData, setFormData] = useState<Omit<MessageQueueItem, "id">>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === "delayAfter" || name === "audioDuration" ? parseInt(value, 10) || 0 : value }));
  };

  const handleSelectChange = (name: "sender" | "type") => (value: string) => {
    const newType = value as MessageType;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset audioDuration if type is not audio
      audioDuration: newType === "audio" ? prev.audioDuration || 2000 : undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    // If type is not text or audio, default to text for the form
    const formCompatibleType = (messageToEdit.type === "text" || messageToEdit.type === "audio") ? messageToEdit.type : "text";
    
    setFormData({
      sender: messageToEdit.sender,
      type: formCompatibleType,
      content: messageToEdit.content,
      delayAfter: messageToEdit.delayAfter,
      audioDuration: formCompatibleType === "audio" ? messageToEdit.audioDuration || 2000 : undefined,
    });
    setEditingId(messageToEdit.id);
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
  };

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
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            {formData.type === "text" ? (
              <Textarea id="content" name="content" value={formData.content} onChange={handleInputChange} placeholder="Enter message text..." />
            ) : (
              <Input id="content" name="content" value={formData.content} onChange={handleInputChange} placeholder="Enter audio URL..." />
            )}
          </div>

          {formData.type === "audio" && (
            <div>
              <Label htmlFor="audioDuration">Audio Duration (ms)</Label>
              <Input id="audioDuration" name="audioDuration" type="number" value={formData.audioDuration || ""} onChange={handleInputChange} placeholder="e.g., 2000" />
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
                        <p className="text-sm mt-1 break-all">
                          {item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span>Delay: {item.delayAfter}ms</span>
                          {item.type === 'audio' && item.audioDuration && <span> / Duration: {item.audioDuration}ms</span>}
                           {item.type === 'video' && item.videoDuration && <span> / Duration: {item.videoDuration}ms</span>}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 ml-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(item)} aria-label="Edit message">
                          <Edit3 size={16} />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)} aria-label="Delete message">
                          <Trash2 size={16} />
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
