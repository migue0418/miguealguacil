interface BadgeProps {
  label: string
  className?: string
}

export function Badge({ label, className }: BadgeProps) {
  return (
    <span
      className={`bg-accent-dim text-accent font-mono text-[0.8125rem] uppercase tracking-wide px-2 py-0.5 rounded ${className ?? ''}`}
    >
      {label}
    </span>
  )
}
