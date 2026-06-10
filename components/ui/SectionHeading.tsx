interface SectionHeadingProps {
  number: string
  title: string
  className?: string
}

export function SectionHeading({ number, title, className }: SectionHeadingProps) {
  return (
    <div className={`flex items-baseline gap-3 mb-12 ${className ?? ''}`}>
      <span className="font-mono text-accent text-sm md:text-base shrink-0">
        [{number}]
      </span>
      <h2 className="font-mono uppercase tracking-widest text-primary text-sm md:text-base">
        {title}
      </h2>
    </div>
  )
}
