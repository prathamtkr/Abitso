"use client";

import { ArrowRight, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { trpc } from "@/app/_trpc/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "./ui/use-toast";

interface UpgradeButtonProps {
  interval: "month" | "year";
}

const UpgradeButton = ({ interval }: UpgradeButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url ?? "/dashboard/billing";
    },
    onError: (error) => {
      toast({
        title: "Could not start checkout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      onClick={() => createStripeSession({ interval })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "w-full h-12 relative overflow-hidden group",
        "bg-teal-700",
        "hover:bg-teal-800",
        "transform transition-all duration-300 ease-out",
        "hover:scale-105 hover:shadow-xl",
        "border-0 text-white font-semibold"
      )}
    >
   
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out -skew-x-12" />
      
      {/* Content */}
      <div className="relative flex items-center justify-center gap-2">
        <Zap className={cn(
          "w-4 h-4 transition-all duration-300",
          isHovered && "rotate-12 scale-110"
        )} />
        
        <span>Choose {interval === "month" ? "monthly" : "yearly"}</span>
        
        <ArrowRight className={cn(
          "w-5 h-5 transition-all duration-300",
          isHovered && "translate-x-1"
        )} />
      </div>
    </Button>
  );
};

export default UpgradeButton;