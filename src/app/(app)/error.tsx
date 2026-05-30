"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorState({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
        <p className="text-zinc-500 max-w-md mx-auto">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
      </div>
      <Button onClick={() => reset()} className="mt-4 bg-[#E8400C] text-white">
        <RefreshCcw className="mr-2 h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
