import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { ensureProfileForClerkUser } from "@/libs/database/queries/profiles";

export type KrakenSessionUser = {
  /** Internal Kraken user id (`profiles.id`, used in FK columns). */
  id: string;
  email: string | null;
  clerkId: string;
};

export async function getSessionUser(): Promise<{
  user: KrakenSessionUser | null;
  error: Error | null;
}> {
  const { userId: clerkId } = auth();
  if (!clerkId) {
    return { user: null, error: null };
  }

  try {
    const clerkUser = await currentUser();
    const profile = await ensureProfileForClerkUser({
      clerkId,
      fullName:
        clerkUser?.fullName?.trim() ||
        clerkUser?.firstName?.trim() ||
        clerkUser?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
        null,
      avatarUrl: clerkUser?.imageUrl ?? null,
    });

    return {
      user: {
        id: profile.id,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? null,
        clerkId,
      },
      error: null,
    };
  } catch (e) {
    return {
      user: null,
      error: e instanceof Error ? e : new Error("session_lookup_failed"),
    };
  }
}
