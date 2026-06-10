import { Nav } from './Nav'
import { ThemeToggle } from './ThemeToggle'
import { LocaleToggle } from './LocaleToggle'

export async function Header() {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-default">
      <div className="max-w-[1200px] mx-auto px-5 md:px-20 h-16 flex items-center justify-between">
        <a
          href="#hero"
          className="font-mono text-sm font-medium text-primary hover:text-accent transition-colors"
        >
          miguealguacil
        </a>
        <div className="flex items-center gap-4">
          <Nav />
          <div className="flex items-center gap-1">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
