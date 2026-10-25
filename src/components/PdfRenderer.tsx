"use client";

import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  Download,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  Eye,
  EyeOff,
  Highlighter,
  Palette,
  Eraser,
  Search,
  StickyNote,
  Save,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useToast } from "./ui/use-toast";

import { useResizeDetector } from "react-resize-detector";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useState, useEffect, useRef, useCallback } from "react";

import { useForm } from "react-hook-form";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Progress } from "./ui/progress";
import { Switch } from "./ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

import SimpleBar from "simplebar-react";
import PdfFullScreen from "./PdfFullScreen";
import { trpc } from "@/app/_trpc/client";
import { Textarea } from "./ui/textarea";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface PdfRendererProps {
  fileId: string;
  url: string;
}

interface Highlight {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  normalized: boolean;
  color: string;
  text: string;
  timestamp: number;
  note: string | null;
}

const PdfRenderer = ({ fileId, url }: PdfRendererProps) => {
  const { toast } = useToast();
  const highlightsQuery = trpc.getPdfHighlights.useQuery({ fileId });
  const [editingNoteHighlightId, setEditingNoteHighlightId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const legacyMigrationStarted = useRef(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  const createPdfHighlight = trpc.createPdfHighlight.useMutation({
    onSuccess: (highlight) => {
      setHighlights((previous) => [
        ...previous,
        {
          id: highlight.id,
          pageNumber: highlight.pageNumber,
          x: highlight.x,
          y: highlight.y,
          width: highlight.width,
          height: highlight.height,
          normalized: highlight.normalized,
          color: highlight.color,
          text: highlight.text,
          timestamp: Date.parse(String(highlight.createdAt)),
          note: highlight.note,
        },
      ]);
      toast({
        title: "Highlight added",
        description: "Your highlight has been saved to this PDF.",
      });
    },
    onError: (error) => {
      toast({
        title: "Could not save highlight",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const updatePdfHighlightNote = trpc.updatePdfHighlightNote.useMutation({
    onSuccess: (highlight) => {
      setHighlights((previous) =>
        previous.map((item) =>
          item.id === highlight.id ? { ...item, note: highlight.note } : item
        )
      );
      setEditingNoteHighlightId(null);
      toast({ title: "Note saved" });
    },
    onError: (error) => {
      toast({
        title: "Could not save note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const deletePdfHighlight = trpc.deletePdfHighlight.useMutation({
    onSuccess: (_, variables) => {
      setHighlights((previous) => previous.filter((item) => item.id !== variables.id));
      if (editingNoteHighlightId === variables.id) {
        setEditingNoteHighlightId(null);
      }
      toast({ title: "Highlight removed" });
    },
    onError: (error) => {
      toast({
        title: "Could not delete highlight",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const clearPdfHighlights = trpc.clearPdfHighlights.useMutation({
    onSuccess: (result, variables) => {
      setHighlights((previous) =>
        variables.pageNumber === undefined
          ? []
          : previous.filter((item) => item.pageNumber !== variables.pageNumber)
      );
      setEditingNoteHighlightId(null);
      toast({
        title: "Highlights cleared",
        description: `${result.deleted} highlight${result.deleted === 1 ? "" : "s"} removed.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Could not clear highlights",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const importPdfHighlights = trpc.importPdfHighlights.useMutation({
    onSuccess: (persistedHighlights) => {
      setHighlights(persistedHighlights.map((highlight) => ({
        id: highlight.id,
        pageNumber: highlight.pageNumber,
        x: highlight.x,
        y: highlight.y,
        width: highlight.width,
        height: highlight.height,
        normalized: highlight.normalized,
        color: highlight.color,
        text: highlight.text,
        timestamp: Date.parse(String(highlight.createdAt)),
        note: highlight.note,
      })));
      localStorage.removeItem(`pdf-highlights-${url}`);
    },
    onError: (error) => {
      toast({
        title: "Could not migrate saved highlights",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Core PDF state
  const [numPages, setNumPages] = useState<number>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [renderedScale, setRenderedScale] = useState<number | null>(null);

  // Highlighting functionality
  const [isHighlightMode, setIsHighlightMode] = useState<boolean>(false);
  const [currentHighlightColor, setCurrentHighlightColor] = useState<string>("#CCFBF1");
  const [selectedHighlight, setSelectedHighlight] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);

  // Theme and UI state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showHighlights, setShowHighlights] = useState<boolean>(false);
  const [readingProgress, setReadingProgress] = useState<number>(0);

  const isLoading = renderedScale !== scale;
  const pageContainerRef = useRef<HTMLDivElement>(null);
  
  // Separate refs for desktop and mobile
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  // Use resize detector with separate refs
  const { width: desktopWidth } = useResizeDetector({
    targetRef: desktopContainerRef,
    handleHeight: false,
    refreshMode: 'debounce',
    refreshRate: 200,
  });

  const { width: mobileWidth } = useResizeDetector({
    targetRef: mobileContainerRef,
    handleHeight: false,
    refreshMode: 'debounce',
    refreshRate: 200,
  });

  // Highlight colors
  const highlightColors = [
    { name: "Teal", value: "#CCFBF1", bg: "bg-teal-100" },
    { name: "Yellow", value: "#ffeb3b", bg: "bg-yellow-300" },
    { name: "Green", value: "#4caf50", bg: "bg-green-300" },
    { name: "Blue", value: "#2196f3", bg: "bg-blue-300" },
    { name: "Pink", value: "#e91e63", bg: "bg-pink-300" },
    { name: "Orange", value: "#ff9800", bg: "bg-orange-300" },
    { name: "Purple", value: "#9c27b0", bg: "bg-purple-300" },
  ];

  const CustomPageValidator = z.object({
    page: z
      .string()
      .refine((num) => Number(num) > 0 && Number(num) <= (numPages || 1)),
  });

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCustomPageValidator>({
    defaultValues: {
      page: "1",
    },
    resolver: zodResolver(CustomPageValidator),
  });

  // Load saved preferences
  useEffect(() => {
    if (highlightsQuery.error) {
      toast({
        title: "Could not load highlights",
        description: highlightsQuery.error.message,
        variant: "destructive",
      });
    }
  }, [highlightsQuery.error, toast]);

  useEffect(() => {
    const syncTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (
      highlightsQuery.isLoading ||
      highlightsQuery.data === undefined ||
      legacyMigrationStarted.current
    ) {
      return;
    }

    legacyMigrationStarted.current = true;

    if (highlightsQuery.data.length > 0) {
      setHighlights(highlightsQuery.data.map((highlight) => ({
        id: highlight.id,
        pageNumber: highlight.pageNumber,
        x: highlight.x,
        y: highlight.y,
        width: highlight.width,
        height: highlight.height,
        normalized: highlight.normalized,
        color: highlight.color,
        text: highlight.text,
        timestamp: Date.parse(String(highlight.createdAt)),
        note: highlight.note,
      })));
      localStorage.removeItem(`pdf-highlights-${url}`);
      return;
    }

    const savedHighlights = localStorage.getItem(`pdf-highlights-${url}`);
    if (!savedHighlights) {
      setHighlights([]);
      return;
    }

    try {
      const legacyHighlights = JSON.parse(savedHighlights) as Highlight[];
      if (!Array.isArray(legacyHighlights) || legacyHighlights.length === 0) {
        localStorage.removeItem(`pdf-highlights-${url}`);
        setHighlights([]);
        return;
      }
      importPdfHighlights.mutate({ fileId, highlights: legacyHighlights });
    } catch (error) {
      console.error("Error parsing saved highlights:", error);
      toast({
        title: "Could not restore saved highlights",
        description: "The saved highlight data in this browser is invalid.",
        variant: "destructive",
      });
    }
  }, [
    fileId,
    highlightsQuery.data,
    highlightsQuery.isLoading,
    importPdfHighlights,
    toast,
    url,
  ]);

  // Update reading progress
  useEffect(() => {
    if (numPages) {
      setReadingProgress((currentPage / numPages) * 100);
    }
  }, [currentPage, numPages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case 'h':
        case 'H':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsHighlightMode(!isHighlightMode);
          }
          break;
        case 'Escape':
          setIsHighlightMode(false);
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);
          break;
        case 'ArrowLeft':
          if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
            setValue("page", String(currentPage - 1));
          }
          break;
        case 'ArrowRight':
          if (numPages && currentPage < numPages) {
            setCurrentPage(prev => prev + 1);
            setValue("page", String(currentPage + 1));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, numPages, setValue, isHighlightMode]);

  const handlePageSubmit = ({ page }: TCustomPageValidator) => {
    setCurrentPage(Number(page));
    setValue("page", String(page));
  };

  // Handle mouse events for highlighting
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isHighlightMode || !pageContainerRef.current) return;
    
    const rect = pageContainerRef.current.getBoundingClientRect();
    setIsSelecting(true);
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setSelectionEnd(null);
  }, [isHighlightMode]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !pageContainerRef.current) return;
    
    const rect = pageContainerRef.current.getBoundingClientRect();
    setSelectionEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [isSelecting, selectionStart]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selectionStart || !selectionEnd) {
      setIsSelecting(false);
      return;
    }

    const pageBounds = pageContainerRef.current?.getBoundingClientRect();
    if (!pageBounds?.width || !pageBounds.height) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    const startX = Math.min(Math.max(selectionStart.x, 0), pageBounds.width);
    const endX = Math.min(Math.max(selectionEnd.x, 0), pageBounds.width);
    const startY = Math.min(Math.max(selectionStart.y, 0), pageBounds.height);
    const endY = Math.min(Math.max(selectionEnd.y, 0), pageBounds.height);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    if (width > 10 && height > 10) {
      createPdfHighlight.mutate({
        fileId,
        pageNumber: currentPage,
        x: Math.min(startX, endX) / pageBounds.width,
        y: Math.min(startY, endY) / pageBounds.height,
        width: width / pageBounds.width,
        height: height / pageBounds.height,
        color: currentHighlightColor,
      });
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, [
    createPdfHighlight,
    fileId,
    isSelecting,
    selectionStart,
    selectionEnd,
    currentPage,
    currentHighlightColor,
  ]);

  // Delete highlight
  const deleteHighlight = (highlightId: string) => {
    setSelectedHighlight(null);
    deletePdfHighlight.mutate({ id: highlightId });
  };

  // Clear all highlights for current page
  const clearPageHighlights = () => {
    clearPdfHighlights.mutate({ fileId, pageNumber: currentPage });
  };

  // Clear all highlights
  const clearAllHighlights = () => {
    clearPdfHighlights.mutate({ fileId });
  };

  const openHighlightNote = (highlight: Highlight) => {
    setEditingNoteHighlightId(highlight.id);
    setNoteDraft(highlight.note ?? "");
  };

  const saveHighlightNote = (highlightId: string) => {
    updatePdfHighlightNote.mutate({ id: highlightId, note: noteDraft });
  };

  // Navigate to highlight
  const navigateToHighlight = (highlight: Highlight) => {
    if (highlight.pageNumber !== currentPage) {
      setCurrentPage(highlight.pageNumber);
      setValue("page", String(highlight.pageNumber));
    }
    setSelectedHighlight(highlight.id);
    setShowHighlights(false);
  };

  // Download functionality
  const handleDownload = async () => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "PDF download has begun",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the PDF",
        variant: "destructive",
      });
    }
  };

  // Share functionality
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PDF Document',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Document link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Share Failed",
          description: "Could not copy link to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const currentPageHighlights = highlights.filter(h => h.pageNumber === currentPage);

  return (
    <TooltipProvider>
      <div className={cn(
        "w-full rounded-md sm:rounded-2xl shadow-lg sm:shadow-2xl flex flex-col border transition-all duration-500 hover:shadow-xl sm:hover:shadow-3xl",
        isDarkMode 
          ? "bg-gray-900/95 border-gray-700 backdrop-blur-xl" 
          : "bg-white/95 border-zinc-100 backdrop-blur-xl"
      )}>
        {/* Reading Progress Bar - Hidden on Mobile */}
        <div className="relative w-full h-1 rounded-t-md sm:rounded-t-2xl overflow-hidden hidden sm:block">
          <Progress 
            value={readingProgress} 
            className={cn(
              "h-full transition-all duration-300",
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            )} 
          />
          <div className="absolute inset-0 bg-teal-700" style={{ width: `${readingProgress}%` }} />
        </div>

        {/* Header */}
        <div className={cn(
          "h-12 sm:h-16 w-full border-b flex items-center justify-between px-2 sm:px-4 rounded-t-md sm:rounded-t-2xl",
          isDarkMode 
            ? "bg-gray-800/90 border-gray-700 text-gray-100 [&_button:hover]:bg-gray-700 [&_button:hover]:text-white [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-teal-300"
            : "bg-[#F8FAFA] border-zinc-200 text-slate-700"
        )}>
          {/* Left Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage((prev) => Math.max(1, prev - 1));
                setValue("page", String(Math.max(1, currentPage - 1)));
              }}
              variant="ghost"
              size="sm"
              className="p-1.5 sm:p-2 hover:bg-teal-50 active:scale-95 transition-all duration-200"
              aria-label="previous page"
            >
              <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <Input
                {...register("page")}
                className={cn(
                  "w-8 sm:w-12 h-6 sm:h-8 text-xs sm:text-sm text-center font-semibold rounded-[10px] border focus:ring-2 focus:ring-teal-700 transition-all duration-200",
                  isDarkMode 
                    ? "bg-gray-700 border-gray-600 text-white" 
                    : "bg-white border-zinc-200",
                  errors.page && "focus-visible:ring-red-500"
                )}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit(handlePageSubmit)();
                  }
                }}
              />
              <p className={cn("text-zinc-700 text-xs sm:text-sm space-x-1", isDarkMode ? "text-gray-300" : "text-zinc-700")}>
                <span>/</span>
                <span>{numPages ?? "x"}</span>
              </p>
            </div>

            <Button
              disabled={numPages === undefined || currentPage === numPages}
              onClick={() => {
                const nextPage = Math.min(numPages || 1, currentPage + 1);
                setCurrentPage(nextPage);
                setValue("page", String(nextPage));
              }}
              variant="ghost"
              size="sm"
              className="p-1.5 sm:p-2 hover:bg-teal-50 active:scale-95 transition-all duration-200"
              aria-label="next page"
            >
              <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile: Simplified Controls */}
            <div className="md:hidden flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-1 sm:gap-1.5 text-xs sm:text-sm" aria-label="zoom" variant="ghost" size="sm">
                    <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                    {Math.round(scale * 100)}%
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setScale(0.5)}>
                    50%
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(0.75)}>
                    75%
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(1)}>
                    100%
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(1.25)}>
                    125%
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(1.5)}>
                    150%
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(2)}>
                    200%
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => setRotation((prev) => prev + 90)}
                variant="ghost"
                aria-label="rotate 90 degrees"
                size="sm"
                className="p-1.5 sm:p-2"
              >
                <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              <PdfFullScreen fileUrl={url} highlights={highlights} />
              {highlights.length > 0 && (
                <Button
                  onClick={() => setShowHighlights((visible) => !visible)}
                  variant="ghost"
                  size="sm"
                  aria-label="show highlights and notes"
                  className={cn(
                    "rounded-full transition-colors",
                    showHighlights && (isDarkMode
                      ? "bg-teal-400/20 text-teal-100 ring-1 ring-teal-300"
                      : "bg-teal-50 text-teal-800 ring-1 ring-teal-700")
                  )}
                >
                  <StickyNote className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Desktop: Full Controls */}
            <div className="hidden md:flex items-center gap-1">
              {/* Highlight Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIsHighlightMode(!isHighlightMode)}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "rounded-full transition-colors",
                      isHighlightMode && (isDarkMode
                        ? "bg-teal-400/20 text-teal-100 ring-1 ring-teal-300"
                        : "bg-teal-50 text-teal-800 ring-1 ring-teal-700")
                    )}
                  >
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Highlight Mode (Ctrl+H)</TooltipContent>
              </Tooltip>

              {/* Color Picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full transition-all duration-200"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={isDarkMode ? "bg-gray-800 border-gray-700 text-gray-100 [&_[role=menuitem]:focus]:bg-gray-700 [&_[role=menuitem]:focus]:text-white" : ""}>
                  <div className="p-2">
                    <div className="text-xs font-medium mb-2 text-center">Highlight Colors</div>
                    <div className="grid grid-cols-3 gap-2">
                      {highlightColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setCurrentHighlightColor(color.value)}
                          className={cn(
                            "w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110",
                            currentHighlightColor === color.value 
                              ? "ring-2 ring-teal-700 scale-110" 
                              : "hover:ring-1 hover:ring-gray-300"
                          )}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Highlights Panel Toggle */}
              {highlights.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowHighlights(!showHighlights)}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "rounded-full transition-all duration-200",
                        showHighlights && (isDarkMode
                          ? "bg-teal-400/20 text-teal-100 ring-1 ring-teal-300"
                          : "bg-teal-50 text-teal-800 ring-1 ring-teal-700")
                      )}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Show all highlights</TooltipContent>
                </Tooltip>
              )}

              {/* Zoom Controls */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="gap-1.5 rounded-[10px] hover:bg-teal-50 active:scale-95 transition-all duration-200"
                    variant="ghost"
                    size="sm"
                  >
                    {scale <= 0.75 ? (
                      <ZoomOut className="h-4 w-4" />
                    ) : scale >= 1.5 ? (
                      <ZoomIn className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    {Math.round(scale * 100)}%
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={isDarkMode ? "bg-gray-800 border-gray-700 text-gray-100 [&_[role=menuitem]:focus]:bg-gray-700 [&_[role=menuitem]:focus]:text-white" : ""}>
                  <DropdownMenuItem onSelect={() => setScale(0.5)}>
                    <ZoomOut className="mr-2 h-4 w-4" />
                    50%
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(0.75)}>75%</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(1)}>100%</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(1.25)}>125%</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(1.5)}>150%</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(2)}>
                    <ZoomIn className="mr-2 h-4 w-4" />
                    200%
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setScale(2.5)}>250%</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className={isDarkMode ? "bg-gray-800 border-gray-700 text-gray-100 [&_[role=menuitem]:focus]:bg-gray-700 [&_[role=menuitem]:focus]:text-white" : ""}>
                  <DropdownMenuItem onClick={() => setRotation((prev) => (prev + 90) % 360)}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Rotate
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={clearPageHighlights}
                    disabled={currentPageHighlights.length === 0}
                  >
                    <Eraser className="mr-2 h-4 w-4" />
                    Clear Page Highlights
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={clearAllHighlights}
                    disabled={highlights.length === 0}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear All Highlights
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => setIsDarkMode(!isDarkMode)}>
                    {isDarkMode ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <PdfFullScreen fileUrl={url} highlights={highlights} />
            </div>
          </div>
        </div>

        {/* Desktop: Highlights Panel */}
        {showHighlights && highlights.length > 0 && (
          <div className={cn(
            "border-b p-2 sm:p-4 animate-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto",
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className={cn("text-sm sm:text-base font-semibold", isDarkMode ? "text-white" : "text-gray-900")}>
                All Highlights
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHighlights(false)}
                className="p-1 sm:p-2"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <div className="space-y-1 sm:space-y-2">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className={cn(
                    "p-2 sm:p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                    selectedHighlight === highlight.id 
                      ? "border-teal-300 bg-teal-50" 
                      : isDarkMode 
                        ? "border-gray-600 bg-gray-700 hover:bg-gray-600" 
                        : "border-gray-200 bg-white hover:bg-gray-50"
                  )}
                  onClick={() => navigateToHighlight(highlight)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div 
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded border"
                        style={{ backgroundColor: highlight.color }}
                      />
                      <div>
                        <div className="text-xs sm:text-sm font-medium">
                          Page {highlight.pageNumber}
                        </div>
                        <div className="text-xs text-gray-500 hidden sm:block">
                          {new Date(highlight.timestamp).toLocaleDateString()}
                        </div>
                        {highlight.note && (
                          <div className="mt-1 max-w-48 truncate text-xs text-gray-600">
                            {highlight.note}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateToHighlight(highlight);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (editingNoteHighlightId === highlight.id) {
                            setEditingNoteHighlightId(null);
                          } else {
                            openHighlightNote(highlight);
                          }
                        }}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-6 w-6 p-0",
                          highlight.note ? "text-teal-800" : "text-gray-500"
                        )}
                        title={highlight.note ? "Edit note" : "Add note"}
                        aria-label={highlight.note ? "Edit note" : "Add note"}
                      >
                        <StickyNote className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHighlight(highlight.id);
                        }}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  {editingNoteHighlightId === highlight.id && (
                    <div
                      className="mt-3 w-full space-y-2"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Textarea
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        placeholder="Add a note about this highlight..."
                        maxLength={5000}
                        minRows={2}
                        maxRows={6}
                        aria-label={`Note for highlight on page ${highlight.pageNumber}`}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {noteDraft.length}/5000
                        </span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setEditingNoteHighlightId(null)}
                            variant="ghost"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => saveHighlightNote(highlight.id)}
                            disabled={updatePdfHighlightNote.isPending || noteDraft.length > 5000}
                            size="sm"
                          >
                            <Save className="mr-1 h-3 w-3" />
                            Save note
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF Viewer */}
        <div className="flex-1 max-h-screen overflow-auto">
          {/* Desktop: Scrollable PDF with SimpleBar */}
          <div className="hidden md:block">
            <SimpleBar 
              autoHide={false} 
              className="max-h-[calc(100vh-10rem)]"
              style={{ 
                background: isDarkMode ? '#1f2937' : '#f9fafb'
              }}
            >
              <div ref={desktopContainerRef} className="p-4">
                <Document
                  loading={
                    <div className="flex flex-col items-center justify-center py-24">
                      <div className="relative">
                        <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
                      </div>
                      <p className={cn(
                        "mt-4 font-medium animate-pulse",
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      )}>
                        Loading PDF...
                      </p>
                    </div>
                  }
                  onLoadError={() => {
                    toast({
                      title: "Error loading PDF",
                      description: "Please try again later",
                      variant: "destructive",
                    });
                  }}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  file={url}
                  className="max-h-full"
                >
                  {isLoading && renderedScale ? (
                    <Page
                      width={desktopWidth ? desktopWidth : 1}
                      pageNumber={currentPage}
                      scale={scale}
                      rotate={rotation}
                      key={"@" + renderedScale}
                      className="opacity-0 transition-opacity duration-500"
                    />
                  ) : null}

                  <div 
                    ref={pageContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    style={{ cursor: isHighlightMode ? 'crosshair' : 'default' }}
                    className="relative"
                  >
                    <Page
                      className={cn(
                        "transition-all duration-500 rounded-xl shadow-lg hover:shadow-xl border mx-auto",
                        isDarkMode ? "border-gray-700" : "border-white",
                        isLoading 
                          ? "opacity-0 scale-95" 
                          : "opacity-100 scale-100 animate-in fade-in-0 zoom-in-95 duration-300"
                      )}
                      width={desktopWidth ? desktopWidth : 1}
                      pageNumber={currentPage}
                      scale={scale}
                      rotate={rotation}
                      key={"@" + scale}
                      loading={
                        <div className="flex flex-col items-center justify-center py-24">
                          <div className="relative">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
                          </div>
                          <p className={cn(
                            "mt-4 font-medium animate-pulse",
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          )}>
                            Rendering page...
                          </p>
                        </div>
                      }
                      onRenderSuccess={() => {
                        setRenderedScale(scale);
                      }}
                    />

                    {/* Selection Preview */}
                    {isSelecting && selectionStart && selectionEnd && (
                      <div
                        className="absolute border-2 border-dashed border-teal-700 rounded pointer-events-none"
                        style={{
                          left: Math.min(selectionStart.x, selectionEnd.x),
                          top: Math.min(selectionStart.y, selectionEnd.y),
                          width: Math.abs(selectionEnd.x - selectionStart.x),
                          height: Math.abs(selectionEnd.y - selectionStart.y),
                          backgroundColor: currentHighlightColor + '40',
                          zIndex: 20,
                        }}
                      />
                    )}

                    {/* Existing Highlights */}
                    {currentPageHighlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className={cn(
                          "absolute border rounded cursor-pointer transition-all duration-200 hover:scale-105",
                          selectedHighlight === highlight.id 
                            ? "border-2 border-teal-700 shadow-sm" 
                            : "border border-transparent hover:border-gray-300"
                        )}
                        style={{
                          left: highlight.normalized ? `${highlight.x * 100}%` : highlight.x,
                          top: highlight.normalized ? `${highlight.y * 100}%` : highlight.y,
                          width: highlight.normalized ? `${highlight.width * 100}%` : highlight.width,
                          height: highlight.normalized ? `${highlight.height * 100}%` : highlight.height,
                          backgroundColor: highlight.color + '60',
                          zIndex: 10,
                        }}
                        onClick={() => setSelectedHighlight(
                          selectedHighlight === highlight.id ? null : highlight.id
                        )}
                        title={`Highlight from ${new Date(highlight.timestamp).toLocaleDateString()}`}
                      />
                    ))}
                  </div>
                </Document>
              </div>
            </SimpleBar>
          </div>

          {/* Mobile:  (Non-scrollable, single page) */}
          <div className="md:hidden">
            <div 
              className="p-2"
              style={{ 
                background: isDarkMode ? '#1f2937' : '#f9fafb'
              }}
            >
              <div ref={mobileContainerRef}>
                <Document
                  loading={
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="relative">
                        <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
                      </div>
                      <p className={cn(
                        "mt-2 text-sm font-medium animate-pulse",
                        isDarkMode ? "text-gray-300" : "text-gray-600"
                      )}>
                        Loading PDF...
                      </p>
                    </div>
                  }
                  onLoadError={() => {
                    toast({
                      title: "Error loading PDF",
                      description: "Please try again later",
                      variant: "destructive",
                    });
                  }}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  file={url}
                  className="max-h-full"
                >
                  {isLoading && renderedScale ? (
                    <Page
                      width={mobileWidth ? Math.min(mobileWidth, 300) : 300}
                      pageNumber={currentPage}
                      scale={scale}
                      rotate={rotation}
                      key={"@" + renderedScale}
                      className="opacity-0 transition-opacity duration-500"
                    />
                  ) : null}

                  <div 
                    ref={pageContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    style={{ cursor: isHighlightMode ? 'crosshair' : 'default' }}
                    className="relative"
                  >
                    <Page
                      className={cn(
                        "transition-all duration-500 rounded-lg shadow-lg hover:shadow-xl border mx-auto",
                        isDarkMode ? "border-gray-700" : "border-white",
                        isLoading 
                          ? "opacity-0 scale-95" 
                          : "opacity-100 scale-100 animate-in fade-in-0 zoom-in-95 duration-300"
                      )}
                      width={mobileWidth ? Math.min(mobileWidth, 300) : 300}
                      pageNumber={currentPage}
                      scale={scale}
                      rotate={rotation}
                      key={"@" + scale}
                      loading={
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="relative">
                            <Loader2 className="h-6 w-6 animate-spin text-teal-700" />
                          </div>
                          <p className={cn(
                            "mt-2 text-sm font-medium animate-pulse",
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          )}>
                            Rendering page...
                          </p>
                        </div>
                      }
                      onRenderSuccess={() => {
                        setRenderedScale(scale);
                      }}
                    />

                    {/* Selection Preview */}
                    {isSelecting && selectionStart && selectionEnd && (
                      <div
                        className="absolute border-2 border-dashed border-teal-700 rounded pointer-events-none"
                        style={{
                          left: Math.min(selectionStart.x, selectionEnd.x),
                          top: Math.min(selectionStart.y, selectionEnd.y),
                          width: Math.abs(selectionEnd.x - selectionStart.x),
                          height: Math.abs(selectionEnd.y - selectionStart.y),
                          backgroundColor: currentHighlightColor + '40',
                          zIndex: 20,
                        }}
                      />
                    )}

                    {/* Existing Highlights */}
                    {currentPageHighlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className={cn(
                          "absolute border rounded cursor-pointer transition-all duration-200 hover:scale-105",
                          selectedHighlight === highlight.id 
                            ? "border-2 border-teal-700 shadow-sm" 
                            : "border border-transparent hover:border-gray-300"
                        )}
                        style={{
                          left: highlight.normalized ? `${highlight.x * 100}%` : highlight.x,
                          top: highlight.normalized ? `${highlight.y * 100}%` : highlight.y,
                          width: highlight.normalized ? `${highlight.width * 100}%` : highlight.width,
                          height: highlight.normalized ? `${highlight.height * 100}%` : highlight.height,
                          backgroundColor: highlight.color + '60',
                          zIndex: 10,
                        }}
                        onClick={() => setSelectedHighlight(
                          selectedHighlight === highlight.id ? null : highlight.id
                        )}
                        title={`Highlight from ${new Date(highlight.timestamp).toLocaleDateString()}`}
                      />
                    ))}
                  </div>
                </Document>
              </div>
            </div>
          </div>

          {/* Floating Highlight Button - Mobile Only */}
          <div className="absolute bottom-2 right-2 md:hidden">
            <Button
              size="sm"
              onClick={() => setIsHighlightMode((active) => !active)}
              aria-label={isHighlightMode ? "Turn off highlight mode" : "Turn on highlight mode"}
              className={cn(
                "rounded-full transition-colors h-8 w-8 p-0",
                isHighlightMode
                  ? "bg-teal-50 text-teal-800 ring-1 ring-teal-700"
                  : "bg-teal-700 text-white hover:bg-teal-800"
              )}
            >
              <Highlighter className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className={cn(
          "h-6 sm:h-8 px-2 sm:px-4 flex items-center justify-between text-xs border-t rounded-b-md sm:rounded-b-2xl",
          isDarkMode 
            ? "bg-gray-800 border-gray-700 text-gray-400" 
            : "bg-gray-50 border-gray-200 text-gray-500"
        )}>
          <div className="flex items-center gap-2 sm:gap-4">
            <span>Page {currentPage} of {numPages || "∞"}</span>
            <span className="hidden sm:inline">Scale: {Math.round(scale * 100)}%</span>
            {rotation > 0 && <span className="hidden sm:inline">Rotated: {rotation}°</span>}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-1">
              {isDarkMode ? <Moon className="h-2 w-2 sm:h-3 sm:w-3" /> : <Sun className="h-2 w-2 sm:h-3 sm:w-3" />}
              <span className="hidden sm:inline">{isDarkMode ? "Dark" : "Light"}</span>
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PdfRenderer;