"use client";

import { useState, useEffect } from "react";
import { Share2, Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

interface ShareDocumentButtonProps {
  fileId: string;
  fileName: string;
}

const ShareDocumentButton = ({ fileId, fileName }: ShareDocumentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [shareableLink, setShareableLink] = useState("");
  const { toast } = useToast();

  // Generate shareable link (only on client side)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareableLink(`${window.location.origin}/shared/${fileId}?comments=${allowComments}&download=${allowDownload}`);
    }
  }, [fileId, allowComments, allowDownload]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this document: ${fileName}`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to share this document with you: ${fileName}\n\nYou can view and chat with it here: ${shareableLink}\n\nBest regards`
    );
    if (typeof window !== "undefined") {
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Check out this document: ${fileName}\n${shareableLink}`
    );
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${text}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-green-400 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            {`Share "${fileName}" with others. They'll be able to view and chat with the document.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Share Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Share Settings</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Allow comments</Label>
                <p className="text-xs text-gray-500">Let others chat with the document</p>
              </div>
              <Switch
                checked={allowComments}
                onCheckedChange={setAllowComments}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Allow download</Label>
                <p className="text-xs text-gray-500">Let others download the PDF</p>
              </div>
              <Switch
                checked={allowDownload}
                onCheckedChange={setAllowDownload}
              />
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareableLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                onClick={copyToClipboard}
                size="sm"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Quick Share Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Share</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={shareViaEmail}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email
              </Button>
              
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                size="sm"
                className="justify-start"
              >
                <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDocumentButton;