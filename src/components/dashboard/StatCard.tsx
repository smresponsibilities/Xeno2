'use client'

import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: number | undefined
  icon: React.ReactNode
  isLoading: boolean
  animationVariants?: any
  color: [string, string]
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  isLoading, 
  animationVariants, 
  color 
}: StatCardProps) {
  const formatValue = (val: number | undefined) => {
    if (val === undefined) return '0'
    
    if (title.includes('Revenue')) {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    
    return val.toLocaleString()
  }

  return (
    <motion.div
      variants={animationVariants}
      className="p-6 glass-card rounded-2xl shadow-xl border border-obsidian-border/50 relative overflow-hidden hover:border-obsidian-accent/30 transition-all duration-300"
    >
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${color[0]} 0%, ${color[1]} 100%)`
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <div className="mt-2 h-8 bg-obsidian-border rounded animate-pulse"></div>
            ) : (
              <p className="mt-2 text-3xl font-bold text-foreground">
                {formatValue(value)}
              </p>
            )}
          </div>
          <div 
            className="p-4 rounded-xl glass-card"
            style={{ 
              background: `linear-gradient(135deg, ${color[0]}20 0%, ${color[1]}20 100%)`,
              border: `1px solid ${color[0]}30`
            }}
          >
            <div style={{ color: color[0] }}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
