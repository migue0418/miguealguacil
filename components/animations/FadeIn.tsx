'use client'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

interface FadeInProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className }: FadeInProps) {
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
      initial={shouldAnimate ? { opacity: 0 } : false}
      animate={shouldAnimate ? (isInView ? { opacity: 1 } : { opacity: 0 }) : undefined}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
