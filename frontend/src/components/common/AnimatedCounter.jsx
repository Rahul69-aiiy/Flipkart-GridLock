import { useState, useEffect } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export default function AnimatedCounter({ value, decimals = 0, duration = 1.5, className = '' }) {
  const [display, setDisplay] = useState(0)
  const spring = useSpring(0, { duration: duration * 1000 })
  const rounded = useTransform(spring, (v) =>
    decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-IN')
  )

  useEffect(() => {
    spring.set(Number(value) || 0)
  }, [value, spring])

  useEffect(() => {
    return rounded.on('change', (v) => setDisplay(v))
  }, [rounded])

  return (
    <motion.span className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {display}
    </motion.span>
  )
}
