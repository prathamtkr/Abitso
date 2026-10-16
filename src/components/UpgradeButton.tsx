"use client";

import { ArrowRight, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { trpc } from "@/app/_trpc/client";
import { cn } from "@/lib/utils";
import { useState } from "react";

const UpgradeButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url ?? "/dashboard/billing";
    },
  });

  return (
    <Button
      onClick={() => createStripeSession()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "w-full h-12 relative overflow-hidden group",
        "bg-gradient-to-r from-purple-600 to-blue-600",
        "hover:from-purple-700 hover:to-blue-700",
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
        
        <span>Upgrade now</span>
        
        <ArrowRight className={cn(
          "w-5 h-5 transition-all duration-300",
          isHovered && "translate-x-1"
        )} />
      </div>
    </Button>
  );
};

export default UpgradeButton;