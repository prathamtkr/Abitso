import Link from "next/link";
import { buttonVariants } from "./ui/button";
import {
  LoginLink,
  RegisterLink,
  getKindeServerSession,
} from "@kinde-oss/kinde-auth-nextjs/server";
import { ArrowRight, Sparkles } from "lucide-react";
import UserAccountNav from "./UserAccountNav";
import MobileNav from "./MobileNav";

const Navbar = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <nav className="sticky h-16 inset-x-0 top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-lg shadow-sm transition-all">
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-fuchsia-400 to-indigo-500 animate-gradient-x" />
      <div className="flex h-[60px] items-center justify-between px-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="flex z-40 items-center font-extrabold text-xl sm:text-2xl bg-gradient-to-r from-blue-600 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent animate-gradient-x tracking-tight group"
        >
          <Sparkles
            className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-purple-500 transition-transform duration-300 group-hover:rotate-90"
            style={{
              background: "linear-gradient(90deg, #6366f1 0%, #a21caf 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          />
          Lexinote
        </Link>

        {/* Mobile Navigation */}
        <div className="flex items-center sm:hidden">
          <MobileNav
            isAuth={!!user}
            userInfo={
              user
                ? {
                    name: !user.given_name || !user.family_name
                      ? "Your Account"
                      : `${user.given_name} ${user.family_name}`,
                    email: user.email ?? "",
                    imageUrl: user.picture ?? undefined,
                  }
                : undefined
            }
          />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden items-center space-x-4 sm:flex">
          {!user ? (
            <>
              <Link
                href="/pricing"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "hover:text-fuchsia-600 transition-colors",
                })}
              >
                Pricing
              </Link>
              <LoginLink
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "hover:text-fuchsia-600 transition-colors",
                })}
              >
                Sign in
              </LoginLink>
              <RegisterLink
                className={buttonVariants({
                  size: "sm",
                  className:
                    "bg-gradient-to-r from-blue-600 to-fuchsia-500 hover:from-blue-700 hover:to-fuchsia-600 text-white font-semibold rounded-lg px-4 py-2 transition-all duration-200 transform hover:scale-105 mt-1.5",
                })}
              >
                Get started <ArrowRight className="ml-1.5 h-4 w-4" />
              </RegisterLink>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "hover:text-fuchsia-600 transition-colors",
                })}
              >
                Dashboard
              </Link>
              <Link
                href="/pricing"
                className={buttonVariants({
                  variant: "ghost",
                  size: "sm",
                  className: "hover:text-fuchsia-600 transition-colors",
                })}
              >
                Pricing
              </Link>
              <div className="mt-1.5">
                <UserAccountNav
                  name={
                    !user.given_name || !user.family_name
                      ? "Your Account"
                      : `${user.given_name} ${user.family_name}`
                  }
                  email={user.email ?? ""}
                  imageUrl={user.picture ?? ""}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;