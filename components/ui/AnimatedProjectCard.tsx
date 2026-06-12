'use client'
import { motion } from 'framer-motion'
import { staggerItem } from '@/components/animations/StaggerChildren'
import { ProjectCard } from './ProjectCard'
import type { Project } from '@/lib/types'

interface AnimatedProjectCardProps {
  project: Project
  index: string
  labels: {
    viewRepo: string
    viewBackend: string
    viewMod: string
    viewDemo: string
    viewDetails: string
  }
}

export function AnimatedProjectCard({ project, index, labels }: AnimatedProjectCardProps) {
  return (
    <motion.div variants={staggerItem}>
      <ProjectCard project={project} index={index} labels={labels} />
    </motion.div>
  )
}
