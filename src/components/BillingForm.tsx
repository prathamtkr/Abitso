"use client";

import { trpc } from "@/app/_trpc/client";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { format } from "date-fns";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { Button } from "./ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useToast } from "./ui/use-toast";
import { CheckCircle2, XCircle, Loader2, Crown } from "lucide-react";
import { useState } from "react";

interface BillingFormProps {
  subscriptionPlan: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}

const BillingForm = ({ subscriptionPlan }: BillingFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const { mutate: createStripeSession } =
    trpc.createStripeSession.useMutation({
      onMutate: () => setLoading(true),
      onSettled: () => setLoading(false),
      onSuccess: ({ url }) => {
        if (url) window.location.href = url;
        if (!url) {
          toast({
            title: "There was a problem...",
            description: "Please try again in a moment",
            variant: "destructive",
          });
        }
      },
    });

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-fuchsia-50 to-indigo-100 overflow-hidden">
     
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-fuchsia-200 opacity-30 rounded-full blur-3xl animate-blob1 z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-200 opacity-30 rounded-full blur-3xl animate-blob2 z-0" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-indigo-100 opacity-20 rounded-full blur-2xl animate-blob3 z-0" />
      
      <div className="absolute bottom-0 left-0 w-full z-0 pointer-events-none">
        <svg viewBox="0 0 1440 320" className="w-full h-32">
          <path
            fill="#f3e8ff"
            fillOpacity="1"
            d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,154.7C672,160,768,192,864,197.3C960,203,1056,181,1152,154.7C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
      <MaxWidthWrapper className="relative z-10 flex flex-col items-center justify-center">
        <form
          className="w-full flex justify-center"
          onSubmit={(e) => {
            e.preventDefault();
            createStripeSession();
          }}
        >
          <Card className="w-full max-w-2xl shadow-2xl border border-blue-100 animate-fade-in-up bg-white/90 backdrop-blur-md transition-transform duration-300 hover:scale-[1.015] hover:shadow-3xl">
            <div className="flex justify-end pr-6 pt-6">
              {subscriptionPlan.isSubscribed ? (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white text-xs font-semibold shadow animate-pop-in">
                  <Crown className="h-4 w-4 mr-1 text-yellow-300" />
                  {subscriptionPlan.name || "Pro"}
                </span>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-gray-300 to-gray-100 text-gray-700 text-xs font-semibold shadow animate-pop-in">
                  <XCircle className="h-4 w-4 mr-1 text-red-400" />
                  Free
                </span>
              )}
            </div>
            <CardHeader className="flex flex-row items-center gap-4 pt-2">
              {subscriptionPlan.isSubscribed ? (
                <CheckCircle2 className="text-green-500 animate-bounce-slow h-8 w-8" />
              ) : (
                <XCircle className="text-red-400 animate-bounce-slow h-8 w-8" />
              )}
              <div>
                <CardTitle className="text-2xl font-bold">
                  Subscription Plan
                </CardTitle>
                <CardDescription className="mt-1 text-base">
                  {subscriptionPlan.isSubscribed ? (
                    <>
                      You are currently on the{" "}
                      <strong>{subscriptionPlan.name}</strong> plan.
                    </>
                  ) : (
                    <>
                      You are on the <strong>Free</strong> plan. Upgrade to unlock
                      more features!
                    </>
                  )}
                </CardDescription>
              </div>
            </CardHeader>

            <div className="px-6 pb-4">
              <ul className="space-y-2 text-sm">
                <li>
                  <span className="font-semibold">Plan:</span>{" "}
                  {subscriptionPlan.name ? subscriptionPlan.name : "Free"}
                </li>
                <li>
                  <span className="font-semibold">Status:</span>{" "}
                  {subscriptionPlan.isSubscribed ? (
                    <span className="text-green-600 font-medium">Active</span>
                  ) : (
                    <span className="text-red-500 font-medium">Not Subscribed</span>
                  )}
                </li>
                {subscriptionPlan.isSubscribed && (
                  <li>
                    <span className="font-semibold">Renewal:</span>{" "}
                    {subscriptionPlan.isCanceled
                      ? (
                        <span>
                          <span className="text-red-500">Cancels</span> on{" "}
                          {format(subscriptionPlan.stripeCurrentPeriodEnd!, "dd.MM.yyyy")}
                        </span>
                      )
                      : (
                        <span>
                          <span className="text-blue-600">Renews</span> on{" "}
                          {format(subscriptionPlan.stripeCurrentPeriodEnd!, "dd.MM.yyyy")}
                        </span>
                      )
                    }
                  </li>
                )}
                <li>
                  <span className="font-semibold">Features:</span>{" "}
                  {subscriptionPlan.name === "Pro"
                    ? "Unlimited PDFs, Priority Support, and more."
                    : "Limited PDFs, Basic Support."}
                </li>
              </ul>
            </div>

            <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0 md:space-y-0 border-t border-gray-100 px-6 py-4">
              <Button
                type="submit"
                disabled={loading}
                className="relative flex items-center gap-2 px-6 py-2 font-semibold rounded-lg shadow transition-transform duration-200 hover:scale-105 hover:shadow-lg focus:ring-2 focus:ring-blue-400"
              >
                {loading && <Loader2 className="animate-spin h-5 w-5" />}
                {subscriptionPlan.isSubscribed
                  ? "Manage Subscription"
                  : "Upgrade to PRO"}
              </Button>
              {subscriptionPlan.isSubscribed && (
                <span className="rounded-full text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 animate-fade-in">
                  {subscriptionPlan.isCanceled
                    ? "Your plan will be canceled on "
                    : "Your plan renews on "}
                  {format(subscriptionPlan.stripeCurrentPeriodEnd!, "dd.MM.yyyy")}
                  .
                </span>
              )}
            </CardFooter>
          </Card>
        </form>
      </MaxWidthWrapper>
      
    </div>
  );
};

export default BillingForm;