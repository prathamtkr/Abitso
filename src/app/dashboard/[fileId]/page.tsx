import PdfRenderer from "@/components/PdfRenderer";
import ChatWrapper from "@/components/chat/ChatWrapper";
import prisma from '@/db';
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { notFound, redirect } from "next/navigation";
import { FileText, MessageCircle, Sparkles, ArrowLeft, Share2, Download, Settings, Check, Copy } from "lucide-react";
import Link from "next/link";
import DownloadChatButton from "@/components/DownloadChatButton";
import ShareDocumentButton from "@/components/ShareDocumentButton";

interface Props {
  params: {
    fileId: string
  };
}

const DashboardFileId = async ({ params: { fileId } }: Props) => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) redirect(`/auth-callback?origin=dashboard/${fileId}`);

  const file = await prisma.file.findFirst({
    where: {
      userId: user.id,
      id: fileId
    }
  });

  if (!file) {
    console.error(`File with ID ${fileId} not found for user ${user.id}`);
    notFound();
  }

  const plan = await getUserSubscriptionPlan();

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header  */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md bg-white/95">
        <div className="mx-auto max-w-[1800px] px-8 py-4">
          <div className="flex items-center justify-between">
            
            {/* Navigation */}
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="group flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:text-indigo-600 transition-all duration-300 hover:bg-indigo-50 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5 group-hover:text-indigo-600" />
                <span className="text-base font-medium">Dashboard</span>
              </Link>
              
              <div className="hidden md:flex items-center gap-4 text-gray-700">
                <div className="relative">
                  <span className="text-base font-semibold truncate max-w-64 text-blue-800">
                    {file.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <ShareDocumentButton fileId={fileId} fileName={file.name} />
              <DownloadChatButton fileId={fileId} fileName={file.name} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Wider Professional Layout */}
      <div className="mx-auto max-w-[1800px] flex flex-col xl:flex-row h-[calc(100vh-89px)] px-4">
        
        {/* PDF Section */}
        <div className="xl:w-1/2 w-full bg-white border-r border-gray-200">
          <div className="h-full flex flex-col">
            
            {/* PDF Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 via-orange-50/30 to-gray-50">
              
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-orange-50 to-red-100 rounded-xl border border-orange-300 shadow-lg">
                  <div className="h-5 w-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs font-bold">PDF</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-gray-900 font-semibold text-base">
                    <span className="text-gray-800">
                      PDF Document
                    </span>
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Interactive viewer
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50" />
                <span className="text-gray-600 text-sm font-medium">
                  <span className="text-orange-600 font-semibold">
                    Active
                  </span>
                </span>
              </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 bg-white p-4">
              <PdfRenderer fileId={file.id} url={file.url} />
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="xl:w-1/2 w-full bg-white">
          <div className="h-full flex flex-col">
            
            {/* Chat Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl relative shadow-lg">
                  <MessageCircle className="h-5 w-5 text-white" />
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-base">LexiNote AI Assistant</h3>
                  <p className="text-gray-500 text-sm">Powered by advanced AI</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
                  <span className="text-green-700 text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 bg-white relative p-2">
              <ChatWrapper fileId={file.id} isSubscribed={plan.isSubscribed} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFileId;