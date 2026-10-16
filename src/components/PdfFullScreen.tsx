"use client";

import { Expand, Loader2 } from "lucide-react";
import { useState } from "react";
import { Document, Page } from "react-pdf";
import { useResizeDetector } from "react-resize-detector";
import SimpleBar from "simplebar-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { useToast } from "./ui/use-toast";

interface PdfFullScreenProps {
  fileUrl: string;
  highlights: {
    id: string;
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    normalized: boolean;
    color: string;
    note: string | null;
  }[];
}

const PdfFullScreen = ({ fileUrl, highlights }: PdfFullScreenProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const {toast} = useToast();
  const { width, ref } = useResizeDetector();
  const [numPages, setNumPages] = useState<number>();
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v);
        }
      }}
    >
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        <Button variant="ghost" aria-label="fullscreen">
          <Expand className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-full">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)] mt-6">
          <div ref={ref}>
            <Document
              loading={
                <div className="flex justify-center">
                  <Loader2 className="my-24 h-6 w-6 animate-spin" />
                </div>
              }
              file={fileUrl}
              className="max-h-full"
              onLoadError={() => {
                toast({
                  title: "Error loading pdf",
                  description: "Please try again later",
                  variant: "destructive",
                });
              }}
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages);
              }}
            >
              {new Array(numPages).fill(0).map((_, i) => {
                const pageNumber = i + 1;
                return (
                  <div key={pageNumber} className="relative mx-auto w-fit">
                    <Page width={width ? width : 1} pageNumber={pageNumber} />
                    {highlights
                      .filter((highlight) => highlight.pageNumber === pageNumber)
                      .map((highlight) => (
                        <div
                          key={highlight.id}
                          className="pointer-events-none absolute rounded"
                          style={{
                            left: highlight.normalized ? `${highlight.x * 100}%` : highlight.x,
                            top: highlight.normalized ? `${highlight.y * 100}%` : highlight.y,
                            width: highlight.normalized ? `${highlight.width * 100}%` : highlight.width,
                            height: highlight.normalized ? `${highlight.height * 100}%` : highlight.height,
                            backgroundColor: `${highlight.color}60`,
                          }}
                          title={highlight.note ?? undefined}
                        />
                      ))}
                  </div>
                );
              })}
            </Document>
          </div>
        </SimpleBar>
      </DialogContent>
    </Dialog>
  );
}

export default PdfFullScreen