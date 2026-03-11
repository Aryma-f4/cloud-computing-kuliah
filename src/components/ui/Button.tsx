import type { ButtonHTMLAttributes } from "react";

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
  size?: "md" | "lg";
};

export function Button({ className, variant, size, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";
  const variantClass =
    variant === "outline"
      ? "border border-neutral-300 text-black hover:bg-neutral-100 dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-800"
      : "bg-[#81A6C6] text-white hover:bg-[#6d94b5]";
  const sizeClass = size === "lg" ? "h-12 px-5" : "h-11 px-4";
  return (
    <button
      className={cn(base, variantClass, sizeClass, className)}
      {...props}
    />
  );
}
