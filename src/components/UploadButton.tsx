"use client";

import { trpc } from "../app/_trpc/client";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { useToast } from "./ui/use-toast";
import { useUploadThing } from "@/lib/uploadThing";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { CloudIcon, FileIcon, Loader2Icon, Upload, CheckCircle2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Dropzone from "react-dropzone";
import { cn } from "../lib/utils";

const UploadDropzone = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showClickAnimation, setShowClickAnimation] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const { startUpload } = useUploadThing(
    isSubscribed ? "proPlanUploader" : "freePlanUploader",
    {
      onUploadError: (error) => {
        console.error("UploadThing upload failed:", error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
        setIsUploading(false);
        setUploadComplete(false);
        setUploadProgress(0);
      },
    }
  );

  const startSimulatedProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 500);
    return interval;
  };

  const { mutate: startPolling } = trpc.getFile.useMutation({
    
    onSuccess: (file) => {
      setUploadComplete(true);
      setTimeout(() => {
        router.push(`/dashboard/${file.id}`);
      }, 1500);
    },
    onError: (error) => {
      console.error("Polling error:", error);
      toast({
        title: "Upload failed",
        description: "Please try again later.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadComplete(false);
    },
    retry: true,
    retryDelay: 500,
  });

  
  const handleBrowseClick = (e: React.MouseEvent, open: () => void) => {
    e.stopPropagation();
    setShowClickAnimation(true);
    
    // Reset animation after it completes
    setTimeout(() => {
      setShowClickAnimation(false);
    }, 600);
    
    open();
  };

  return (
    <Dropzone
      multiple={false}
      accept={{
        "application/pdf": [".pdf"],
      }}
      onDragEnter={() => setIsHovering(true)}
      onDragLeave={() => setIsHovering(false)}
      onDrop={async (acceptedFiles) => {
        setIsHovering(false);
        
        if (acceptedFiles.length === 0) return;
        
        setIsUploading(true);
        const progressInterval = startSimulatedProgress();

        let res;
        try {
          res = await startUpload(acceptedFiles);
        } catch (error) {
          clearInterval(progressInterval);
          console.error("Unexpected upload error:", error);
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
            variant: "destructive",
          });
          setIsUploading(false);
          setUploadComplete(false);
          setUploadProgress(0);
          return;
        }

        if (!res) {
          clearInterval(progressInterval);
          setIsUploading(false);
          setUploadComplete(false);
          setUploadProgress(0);
          return;
        }

        const [fileResponse] = res;
        const key = fileResponse?.key;

        if (!key) {
          return toast({
            title: "Something went wrong",
            description: "Please try again later",
            variant: "destructive",
          });
        }

        startPolling({ key });
        clearInterval(progressInterval);
        setUploadProgress(100);
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles, open }) => (
        <div
          {...getRootProps()}
          className={cn(
            "relative group h-72 rounded-3xl border-2 border-dashed transition-all duration-500 cursor-pointer overflow-hidden",
            "bg-gradient-to-br from-slate-50 to-blue-50",
            isHovering 
              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-100 scale-[1.02] shadow-xl" 
              : "border-slate-300 hover:border-blue-400 hover:shadow-lg",
            showClickAnimation && "animate-pulse border-blue-500 bg-gradient-to-br from-blue-100 to-indigo-200"
          )}
        >
         
          <div className="absolute inset-0">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-1 h-1 bg-blue-400 rounded-full opacity-30 transition-all duration-300",
                  "animate-float",
                  showClickAnimation && "opacity-100 scale-150"
                )}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: '3s'
                }}
              />
            ))}
          </div>

          {/* Click ripple effect */}
          {showClickAnimation && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 border-4 border-blue-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute w-16 h-16 border-2 border-blue-500 rounded-full animate-ping animation-delay-200 opacity-50"></div>
            </div>
          )}

          {/* Sparkle effects on click */}
          {showClickAnimation && (
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <Sparkles
                  key={i}
                  className={cn(
                    "absolute w-4 h-4 text-blue-500 animate-bounce opacity-0",
                    showClickAnimation && "opacity-100"
                  )}
                  style={{
                    left: `${15 + i * 12}%`,
                    top: `${20 + (i % 3) * 25}%`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: '800ms'
                  }}
                />
              ))}
            </div>
          )}

          <div className="relative z-10 flex h-full w-full items-center justify-center p-8">
            {!isUploading && !uploadComplete && (
              <div className="text-center space-y-6">
                {/* Main cloud icon */}
                <div className={cn(
                  "mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center",
                  "shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                  showClickAnimation && "scale-125 rotate-12 shadow-2xl"
                )}>
                  <CloudIcon className="w-8 h-8 text-white" />
                  
                  {/* Floating upload icon */}
                  <div className={cn(
                    "absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center transition-all duration-300",
                    "group-hover:scale-110 group-hover:-translate-y-1",
                    showClickAnimation && "scale-150 -translate-y-2 rotate-45"
                  )}>
                    <Upload className="w-3 h-3 text-blue-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className={cn(
                    "text-xl font-semibold text-slate-800 transition-all duration-300",
                    showClickAnimation && "scale-105 text-blue-700"
                  )}>
                    Drop your PDF here
                  </h3>
                  <p className="text-slate-600">
                    or{" "}
                    <button
                      type="button"
                      onClick={(e) => handleBrowseClick(e, open)}
                      className={cn(
                        "text-blue-600 font-medium hover:underline focus:outline-none transition-all duration-300",
                        "hover:text-blue-700 hover:scale-105",
                        showClickAnimation && "text-blue-700 scale-110 font-bold"
                      )}
                    >
                      click to browse
                    </button>
                  </p>
                  <p className="text-sm text-slate-500">
                    Maximum {isSubscribed ? "16MB" : "4MB"}
                  </p>
                </div>
              </div>
            )}

            {/* File preview */}
            {acceptedFiles && acceptedFiles.length > 0 && !isUploading && (
              <div className="animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-4 bg-white/80 rounded-2xl p-4 border border-blue-200 backdrop-blur-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 truncate max-w-[200px]">
                      {acceptedFiles[0].name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {(acceptedFiles[0].size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload progress */}
            {isUploading && !uploadComplete && (
              <div className="text-center space-y-4 animate-in fade-in-0 duration-300">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center relative">
                  <Loader2Icon className="w-8 h-8 text-white animate-spin" />
                  
                  {/* Pulsing ring */}
                  <div className="absolute inset-0 border-4 border-blue-300 rounded-2xl animate-ping opacity-75"></div>
                </div>
                <div className="space-y-3">
                  <p className="text-lg font-semibold text-slate-800">Uploading...</p>
                  <div className="w-64 mx-auto space-y-2">
                    <Progress
                      value={uploadProgress}
                      className="h-2 bg-slate-200"
                    />
                    <p className="text-sm text-slate-600">{uploadProgress}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload complete */}
            {uploadComplete && (
              <div className="text-center space-y-4 animate-in zoom-in-50 duration-500">
                <div className="w-16 h-16 mx-auto bg-green-500 rounded-2xl flex items-center justify-center relative">
                  <CheckCircle2 className="w-8 h-8 text-white animate-bounce" />
                  
                  {/* Success sparkles */}
                  <div className="absolute inset-0">
                    {[...Array(4)].map((_, i) => (
                      <Sparkles
                        key={i}
                        className="absolute w-3 h-3 text-green-300 animate-ping"
                        style={{
                          left: `${10 + i * 20}%`,
                          top: `${10 + i * 20}%`,
                          animationDelay: `${i * 200}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">Success!</p>
                  <p className="text-sm text-slate-600">Redirecting...</p>
                </div>
              </div>
            )}
          </div>

          <input {...getInputProps()} />
        </div>
      )}
    </Dropzone>
  );
};

const UploadButton = ({ isSubscribed }: { isSubscribed: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto text-sm sm:text-base h-9 sm:h-10">
          <Upload className="h-4 w-4 mr-2" />
          Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-full mx-4 sm:mx-auto">
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-800">Upload Document</h2>
            <p className="text-slate-600 mt-1">Select a PDF file to analyze</p>
          </div>
          <UploadDropzone isSubscribed={isSubscribed} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadButton;