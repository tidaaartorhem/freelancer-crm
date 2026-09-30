"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-white px-6 py-16 text-center"
    >
      <AlertCircle className="mb-3 size-8 text-red-500" />
      <h1 className="text-base font-semibold text-zinc-900">
        Something went wrong
      </h1>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">
        {error.message || "This page couldn't be loaded. Please try again."}
      </p>
      <Button onClick={reset} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
