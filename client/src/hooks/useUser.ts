import useSWR from "swr";
import { swrFetcher } from "@/lib/swr";
import type { UserProfile } from "@/lib/types";

export function useUserProfile() {
  return useSWR<UserProfile>("/api/auth/me", swrFetcher);
}
