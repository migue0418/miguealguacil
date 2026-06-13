import type { ExperienceItem } from '@/lib/types'

type SupportedLocale = 'es' | 'en'

interface TimelineItemProps {
  item: ExperienceItem
  presentLabel: string
  locale: SupportedLocale
}

const DATE_LOCALE_MAP: Record<SupportedLocale, string> = {
  es: 'es-ES',
  en: 'en-US',
}

function formatDate(dateStr: string, locale: SupportedLocale): string {
  const [year, month] = dateStr.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString(DATE_LOCALE_MAP[locale], { month: 'short', year: 'numeric' })
}

export function TimelineItem({ item, presentLabel, locale }: TimelineItemProps) {
  const startFormatted = formatDate(item.startDate, locale)
  const endFormatted = item.endDate ? formatDate(item.endDate, locale) : presentLabel

  return (
    <div className="relative pl-6 border-l-2 border-default">
      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[var(--color-accent)]" />
      <div className="mb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h3 className="font-display font-medium text-primary text-[1.0625rem]">{item.role}</h3>
        <span className="font-mono text-xs text-muted shrink-0 uppercase tracking-wide">
          {startFormatted} — {endFormatted}
        </span>
      </div>
      <p className="text-sm font-medium text-accent mb-3">{item.company}</p>
      <ul className="space-y-1.5">
        {item.bullets.map((bullet, i) => (
          <li key={i} className="text-sm text-muted leading-relaxed flex gap-2">
            <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--color-muted)] shrink-0" />
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  )
}
