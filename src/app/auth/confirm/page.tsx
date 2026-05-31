"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * /auth/confirm
 *
 * Supabase sends invite/recovery emails that redirect to the site root or this
 * page with a URL fragment like:
 *   https://ops.hisako.eu/auth/confirm#access_token=...&refresh_token=...&type=invite
 *
 * Server components never see URL hashes. This client page reads the fragment,
 * calls setSession(), then routes the user:
 *   - type=invite | recovery  →  /update-password
 *   - anything else           →  /dashboard
 */
export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying your link…");

  useEffect(() => {
    const supabase = createClient();

    const hash = window.location.hash.substring(1); // strip leading #
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type"); // "invite" | "recovery" | "magiclink" | etc.

    if (!accessToken || !refreshToken) {
      setStatus("Invalid or expired link. Redirecting to login…");
      setTimeout(() => router.replace("/login?error=Invalid+or+expired+link"), 2000);
      return;
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setStatus("Session error. Redirecting to login…");
          setTimeout(() => router.replace("/login?error=" + encodeURIComponent(error.message)), 2000);
          return;
        }

        if (type === "invite" || type === "recovery") {
          setStatus("Link verified. Setting up your account…");
          router.replace("/update-password");
        } else {
          setStatus("Link verified. Redirecting to dashboard…");
          router.replace("/dashboard");
        }
      });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
        <span className="text-xl font-bold">H</span>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">{status}</p>
    </div>
  );
}
