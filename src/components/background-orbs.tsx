type BackgroundOrbsProps = {
  variant?: "default" | "minimal";
};

export default function BackgroundOrbs({
  variant = "default",
}: BackgroundOrbsProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-[120px] opacity-30 dark:opacity-100" />
      <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-violet-500/20 blur-[140px] opacity-30 dark:opacity-100" />
      {variant === "default" ? (
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-[120px] opacity-30 dark:opacity-100" />
      ) : null}
    </div>
  );
}
