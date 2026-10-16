"use client";

import { getUserSubscriptionPlan } from "@/lib/stripe";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, CreditCard, LogOut, User as UserIcon, Settings, Crown } from "lucide-react";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { trpc } from "@/app/_trpc/client";

interface UserAccountNavProps {
  email: string;
  imageUrl: string;
  name: string;
  subscriptionPlan?: "FREE" | "PRO";
}

const UserAccountNav = ({
  email,
  imageUrl,
  name,
  subscriptionPlan = "FREE",
}: UserAccountNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch user settings from database to get updated profile info
  const { data: dbSettings } = trpc.getUserSettings.useQuery();

  const isPro = subscriptionPlan === "PRO";

  const getInitials = (name: string) => {
    return name?.split(" ").map((word: string) => word[0]).join("").toUpperCase().slice(0, 2) || "U";
  };

  // Use database values if available, otherwise fall back to props
  const displayName = dbSettings?.displayName || name;
  const displayImage = dbSettings?.imageUrl || imageUrl;
  const displayEmail = dbSettings?.email || email;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div 
          className="relative z-50"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Button
            variant="ghost"
            className={cn(
              "relative h-10 w-10 rounded-full transition-all duration-200 p-0",
              isHovered && "scale-110 shadow-lg",
              "bg-transparent hover:bg-white/10 border-0"
            )}
          >
            <div className="relative w-8 h-8 rounded-full">
            
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" />
              
              <Avatar className="relative w-8 h-8 rounded-full">
                {displayImage ? (
                  <div className="relative w-full h-full bg-green rounded-full p-1">
                    <Image
                      fill
                      src={displayImage}
                      alt="profile picture"
                      referrerPolicy="no-referrer"
                      className="rounded-full object-cover"
                    />
                  </div>
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm border-0 rounded-full w-full h-full relative">
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                      <span className="animate-bounce text-xs font-bold text-white z-10">
                        {getInitials(displayName)}
                      </span>
                     
                      <div className="absolute inset-1 rounded-full border-2 border-white/40 animate-ping" />
                    </div>
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </Button>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          "bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50",
          "min-w-[280px] p-0 animate-in slide-in-from-top-2 duration-200"
        )}
        align="end"
        sideOffset={8}
      >
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-t-2xl">
          {/* Background gradient */}
          <div className={cn(
            "p-4 relative",
            isPro 
              ? "bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50" 
              : "bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50"
          )}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.15)_1px,_transparent_0)] bg-[length:20px_20px]" />
            </div>
            
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12 rounded-full shadow-md relative">
                 
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" />
                  <div className="relative w-full h-full bg-red rounded-full p-1">
                    {displayImage ? (
                      <div className="relative aspect-square h-full w-full rounded-full overflow-hidden">
                        <Image
                          fill
                          src={displayImage}
                          alt="profile picture"
                          referrerPolicy="no-referrer"
                          className="rounded-full object-cover"
                        />
                      </div>
                    ) : (
                      <AvatarFallback className={cn(
                        "font-semibold text-white rounded-full border-0 relative overflow-hidden w-full h-full",
                        isPro 
                          ? "bg-gradient-to-br from-yellow-500 to-orange-500" 
                          : "bg-gradient-to-br from-blue-500 to-purple-500"
                      )}>
                        <div className="relative w-full h-full rounded-full flex items-center justify-center">
                          <div className="animate-bounce text-base font-bold z-10 text-white">
                            {getInitials(displayName)}
                          </div>
                        
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 to-transparent animate-pulse" />
                         
                          <div className="absolute inset-2 rounded-full border-2 border-white/40 animate-spin" style={{ animationDuration: '4s' }} />
                        </div>
                      </AvatarFallback>
                    )}
                  </div>
                </Avatar>
                
                {/* Status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse shadow-sm" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                  {isPro && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full">
                      <Crown className="w-3 h-3 text-white" />
                      <span className="text-xs font-bold text-white">PRO</span>
                    </div>
                  )}
                </div>
                {displayEmail && (
                  <p className="text-sm text-gray-600 truncate">{displayEmail}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-2 space-y-1">
          {/* Dashboard */}
          <DropdownMenuItem asChild>
            <Link 
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                "hover:bg-blue-50 hover:scale-[1.02] active:scale-95 cursor-pointer group"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <LayoutDashboard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Dashboard</p>
                <p className="text-xs text-gray-500">Manage your files</p>
              </div>
            </Link>
          </DropdownMenuItem>

          {/* Settings */}
          <DropdownMenuItem asChild>
            <Link 
              href="/dashboard/settings"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                "hover:bg-purple-50 hover:scale-[1.02] active:scale-95 cursor-pointer group"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Settings</p>
                <p className="text-xs text-gray-500">Preferences & privacy</p>
              </div>
            </Link>
          </DropdownMenuItem>

          {/* Billing - NEW ADDITION */}
          <DropdownMenuItem asChild>
            <Link 
              href="/dashboard/billing"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                "hover:bg-green-50 hover:scale-[1.02] active:scale-95 cursor-pointer group"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <CreditCard className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Billing</p>
                <p className="text-xs text-gray-500">Subscription & payments</p>
              </div>
            </Link>
          </DropdownMenuItem>

          {/* Upgrade */}
          <DropdownMenuItem asChild>
            <Link 
              href="/pricing"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                "hover:bg-gradient-to-r hover:from-pink-50 hover:to-orange-50 hover:scale-[1.02] active:scale-95 cursor-pointer group"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-orange-100 flex items-center justify-center group-hover:from-pink-200 group-hover:to-orange-200 transition-all">
                <Crown className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">Upgrade</p>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-pink-500 to-orange-500 text-white text-xs font-bold rounded-full">
                    NEW
                  </span>
                </div>
                <p className="text-xs text-gray-500">Unlock premium features</p>
              </div>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1 bg-gray-200/50" />

        <div className="p-2">
          <DropdownMenuItem asChild>
            <LogoutLink 
              postLogoutRedirectURL="/"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                "hover:bg-red-50 hover:scale-[1.02] active:scale-95 cursor-pointer group w-full"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Sign out</p>
                <p className="text-xs text-gray-500">Logout from account</p>
              </div>
            </LogoutLink>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountNav;