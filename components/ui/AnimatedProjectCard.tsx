'use client'
import { motion } from 'framer-motion'
import { staggerItem } from '@/components/animations/StaggerChildren'
import { ProjectCard } from './ProjectCard'
import type { Project } from '@/lib/types'

interface AnimatedProjectCardProps {
  project: Project
  labels: {
    viewRepo: string
    viewBackend: string
    viewMod: string
    viewDemo: string
  }
}

export function AnimatedProjectCard({ project, labels }: AnimatedProjectCardProps) {
  return (
    <motion.div variants={staggerItem} className="h-full">
      <ProjectCard project={project} labels={labels} />
    </motion.div>
  )
}
