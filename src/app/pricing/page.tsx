import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import UpgradeButton from "@/components/UpgradeButton";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PLANS } from "@/config/stripe";
import { cn } from "@/lib/utils";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ArrowRight, Check, HelpCircle, Minus, Sparkles, Crown, Star, Zap } from "lucide-react";
import Link from "next/link";
import { getUserSubscriptionPlan } from "@/lib/stripe";

//interface definition 
interface Feature {
  text: string;
  footnote?: string;
  negative?: boolean;
}

interface PricingItem {
  plan: string;
  tagline: string;
  quota: number;
  features: Feature[];
}

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const subscriptionPlan = await getUserSubscriptionPlan();
  
  // Calculate days left in subscription
  const getDaysLeft = () => {
    if (!subscriptionPlan.stripeCurrentPeriodEnd) return 0;
    const today = new Date();
    const endDate = new Date(subscriptionPlan.stripeCurrentPeriodEnd);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysLeft = getDaysLeft();
  const isProUser = subscriptionPlan.isSubscribed;

  // Update the pricingItems array 
  const pricingItems: PricingItem[] = [
    {
      plan: "Free",
      tagline: "Perfect for individuals and small teams getting started.",
      quota: 10,
      features: [
        {
          text: "Up to 8 pages per PDF",
          footnote:
            "Maximum number of pages supported for PDF document for processing and analysis.",
        },
        {
          text: "4MB file size limit",
          footnote:
            "Maximum file size supported for optimal processing speed and performance.",
        },
        {
          text: "Cross-platform compatibility",
          footnote:
            "Fully optimized experience across desktop, tablet, and mobile devices.",
        },
        {
          text: "Basic chat interactions",
          footnote:
            "Standard AI responses with essential document analysis capabilities.",
        },
        {
          text: "Advanced AI analysis",
          footnote:
            "Enhanced algorithmic responses with deeper document understanding and context awareness.",
          negative: true,
        },
        {
          text: "Priority support",
          negative: true,
        },
      ],
    },
    {
      plan: "Pro",
      tagline: "Designed for professionals and growing businesses.",
      quota: PLANS.find((p) => p.slug === "pro")!.quota,
      features: [
        {
          text: "Up to 35 pages per PDF",
          footnote:
            "Extended page limit for comprehensive document processing and analysis.",
        },
        {
          text: "16MB file size limit",
          footnote:
            "Enhanced file size capacity for larger, more complex documents.",
        },
        {
          text: "Cross-platform compatibility",
          footnote:
            "Fully optimized experience across desktop, tablet, and mobile devices.",
        },
        {
          text: "Advanced document insights",
          footnote:
            "Premium algorithmic responses with enhanced content quality, deeper insights, and contextual understanding.",
        },
        {
          text: "Advanced AI analysis",
          footnote:
            "Enhanced algorithmic responses with deeper document understanding and context awareness.",
        },
        {
          text: "Priority support",
        },
      ],
    },
  ];

  return (
    <>
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-fuchsia-50 to-indigo-100 animate-gradient-fade" />
      
      {/* Pro User Congratulations Banner  */}
      {isProUser && (
        <div className="relative top-0 left-0 right-0 z-40 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white py-3 px-4 animate-slide-down">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <div className="flex items-center gap-2 animate-bounce">
              <Crown className="h-6 w-6 text-yellow-200 animate-pulse" />
              <Star className="h-4 w-4 text-yellow-200 animate-ping" />
            </div>
            <div className="text-center">
              <span className="font-bold text-lg">🎉 Congratulations! You are already a PRO member!</span>
              <span className="ml-2 text-yellow-100">
                {daysLeft > 0 ? `${daysLeft} days remaining` : "Subscription ended"}
              </span>
            </div>
            <div className="flex items-center gap-2 animate-bounce" style={{ animationDelay: "0.5s" }}>
              <Star className="h-4 w-4 text-yellow-200 animate-ping" style={{ animationDelay: "0.3s" }} />
              <Zap className="h-6 w-6 text-yellow-200 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      <MaxWidthWrapper className={cn("mb-8 text-center max-w-5xl", isProUser ? "mt-8" : "mt-24")}>
        <div className="mx-auto mb-10 sm:max-w-lg">
          <h1 className="text-6xl font-bold sm:text-7xl flex items-center justify-center gap-2">
            <Sparkles className="text-fuchsia-400 h-8 w-8 animate-bounce-slow" />
            Pricing
          </h1>
          <p className="mt-5 text-gray-600 sm:text-lg">
            Whether you are just trying out our service or need more,
            we have got you covered.
          </p>
        </div>

        <div className="pt-12 grid grid-cols-1 gap-10 lg:grid-cols-2">
          <TooltipProvider>
            {pricingItems.map(({ plan, tagline, quota, features }, idx) => {
              const price =
                PLANS.find((p) => p.slug === plan.toLowerCase())?.price
                  .amount || 0;

              const isCurrentProPlan = plan === "Pro" && isProUser;

              return (
                <div
                  key={plan}
                  className={cn(
                    "relative rounded-2xl bg-white/70 shadow-xl border backdrop-blur-md transition-transform duration-300 hover:scale-[1.025] hover:shadow-2xl animate-fade-in-up",
                    {
                      "border-2 border-blue-600 shadow-blue-200": plan === "Pro",
                      "border border-gray-200": plan !== "Pro",
                      "ring-4 ring-yellow-400/50 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50": isCurrentProPlan,
                    }
                  )}
                  style={{
                    animationDelay: `${idx * 0.12 + 0.1}s`,
                  }}
                >
                  {plan === "Pro" && !isProUser && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-36 rounded-full bg-gradient-to-r from-blue-600 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white shadow-lg flex items-center justify-center gap-2 animate-pop-in">
                      <Sparkles className="h-5 w-5 animate-bounce-slow" />
                      Most Popular
                    </div>
                  )}

                  {isCurrentProPlan && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-48 rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 px-4 py-2 text-sm font-bold text-white shadow-lg flex items-center justify-center gap-2 animate-pulse">
                      <Crown className="h-5 w-5 text-yellow-200 animate-bounce" />
                      Your Current Plan
                      <Crown className="h-5 w-5 text-yellow-200 animate-bounce" style={{ animationDelay: '0.5s' }} />
                    </div>
                  )}

                  <div className="p-5">
                    <h3 className={cn(
                      "my-3 text-center font-display text-3xl font-bold",
                      isCurrentProPlan && "text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text"
                    )}>
                      {plan}
                    </h3>
                    <p className="text-gray-500">{tagline}</p>
                    <p className="my-5 font-display text-6xl font-semibold flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold text-blue-600">₹</span>
                      {price}
                    </p>
                    <p className="text-gray-500">per month</p>
                  </div>

                  <div className="flex h-20 items-center justify-center border-b border-t border-gray-200 bg-gray-50/70">
                    <div className="flex items-center space-x-1">
                      <p>{quota.toLocaleString()} PDFs/mo included</p>

                      <Tooltip delayDuration={300}>
                        <TooltipTrigger className="cursor-default ml-1.5">
                          <HelpCircle className="h-4 w-4 text-zinc-500" />
                        </TooltipTrigger>
                        <TooltipContent className="w-80 p-2">
                          How many PDFs you can upload per month.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <ul className="my-10 space-y-5 px-8">
                    {features.map(({ text, footnote, negative }) => (
                      <li key={text} className="flex space-x-5">
                        <div className="flex-shrink-0">
                          {negative ? (
                            <Minus className="h-6 w-6 text-gray-300" />
                          ) : (
                            <Check className={cn(
                              "h-6 w-6",
                              isCurrentProPlan ? "text-yellow-500" : "text-blue-500"
                            )} />
                          )}
                        </div>
                        {footnote ? (
                          <div className="flex items-center space-x-1">
                            <p
                              className={cn("text-gray-600", {
                                "text-gray-400": negative,
                              })}
                            >
                              {text}
                            </p>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger className="cursor-default ml-1.5">
                                <HelpCircle className="h-4 w-4 text-zinc-500" />
                              </TooltipTrigger>
                              <TooltipContent className="w-80 p-2">
                                {footnote}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <p
                            className={cn("text-gray-600", {
                              "text-gray-400": negative,
                            })}
                          >
                            {text}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-200" />
                  <div className="p-5">
                    {plan === "Free" ? (
                      <Link
                        href={user ? "/dashboard" : "/sign-in"}
                        className={buttonVariants({
                          className: "w-full",
                          variant: "secondary",
                        })}
                      >
                        {user ? "Upgrade now" : "Sign up"}
                        <ArrowRight className="h-5 w-5 ml-1.5" />
                      </Link>
                    ) : isCurrentProPlan ? (
                      <div className="space-y-3">
                        <div className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 rounded-lg font-semibold text-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse opacity-50" />
                          <div className="relative z-10 flex items-center justify-center gap-2">
                            <Crown className="h-5 w-5 animate-bounce" />
                            <span>Active Subscription</span>
                            <Star className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
                          </div>
                        </div>
                        <p className="text-center text-sm text-gray-600">
                          {daysLeft > 0 ? (
                            <span className="flex items-center justify-center gap-1">
                              <Zap className="h-4 w-4 text-yellow-500" />
                              {daysLeft} days remaining in your subscription
                            </span>
                          ) : (
                            <span className="text-red-500">Your subscription has ended</span>
                          )}
                        </p>
                      </div>
                    ) : user ? (
                      <UpgradeButton />
                    ) : (
                      <Link
                        href="/sign-in"
                        className={buttonVariants({
                          className: "w-full",
                        })}
                      >
                        {user ? "Upgrade now" : "Sign up"}
                        <ArrowRight className="h-5 w-5 ml-1.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </MaxWidthWrapper>
    </>
  );
};

export default Page;