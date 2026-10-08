import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../services/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      retry: (attempt, error) =>
        attempt < 2 &&
        (!(error instanceof ApiError) ||
          error.status === 0 ||
          error.status >= 500),
    },
    // Retrying writes automatically may create duplicate bookings.
    mutations: { retry: false },
  },
});
