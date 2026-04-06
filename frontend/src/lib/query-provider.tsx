import { QueryClient, QueryClientProvider, keepPreviousData } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      placeholderData: keepPreviousData,
    },
  },
});

export function LiveQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
