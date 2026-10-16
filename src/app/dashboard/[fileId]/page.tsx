import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { notFound, redirect } from "next/navigation";
import prisma from "@/db";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import DocumentWorkspace from "@/components/DocumentWorkspace";

interface Props {
  params: {
    fileId: string;
  };
}

const DashboardFileId = async ({ params: { fileId } }: Props) => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect(`/auth-callback?origin=dashboard/${fileId}`);

  const [file, plan] = await Promise.all([
    prisma.file.findFirst({
      where: { userId: user.id, id: fileId },
    }),
    getUserSubscriptionPlan(),
  ]);

  if (!file) notFound();

  return (
    <DocumentWorkspace
      fileId={file.id}
      fileName={file.name}
      pdfUrl={file.url}
      isSubscribed={plan.isSubscribed}
      uploadStatus={file.uploadStatus}
    />
  );
};

export default DashboardFileId;
