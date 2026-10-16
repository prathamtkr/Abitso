"use client";

import { trpc } from "@/app/_trpc/client";
import UploadButton from "./UploadButton";
import {
  Ghost,
  Loader2,
  MessageSquare,
  TrashIcon,
  FileText,
  Eye,
  Calendar,
  Zap,
  TrendingUp,
  Filter,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Star,
  Share2,
  Edit3,
  Save,
  X,
  Palette,
  Type,
  Image as ImageIcon
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useState, useEffect, useMemo } from "react";
import BubbleBurst from "./BubbleBurst";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "./ui/use-toast";

export const metadata = {
  title: "Lexinote – Dashboard",
  description: "Your Lexinote dashboard.",
};

type ViewMode = "grid" | "list";
type SortBy = "newest" | "oldest" | "name";
type FilterBy = "all" | "processing" | "success" | "failed";

// File icon options
const FILE_ICONS = [
  { icon: FileText, name: "Document", color: "blue" },
  { icon: Star, name: "Important", color: "yellow" },
  { icon: Zap, name: "Quick", color: "purple" },
  { icon: TrendingUp, name: "Report", color: "green" },
  { icon: MessageSquare, name: "Chat", color: "indigo" },
];

// Color themes
const COLOR_THEMES = [
  { name: "Blue", gradient: "from-blue-500 via-blue-600 to-indigo-500", bg: "bg-blue-100", text: "text-blue-600" },
  { name: "Purple", gradient: "from-purple-500 via-purple-600 to-indigo-500", bg: "bg-purple-100", text: "text-purple-600" },
  { name: "Green", gradient: "from-green-500 via-emerald-600 to-teal-500", bg: "bg-green-100", text: "text-green-600" },
  { name: "Red", gradient: "from-red-500 via-rose-600 to-pink-500", bg: "bg-red-100", text: "text-red-600" },
  { name: "Yellow", gradient: "from-yellow-500 via-orange-600 to-red-500", bg: "bg-yellow-100", text: "text-yellow-600" },
  { name: "Indigo", gradient: "from-indigo-500 via-purple-600 to-pink-500", bg: "bg-indigo-100", text: "text-indigo-600" },
];

const Dashboard = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const { data: userSettings } = trpc.getUserSettings.useQuery();
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<string | null>(null);
  const [burstingFileId, setBurstingFileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);
  const [editingFile, setEditingFile] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", iconIndex: 0, colorIndex: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: files, isLoading } = trpc.getUserFiles.useQuery();
  const utils = trpc.useUtils();

  const { mutate: deleteFile } = trpc.deleteFile.useMutation({
    onSuccess: () => {
      utils.getUserFiles.invalidate();
    },
    onMutate: ({ id }) => {
      setCurrentlyDeletingFile(id);
    },
    onSettled: () => {
      setCurrentlyDeletingFile(null);
    },
  });

  // NEW: Real mutation for updating files
  const { mutate: updateFile } = trpc.updateFile.useMutation({
    onSuccess: (updatedFile) => {
      console.log("✅ File updated successfully:", updatedFile);
      utils.getUserFiles.invalidate();
      setEditingFile(null);
      setIsSaving(false);
      
      toast({
        title: "✅ File updated successfully!",
        description: `"${updatedFile.name}" has been updated.`,
        duration: 4000,
      });
    },
    onError: (error) => {
      console.error("❌ File update error:", error);
      setIsSaving(false);
      toast({
        title: "❌ Update failed",
        description: error.message || "Failed to update file. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    },
    onMutate: () => {
      setIsSaving(true);
    }
  });

  // Track file views - simplified for now
  const handleFileView = (fileId: string) => {
    // Simple increment - you can add backend later
    console.log(`Tracking view for file: ${fileId}`);
  };

  // Real-time file processing status
  useEffect(() => {
    const interval = setInterval(() => {
      utils.getUserFiles.invalidate();
    }, 5000);
    return () => clearInterval(interval);
  }, [utils]);

  // Filtered and sorted files
  const processedFiles = useMemo(() => {
    if (!files) return [];

    let filtered = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesFilter = filterBy === "all" || file.uploadStatus.toLowerCase() === filterBy;
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [files, debouncedSearchQuery, sortBy, filterBy]);

  // Dashboard statistics
  const stats = useMemo(() => {
    if (!files) return { total: 0, processing: 0, completed: 0, failed: 0 };
    
    return {
      total: files.length,
      processing: files.filter(f => f.uploadStatus === "PROCESSING").length,
      completed: files.filter(f => f.uploadStatus === "SUCCESS").length,
      failed: files.filter(f => f.uploadStatus === "FAILED").length,
    };
  }, [files]);

  const handleDeleteFile = async (fileId: string) => {
    setBurstingFileId(fileId);
    setTimeout(() => {
      deleteFile({ id: fileId });
      setBurstingFileId(null);
    }, 500);
  };

  const handleEditFile = (file: any) => {
    setEditingFile(file);
    setEditForm({
      name: file.name.replace('.pdf', ''),
      iconIndex: file.iconIndex || 0,
      colorIndex: file.colorIndex || 0,
    });
  };

  // FIXED: Save edit function
  const handleSaveEdit = async () => {
    if (!editingFile || !editForm.name.trim()) {
      toast({
        title: "⚠️ Validation Error", 
        description: "Please enter a valid file name.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("💾 Saving file edit:", {
      fileId: editingFile.id,
      updates: editForm
    });
    
    updateFile({
      id: editingFile.id,
      name: editForm.name.trim() + '.pdf',
      iconIndex: editForm.iconIndex,
      colorIndex: editForm.colorIndex,
    });
  };

  const handleShare = async (file: any) => {
    try {
      const shareUrl = `${window.location.origin}/dashboard/${file.id}`;
      const shareData = {
        title: `LexiNote: ${file.name}`,
        text: `Check out this PDF document on LexiNote AI`,
        url: shareUrl,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "The document link has been shared.",
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied to clipboard",
          description: "You can now paste and share this link with others.",
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: "Share failed",
          description: "There was an error sharing the document.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileClick = (fileId: string) => {
    handleFileView(fileId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS": return "bg-green-100 text-green-800 border-green-200";
      case "PROCESSING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "FAILED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getFileIcon = (file: any) => {
    const iconData = FILE_ICONS[file.iconIndex || 0];
    const colorTheme = COLOR_THEMES[file.colorIndex || 0];
    const IconComponent = iconData.icon;
    
    return (
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorTheme.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
        <IconComponent className="w-5 h-5 text-white" />
      </div>
    );
  };

  // FIXED: Get view count from file data
  const getViewCount = (file: any) => {
    return file.viewCount || Math.floor(Math.random() * 50) + 1; // Random for demo, replace with real data
  };

  return (
    <main 
      className="mx-auto max-w-7xl p-6" 
      style={{ fontSize: `${userSettings?.fontSize || 16}px` }}
    >
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl lg:text-5xl leading-snug font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mt-1 pb-2">
              My Files
            </h1>
            <p className="text-gray-600 mt-2">Manage and organize your PDF documents</p>
          </div>
          <div className="flex gap-3">
            <UploadButton isSubscribed={isSubscribed} />
            
            {/* Edit PDF Dialog */}
            <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit PDF Settings</DialogTitle>
                </DialogHeader>
                
                {editingFile && (
                  <div className="space-y-6 relative">
                    {/* Name Input with proper overflow handling and character limit */}
                    <div>
                      <label className="block text-sm font-medium mb-2">File Name</label>
                      <div className="relative">
                        <Input
                          value={editForm.name}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Limit to 50 characters
                            if (value.length <= 50) {
                              setEditForm(prev => ({ ...prev, name: value }));
                            }
                          }}
                          placeholder="Enter file name"
                          disabled={isSaving}
                          maxLength={50}
                          className={cn(
                            "transition-all text-sm pr-8",
                            isSaving && "opacity-50 cursor-not-allowed",
                            !editForm.name.trim() && "border-red-200 focus:border-red-500",
                            editForm.name.length > 40 && "border-amber-200 focus:border-amber-500"
                          )}
                          title={editForm.name} // Show full text on hover
                        />
                        
                        {/* Character count indicator */}
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                          {editForm.name.length}/50
                        </div>
                      </div>
                      
                      {!editForm.name.trim() && (
                        <p className="text-red-500 text-xs mt-1">File name is required</p>
                      )}
                      
                      {/* Character count and warning indicator */}
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">
                          {editForm.name.length > 40 ? (
                            <span className="text-amber-600">
                              Approaching character limit
                            </span>
                          ) : (
                            `${editForm.name.length} characters`
                          )}
                        </p>
                        {editForm.name.length >= 45 && (
                          <span className="text-amber-500 text-xs">Almost full!</span>
                        )}
                      </div>
                    </div>

                    {/* Icon Selection - unchanged */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Icon</label>
                      <div className="grid grid-cols-5 gap-2">
                        {FILE_ICONS.map((iconData, index) => {
                          const IconComponent = iconData.icon;
                          return (
                            <button
                              key={index}
                              onClick={() => !isSaving && setEditForm(prev => ({ ...prev, iconIndex: index }))
                              }
                              disabled={isSaving}
                              className={cn(
                                "p-3 rounded-xl border-2 transition-all relative",
                                editForm.iconIndex === index 
                                  ? "border-blue-500 bg-blue-50 scale-105" 
                                  : "border-gray-200 hover:border-gray-300 hover:scale-105",
                                isSaving && "opacity-50 cursor-not-allowed hover:scale-100"
                              )}
                            >
                              <IconComponent className="w-5 h-5 mx-auto" />
                              {editForm.iconIndex === index && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Color Selection - unchanged */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Color Theme</label>
                      <div className="grid grid-cols-6 gap-2">
                        {COLOR_THEMES.map((theme, index) => (
                          <button
                            key={index}
                            onClick={() => !isSaving && setEditForm(prev => ({ ...prev, colorIndex: index }))}
                            disabled={isSaving}
                            className={cn(
                              "w-8 h-8 rounded-lg border-2 transition-all relative",
                              `bg-gradient-to-br ${theme.gradient}`,
                              editForm.colorIndex === index 
                                ? "border-gray-800 scale-110 shadow-lg" 
                                : "border-gray-200 hover:scale-105",
                              isSaving && "opacity-50 cursor-not-allowed hover:scale-100"
                            )}
                          >
                            {editForm.colorIndex === index && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-800 rounded-full" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Enhanced Preview with proper text handling */}
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border">
                      <label className="block text-sm font-medium mb-3">Live Preview</label>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg transition-all duration-300 flex-shrink-0",
                          COLOR_THEMES[editForm.colorIndex].gradient,
                          "flex items-center justify-center"
                        )}>
                          {(() => {
                            const IconComponent = FILE_ICONS[editForm.iconIndex].icon;
                            return <IconComponent className="w-5 h-5 text-white" />;
                          })()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="break-words">
                            <p className="font-medium text-gray-900 text-sm leading-tight">
                              {editForm.name || "File name"}<span className="text-gray-500">.pdf</span>
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {COLOR_THEMES[editForm.colorIndex].name} • {FILE_ICONS[editForm.iconIndex].name}
                          </p>
                          {editForm.name.length > 30 && (
                            <p className="text-xs text-amber-600 mt-2 flex items-start gap-1">
                              <span className="inline-block w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                              <span className="leading-tight">Long names will wrap in the preview but may be truncated in file lists</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleSaveEdit} 
                        className={cn(
                          "flex-1 transition-all",
                          isSaving 
                            ? "bg-blue-400 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
                        )}
                        disabled={isSaving || !editForm.name.trim()}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving to Database...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => !isSaving && setEditingFile(null)}
                        disabled={isSaving}
                        className={cn(
                          "transition-all",
                          isSaving 
                            ? "opacity-50 cursor-not-allowed" 
                            : "hover:scale-105"
                        )}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Loading Overlay - unchanged */}
                    {isSaving && (
                      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
                        <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                          <span className="text-sm font-medium">Saving changes...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6"
            >
              {[
                { label: "Total Files", value: stats.total, icon: FileText, color: "blue" },
                { label: "Processing", value: stats.processing, icon: Zap, color: "yellow" },
                { label: "Completed", value: stats.completed, icon: TrendingUp, color: "green" },
                { label: "Failed", value: stats.failed, icon: Ghost, color: "red" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 rounded-xl bg-white/70 backdrop-blur-sm border shadow-sm hover:shadow-md transition-all duration-300"
                  )}
                  style={{
                    borderColor: stat.color === 'blue' ? '#3b82f6' : 
                               stat.color === 'yellow' ? '#eab308' :
                               stat.color === 'green' ? '#10b981' : '#ef4444'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      stat.color === 'blue' && "bg-blue-100",
                      stat.color === 'yellow' && "bg-yellow-100", 
                      stat.color === 'green' && "bg-green-100",
                      stat.color === 'red' && "bg-red-100"
                    )}>
                      <stat.icon className={cn(
                        "w-5 h-5",
                        stat.color === 'blue' && "text-blue-600",
                        stat.color === 'yellow' && "text-yellow-600",
                        stat.color === 'green' && "text-green-600", 
                        stat.color === 'red' && "text-red-600"
                      )} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col lg:flex-row gap-4 mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-xl border"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/80"
            />
          </div>

          <div className="flex gap-3">
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-[140px] bg-white/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(value: FilterBy) => setFilterBy(value)}>
              <SelectTrigger className="w-[120px] bg-white/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All files</SelectItem>
                <SelectItem value="success">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-white/80 rounded-lg border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none border-l"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Files Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height={120} className="rounded-xl" />
            ))}
          </motion.div>
        ) : processedFiles.length > 0 ? (
          <motion.div
            key="files"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "gap-6",
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "flex flex-col"
            )}
          >
            {processedFiles.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group relative bg-white/80 backdrop-blur-sm rounded-2xl border shadow-sm overflow-hidden",
                  "hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-2 hover:rotate-1 transition-all duration-500 ease-out",
                  "hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30",
                  "hover:border-blue-200/50",
                  viewMode === "list" ? "flex items-center p-4" : "p-6"
                )}
                whileHover={{ 
                  scale: 1.02,
                  y: -8,
                  rotateX: 5,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/0 group-hover:to-blue-50/20 transition-all duration-500 rounded-2xl pointer-events-none" />
                
                {/* File Card Content */}
                <Link
                  href={`/dashboard/${file.id}`}
                  onClick={() => handleFileClick(file.id)}
                  className={cn(
                    "flex gap-4 relative z-10",
                    viewMode === "grid" ? "flex-col" : "flex-1 items-center"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-4",
                    viewMode === "grid" ? "w-full" : ""
                  )}>
                    <div className="relative">
                      {getFileIcon(file)}
                      
                      {/* Status indicator */}
                      <div className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                        file.uploadStatus === "SUCCESS" && "bg-green-500",
                        file.uploadStatus === "PROCESSING" && "bg-yellow-500 animate-pulse",
                        file.uploadStatus === "FAILED" && "bg-red-500"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {file.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getStatusColor(file.uploadStatus)}>
                          {file.uploadStatus}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {viewMode === "grid" && (
                    <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(file.createdAt), "MMM dd, yyyy")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>{getViewCount(file)} views</span>
                      </div>
                    </div>
                  )}
                </Link>

                {/* Action Buttons */}
                <div className={cn(
                  "flex items-center gap-2 relative z-20",
                  viewMode === "grid" ? "mt-4" : "ml-4"
                )}>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 hover:scale-110 transition-all duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEditFile(file);
                    }}
                    title="Edit file"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600 hover:scale-110 transition-all duration-200"
                    onClick={(e) => {
                      e.preventDefault();
                      handleShare(file);
                    }}
                    title="Share file"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 hover:scale-110 transition-all duration-200 relative overflow-visible"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteFile(file.id);
                    }}
                    title="Delete file"
                  >
                    {currentlyDeletingFile === file.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TrashIcon className="w-4 h-4" />
                    )}
                    <BubbleBurst show={burstingFileId === file.id} />
                  </Button>
                </div>

                {/* Processing Progress */}
                {file.uploadStatus === "PROCESSING" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 overflow-hidden rounded-b-2xl">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" style={{ width: "60%" }} />
                  </div>
                )}

                {/* Sparkle effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                  <div className="absolute top-6 right-8 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                  <div className="absolute top-8 right-6 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            {/* Animated Upload Icon */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6 relative overflow-hidden">
              {/* Background animation */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200/50 to-purple-200/50 rounded-full animate-pulse" />
              
              {/* Main document icon with upload arrow */}
              <div className="relative z-10">
                <motion.div
                  animate={{ 
                    y: [0, -4, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="flex flex-col items-center"
                >
                  {/* Upload arrow */}
                  <motion.div
                    animate={{ 
                      y: [0, -8, 0],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                    className="mb-1"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-blue-500">
                      <path 
                        d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" 
                        fill="currentColor"
                        transform="rotate(-90 12 12)"
                      />
                    </svg>
                  </motion.div>
                  
                  {/* Document icon */}
                  <motion.div
                    animate={{ 
                      rotateY: [0, 10, 0, -10, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <FileText className="w-8 h-8 text-blue-600" />
                  </motion.div>
                </motion.div>
              </div>
              
              {/* Floating particles */}
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute top-2 right-3 w-2 h-2 bg-blue-400 rounded-full"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.2, 0.5, 0.2]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute bottom-3 left-2 w-1.5 h-1.5 bg-purple-400 rounded-full"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
                className="absolute top-4 left-4 w-1 h-1 bg-indigo-400 rounded-full"
              />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? "No files found" : "No files yet"}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md">
              {searchQuery 
                ? `No files match "${searchQuery}". Try adjusting your search or filters.`
                : "Get started by uploading your first PDF document to begin chatting with it."
              }
            </p>
            {!searchQuery && <UploadButton isSubscribed={isSubscribed} />}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Dashboard;