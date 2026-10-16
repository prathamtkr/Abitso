"use client";

import { ArrowRight, Menu, X, User, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";

interface MobileNavProps {
  isAuth: boolean;
  userInfo?: {
    name: string;
    email: string;
    imageUrl?: string;
  };
}

const MobileNav = ({ isAuth, userInfo }: MobileNavProps) => {
  const [isOpen, setOpen] = useState<boolean>(false);

  const toggleOpen = () => setOpen((prev) => !prev);

  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) toggleOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const closeOnCurrent = (href: string) => {
    if (pathname === href) {
      toggleOpen();
    }
  };

  return (
    <div className="sm:hidden">
      <button
        onClick={toggleOpen}
        className="relative z-50 p-2 -m-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-zinc-700" />
        ) : (
          <Menu className="h-6 w-6 text-zinc-700" />
        )}
      </button>

      {isOpen ? (
        <div className="fixed animate-in slide-in-from-top-5 fade-in-20 inset-0 z-40 w-full">
          <div
            className="absolute inset-0 bg-zinc-800/20 backdrop-blur-sm"
            onClick={toggleOpen}
          />
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-zinc-200 shadow-xl">
            {/* User Info Section for Authenticated Users */}
            {isAuth && userInfo && (
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {userInfo.imageUrl ? (
                      <Image
                        className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                        src={userInfo.imageUrl}
                        alt={userInfo.name}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {userInfo.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userInfo.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <ul className="px-6 py-4 space-y-1">
              {!isAuth ? (
                <>
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/sign-up")}
                      className="flex items-center w-full font-semibold text-green-600 py-3 px-2 rounded-lg hover:bg-green-50 transition-colors mt-2"
                      href="/sign-up"
                    >
                      Get started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </li>
                  <li className="my-2 h-px w-full bg-gray-200" />
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/sign-in")}
                      className="flex items-center w-full font-semibold py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      href="/sign-in"
                    >
                      Sign in
                    </Link>
                  </li>
                  <li className="my-2 h-px w-full bg-gray-200" />
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/pricing")}
                      className="flex items-center w-full font-semibold py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      href="/pricing"
                    >
                      Pricing
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/dashboard")}
                      className="flex items-center w-full font-semibold py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      href="/dashboard"
                    >
                      <User className="mr-3 h-5 w-5 text-gray-500" />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/pricing")}
                      className="flex items-center w-full font-semibold py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      href="/pricing"
                    >
                      <Settings className="mr-3 h-5 w-5 text-gray-500" />
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/billing")}
                      className="flex items-center w-full font-semibold py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                      href="/billing"
                    >
                      <Settings className="mr-3 h-5 w-5 text-gray-500" />
                      Manage Subscription
                    </Link>
                  </li>
                  <li className="my-2 h-px w-full bg-gray-200" />
                  <li>
                    <LogoutLink
                      postLogoutRedirectURL="/"
                      className="flex items-center w-full font-semibold py-3 px-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Sign out
                    </LogoutLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MobileNav;