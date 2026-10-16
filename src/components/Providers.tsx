"use client";

import { trpc } from '@/app/_trpc/client';
import { absoluteUrl } from '@/lib/utils';
import {
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { PropsWithChildren, useState } from "react";
import ThemeSync from "@/components/ThemeSync";

const Providers = ({children}:PropsWithChildren) => {
  const [queryClient] = useState(() => new QueryClient);
  const [trpcClient] = useState(() => trpc.createClient({
    links: [
      httpBatchLink({
        url: absoluteUrl("/api/trpc"),
      })
    ]
  }))

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeSync />
        { children }
      </QueryClientProvider>
    </trpc.Provider>
  )
}

export default Providers