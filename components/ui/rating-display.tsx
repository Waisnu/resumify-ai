import React from 'react'
import { motion } from 'framer-motion'
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingDisplayProps {
  score: number // 0-5 scale
  sentiment: 'excellent' | 'good' | 'fair' | 'poor'
  className?: string
  showAnimation?: boolean
}

const sentimentConfig = {
  excellent: {
    color: 'text-rating-excellent',
    bgColor: 'bg-rating-excellent/10',
    borderColor: 'border-rating-excellent/30',
    icon: TrendingUp,
    label: 'Excellent',
    description: 'Outstanding resume quality'
  },
  good: {
    color: 'text-rating-good',
    bgColor: 'bg-rating-good/10',
    borderColor: 'border-rating-good/30',
    icon: TrendingUp,
    label: 'Good',
    description: 'Strong resume with minor improvements needed'
  },
  fair: {
    color: 'text-rating-fair',
    bgColor: 'bg-rating-fair/10',
    borderColor: 'border-rating-fair/30',
    icon: Minus,
    label: 'Fair',
    description: 'Decent resume with room for improvement'
  },
  poor: {
    color: 'text-rating-poor',
    bgColor: 'bg-rating-poor/10',
    borderColor: 'border-rating-poor/30',
    icon: TrendingDown,
    label: 'Needs Work',
    description: 'Significant improvements required'
  }
}

export function RatingDisplay({ 
  score, 
  sentiment, 
  className, 
  showAnimation = true 
}: RatingDisplayProps) {
  const config = sentimentConfig[sentiment]
  const Icon = config.icon
  const filledStars = Math.floor(score)
  const hasHalfStar = score % 1 >= 0.5

  return (
    <motion.div
      className={cn(
        "p-6 rounded-2xl border backdrop-glass",
        config.bgColor,
        config.borderColor,
        className
      )}
      initial={showAnimation ? { opacity: 0, scale: 0.9 } : false}
      animate={showAnimation ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-4">
        {/* Score Circle */}
        <motion.div 
          className="relative mx-auto w-24 h-24"
          initial={showAnimation ? { scale: 0 } : false}
          animate={showAnimation ? { scale: 1 } : false}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted/20"
            />
            <motion.circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 40}`}
              className={config.color}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - score / 5) }}
              transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span 
              className={cn("text-2xl font-bold", config.color)}
              initial={showAnimation ? { opacity: 0 } : false}
              animate={showAnimation ? { opacity: 1 } : false}
              transition={{ delay: 0.8 }}
            >
              {Number(score).toFixed(1)}
            </motion.span>
          </div>
        </motion.div>

        {/* Stars */}
        <motion.div 
          className="flex justify-center space-x-1"
          initial={showAnimation ? { opacity: 0, y: 10 } : false}
          animate={showAnimation ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 1, duration: 0.5 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={showAnimation ? { scale: 0, rotate: -180 } : false}
              animate={showAnimation ? { scale: 1, rotate: 0 } : false}
              transition={{ 
                delay: 1.2 + i * 0.1, 
                type: "spring", 
                stiffness: 200 
              }}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  i < filledStars || (i === filledStars && hasHalfStar)
                    ? `${config.color} fill-current`
                    : "text-muted/30"
                )}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Sentiment */}
        <motion.div
          className="space-y-2"
          initial={showAnimation ? { opacity: 0, y: 10 } : false}
          animate={showAnimation ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <div className={cn("flex items-center justify-center space-x-2", config.color)}>
            <Icon className="h-5 w-5" />
            <span className="font-semibold text-lg">{config.label}</span>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </motion.div>
      </div>
    </motion.div>
  )
}