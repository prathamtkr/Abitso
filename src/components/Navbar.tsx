import Link from "next/link";
import { buttonVariants } from "./ui/button";
import {
  LoginLink,
  RegisterLink,
  getKindeServerSession,
} from "@kinde-oss/kinde-auth-nextjs/server";
import UserAccountNav from "./UserAccountNav";
import MobileNav from "./MobileNav";

const Navbar = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <nav className="sticky inset-x-0 top-0 z-50 h-16 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-[-0.03em] text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#0F766E] text-sm font-bold text-white">
            A
          </span>
          Abitso
        </Link>

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

        <div className="hidden items-center gap-2 sm:flex">
          {!user ? (
            <>
              <Link href="/pricing" className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-[10px] text-slate-600 hover:text-teal-800" })}>
                Pricing
              </Link>
              <LoginLink className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-[10px] text-slate-600 hover:text-teal-800" })}>
                Sign in
              </LoginLink>
              <RegisterLink className={buttonVariants({ size: "sm", className: "ml-1 rounded-[10px] bg-[#0F766E] font-semibold text-white hover:bg-[#115E59]" })}>
                Get started
              </RegisterLink>
            </>
          ) : (
            <>
              <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-[10px] text-slate-600 hover:text-teal-800" })}>
                Dashboard
              </Link>
              <Link href="/pricing" className={buttonVariants({ variant: "ghost", size: "sm", className: "rounded-[10px] text-slate-600 hover:text-teal-800" })}>
                Pricing
              </Link>
              <UserAccountNav
                name={!user.given_name || !user.family_name ? "Your Account" : `${user.given_name} ${user.family_name}`}
                email={user.email ?? ""}
                imageUrl={user.picture ?? ""}
              />
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
