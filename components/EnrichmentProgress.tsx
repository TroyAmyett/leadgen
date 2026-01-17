'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface EnrichmentProgressProps {
  current: number
  total: number
}

export function EnrichmentProgress({ current, total }: EnrichmentProgressProps) {
  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-fl-primary/20">
          <Sparkles className="w-4 h-4 text-fl-primary animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-medium text-fl-text-primary">
            Enriching leads...
          </p>
          <p className="text-xs text-fl-text-muted">
            {current} of {total} completed
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-fl-bg-surface rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-fl-primary rounded-full"
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  )
}
