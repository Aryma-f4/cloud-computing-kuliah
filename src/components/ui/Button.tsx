import type { ButtonHTMLAttributes } from "react";

function cn(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
  size?: "md" | "lg" | "icon";
};

export function Button({ className, variant, size, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";
  
  let variantClass = "";
  if (variant === "outline") {
    variantClass = "border border-neutral-300 text-black hover:bg-neutral-100 dark:text-white dark:border-neutral-700 dark:hover:bg-neutral-800";
  } else if (variant === "ghost") {
    variantClass = "bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800";
  } else {
    variantClass = "bg-[#81A6C6] text-white hover:bg-[#6d94b5]";
  }

  let sizeClass = "h-11 px-4";
  if (size === "lg") {
    sizeClass = "h-12 px-5";
  } else if (size === "icon") {
    sizeClass = "h-10 w-10 p-0";
  }
  return (
    <button
      className={cn(base, variantClass, sizeClass, className)}
      {...props}
    />
  );
}
