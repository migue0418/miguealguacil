import {
  Workflow,
  GitGraph,
  Database,
  Flame,
  Hexagon,
  Boxes,
  Layers,
  Code,
  Zap,
  Atom,
  FileCode,
  Triangle,
  Container,
  GitBranch,
  Cloud,
  CloudCog,
  Server,
  Leaf,
  Languages,
  Globe,
  type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Workflow,
  GitGraph,
  Database,
  Flame,
  Hexagon,
  Boxes,
  Layers,
  Code,
  Zap,
  Atom,
  FileCode,
  Triangle,
  Container,
  GitBranch,
  Cloud,
  CloudCog,
  Server,
  Leaf,
  Languages,
  Globe,
}

interface SkillChipProps {
  name: string
  icon: string
}

export function SkillChip({ name, icon }: SkillChipProps) {
  const IconComponent = ICON_MAP[icon]

  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-default bg-surface rounded hover:border-accent transition-colors">
      {IconComponent && <IconComponent className="text-accent shrink-0" size={16} aria-hidden />}
      <span className="font-mono text-sm text-primary uppercase">{name}</span>
    </div>
  )
}
