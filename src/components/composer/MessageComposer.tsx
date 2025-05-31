
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
import { XCircle, Edit3, Trash2, PlusCircle, FileUp, FileSpreadsheet } from "lucide-react";
import NextImage from "next/image";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";


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

const VALID_MESSAGE_TYPES: MessageType[] = ["text", "audio", "image", "gif", "sticker", "video"];
const VALID_SENDERS: MessageSender[] = ["me", "friend"];

export default function MessageComposer({ queue, setQueue }: MessageComposerProps) {
  const [formData, setFormData] = useState<Omit<MessageQueueItem, "id">>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
          toast({ title: "Validation Error", description: "Content URL/DataURI or duration is required for audio message type.", variant: "destructive" });
          return;
        }
        if (formData.type === 'video' && !formData.videoDuration && !formData.content) {
          toast({ title: "Validation Error", description: "Content URL/DataURI or duration is required for video message type.", variant: "destructive" });
          return;
        }
        if (formData.type !== 'text' && formData.type !== 'audio' && formData.type !== 'video' && !formData.content) {
          toast({ title: "Validation Error", description: `Content URL/DataURI is required for message type: ${formData.type}.`, variant: "destructive" });
          return;
        }
    }

    if (editingId) {
      setQueue(queue.map(item => item.id === editingId ? { ...formData, id: editingId } : item));
      toast({ title: "Message Updated", description: "The message has been updated in the queue." });
    } else {
      const newItemId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
      setQueue([...queue, { ...formData, id: newItemId }]);
      toast({ title: "Message Added", description: "The new message has been added to the queue." });
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
    toast({ title: "Message Deleted", description: "The message has been removed from the queue." });
  };

  const handleClearQueue = () => {
    setQueue([]);
    resetForm();
    toast({ title: "Queue Cleared", description: "All messages have been removed from the queue." });
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

  const handleExcelImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          toast({ title: "Import Error", description: "Could not read file data.", variant: "destructive" });
          return;
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const newQueue: MessageQueueItem[] = [];
        const errors: string[] = [];

        json.forEach((row, index) => {
          const sender = row.sender?.toString().toLowerCase() as MessageSender;
          const type = row.type?.toString().toLowerCase() as MessageType;
          const content = row.content?.toString() || "";
          const delayAfter = parseInt(row.delayAfter, 10);
          const audioDuration = row.audioDuration ? parseInt(row.audioDuration, 10) : undefined;
          const videoDuration = row.videoDuration ? parseInt(row.videoDuration, 10) : undefined;

          let rowIsValid = true;

          if (!VALID_SENDERS.includes(sender)) {
            errors.push(`Row ${index + 2}: Invalid sender '${row.sender}'. Must be 'me' or 'friend'.`);
            rowIsValid = false;
          }
          if (!VALID_MESSAGE_TYPES.includes(type)) {
            errors.push(`Row ${index + 2}: Invalid type '${row.type}'.`);
            rowIsValid = false;
          }
          if (!content && type !== 'audio' && type !== 'video') { // audio/video can have 0 content if duration is set for "me"
             if (!content && !(type === 'audio' && audioDuration) && !(type === 'video' && videoDuration)) {
                errors.push(`Row ${index + 2}: Content is required for type '${type}'.`);
                rowIsValid = false;
             }
          }
          if (isNaN(delayAfter) || delayAfter < 0) {
            errors.push(`Row ${index + 2}: Invalid 'delayAfter' value '${row.delayAfter}'. Must be a non-negative number.`);
            rowIsValid = false;
          }
          if (type === 'audio' && audioDuration !== undefined && (isNaN(audioDuration) || audioDuration < 0)) {
            errors.push(`Row ${index + 2}: Invalid 'audioDuration' value '${row.audioDuration}'. Must be a non-negative number.`);
            rowIsValid = false;
          }
          if (type === 'video' && videoDuration !== undefined && (isNaN(videoDuration) || videoDuration < 0)) {
            errors.push(`Row ${index + 2}: Invalid 'videoDuration' value '${row.videoDuration}'. Must be a non-negative number.`);
            rowIsValid = false;
          }
          
          if (type !== 'text' && !content.match(/^(data:|https?:\/\/)/i) && type !== 'audio' && type !== 'video') {
             errors.push(`Row ${index + 2}: Content for media type '${type}' must be a URL or Data URI.`);
             rowIsValid = false;
          }


          if (rowIsValid) {
            newQueue.push({
              id: Date.now().toString() + Math.random().toString(36).substring(2, 7) + index,
              sender,
              type,
              content,
              delayAfter,
              audioDuration: type === 'audio' ? audioDuration : undefined,
              videoDuration: type === 'video' ? videoDuration : undefined,
            });
          }
        });

        if (errors.length > 0) {
          toast({
            title: "Import Failed with Errors",
            description: (
              <ScrollArea className="h-20">
                <ul className="list-disc pl-5">
                  {errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </ScrollArea>
            ),
            variant: "destructive",
            duration: 10000,
          });
        } else if (newQueue.length === 0 && json.length > 0) {
            toast({ title: "Import Warning", description: "No valid messages found in the Excel file.", variant: "default" });
        }
         else if (newQueue.length > 0) {
          setQueue(newQueue);
          toast({ title: "Import Successful", description: `${newQueue.length} messages imported.` });
        } else {
          toast({ title: "Import Info", description: "Excel file was empty or contained no data.", variant: "default" });
        }

      } catch (error) {
        console.error("Error importing Excel file:", error);
        toast({ title: "Import Error", description: "Failed to process the Excel file. Ensure it's a valid .xlsx or .xls file and matches the template.", variant: "destructive" });
      } finally {
        // Reset file input
        if (excelFileInputRef.current) {
          excelFileInputRef.current.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const isMediaUploaded = formData.content.startsWith("data:");

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle>Message Queue Composer</CardTitle>
        <CardDescription>Create, manage, or import the sequence of messages for the simulation.</CardDescription>
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
                  placeholder={`Enter ${formData.type} URL or Data URI...`}
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
          <div className="flex justify-between items-center mb-2 pt-4 border-t">
             <Label htmlFor="excel-file-input" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer">
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Queue from Excel
            </Label>
            <Input
                id="excel-file-input"
                ref={excelFileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelImport}
                className="hidden"
            />
            {queue.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearQueue}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear All ({queue.length})
              </Button>
            )}
          </div>
          {queue.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">The message queue is empty. Add some messages or import from Excel to get started!</p>
          ) : (
            <ScrollArea className="flex-grow border rounded-md">
              <div className="p-4 space-y-3">
                {queue.map((item) => (
                  <Card key={item.id} className="p-3 bg-card/50">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium">
                          <span className={`capitalize px-2 py-0.5 rounded-full text-xs mr-2 ${item.sender === 'me' ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'}`}>
                            {item.sender}
                          </span>
                          <span className="capitalize text-muted-foreground">({item.type})</span>
                        </p>
                        <p className="text-sm mt-1 truncate" title={item.content.startsWith("data:") ? "[Uploaded File]" : item.content}>
                          {item.content.startsWith("data:") ? `[Uploaded ${item.type}]` : item.content}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span>Delay: {item.delayAfter}ms</span>
                          {item.type === 'audio' && typeof item.audioDuration === 'number' && <span> / Duration: {item.audioDuration}ms</span>}
                          {item.type === 'video' && typeof item.videoDuration === 'number' && <span> / Duration: {item.videoDuration}ms</span>}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-1 flex-shrink-0">
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

