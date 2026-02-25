import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={
        "h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-black placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white " +
        (className ?? "")
      }
      {...props}
    />
  );
}
