import type { PropsWithChildren } from "react";

export function ErrorAlert({ children }: PropsWithChildren) {
  return (
    <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
      {children}
    </div>
  );
}
