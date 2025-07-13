import React from 'react'
import { motion, Variants } from 'framer-motion'
import { Star, StarHalf, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingDisplayProps {
  score: number // 0-5 scale
  sentiment: 'excellent' | 'good' | 'fair' | 'poor'
  className?: string
  showAnimation?: boolean
}

const sentimentConfig = {
  excellent: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    icon: TrendingUp,
    label: 'Excellent',
    description: 'Outstanding resume quality',
  },
  good: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: TrendingUp,
    label: 'Good',
    description: 'Strong resume with minor improvements needed',
  },
  fair: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: Minus,
    label: 'Fair',
    description: 'Decent resume with room for improvement',
  },
  poor: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: TrendingDown,
    label: 'Needs Work',
    description: 'Significant improvements required',
  },
}

export function RatingDisplay({ 
  score, 
  sentiment, 
  className, 
  showAnimation = true 
}: RatingDisplayProps) {
  const config = sentimentConfig[sentiment]

  if (!config) {
    return null
  }

  const filledStars = Math.floor(score)
  const hasHalfStar = score % 1 >= 0.5;

  const animationProps = (delay = 0) => showAnimation ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: delay * 0.2, type: 'spring' as const, stiffness: 150, damping: 20 }
  } : {};

  const starVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  };

  return (
    <div
      className={cn(
        "w-full text-center p-6 rounded-lg",
        config.bgColor,
        config.borderColor,
        'border',
        className
      )}
    >
      <motion.div {...animationProps(1)}>
        <h3 className="text-lg font-semibold text-slate-200">Overall Score</h3>
      </motion.div>
      
      <motion.div 
        className="my-4 text-6xl font-bold"
        {...animationProps(2)}
      >
        <span className={config.color}>{Number(score).toFixed(1)}</span>
        <span className="text-3xl text-slate-500">/5</span>
      </motion.div>

      <motion.div 
        className="flex justify-center space-x-1"
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.1, delayChildren: 0.5 }}
      >
        {[...Array(5)].map((_, i) => {
          const starProps = {
            key: i,
            className: "h-7 w-7",
          };
          if (i < filledStars) {
            return (
              <motion.div variants={starVariants}>
                <Star {...starProps} className={cn(starProps.className, "text-amber-400 fill-amber-400")} />
              </motion.div>
            );
          }
          if (i === filledStars && hasHalfStar) {
            return (
              <motion.div variants={starVariants}>
                <StarHalf {...starProps} className={cn(starProps.className, "text-amber-400 fill-amber-400")} />
              </motion.div>
            );
          }
          return (
            <motion.div variants={starVariants}>
              <Star {...starProps} className={cn(starProps.className, "text-slate-600")} />
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div className="mt-6" {...animationProps(4)}>
        <div className={cn("inline-flex items-center gap-2 font-semibold text-lg py-1 px-3 rounded-full", config.bgColor, config.color)}>
          <config.icon className="h-5 w-5" />
          <span>{config.label}</span>
        </div>
        <p className="text-sm text-slate-400 mt-2">{config.description}</p>
      </motion.div>
    </div>
  )
}