import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function createTRPCContext(opts: { req: Request }) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return {
    user,
    userId: user?.id,
  };
}