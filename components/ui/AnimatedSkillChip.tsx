'use client'
import { motion } from 'framer-motion'
import { staggerItem } from '@/components/animations/StaggerChildren'
import { SkillChip } from './SkillChip'

interface AnimatedSkillChipProps {
  name: string
  icon: string
}

export function AnimatedSkillChip({ name, icon }: AnimatedSkillChipProps) {
  return (
    <motion.div variants={staggerItem}>
      <SkillChip name={name} icon={icon} />
    </motion.div>
  )
}
