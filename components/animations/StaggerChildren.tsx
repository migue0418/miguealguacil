'use client'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

import type { Variants } from 'framer-motion'

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const container = {
  hidden: {},
  visible: (staggerDelay: number) => ({
    transition: { staggerChildren: staggerDelay },
  }),
}

interface StaggerChildrenProps {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}

export function StaggerChildren({ children, staggerDelay = 0.1, className }: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const prefersReduced = useReducedMotion()
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useLayoutEffect(() => {
    if (prefersReduced) return
    const el = ref.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0
    if (!alreadyVisible) {
      setShouldAnimate(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (prefersReduced) {
    return <div ref={ref} className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      variants={container}
      custom={staggerDelay}
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? (isInView ? 'visible' : 'hidden') : 'visible'}
      className={className}
    >
      {children}
    </motion.div>
  )
}
