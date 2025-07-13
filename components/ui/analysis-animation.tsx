import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Brain, 
  Lightbulb, 
  PenTool, 
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react';

const analysisSteps = [
  { 
    icon: FileText, 
    title: "Reading your resume",
    subtitle: "Parsing structure and content",
    detail: "Extracting sections, formatting, and key information",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  { 
    icon: Search, 
    title: "Scanning for keywords",
    subtitle: "Identifying relevant skills and experience",
    detail: "Cross-referencing with industry standards and job market trends",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10"
  },
  { 
    icon: Brain, 
    title: "Analyzing content depth",
    subtitle: "Evaluating impact and achievements",
    detail: "Measuring quantifiable results and career progression",
    color: "text-purple-400",
    bg: "bg-purple-400/10"
  },
  { 
    icon: Lightbulb, 
    title: "Identifying gaps",
    subtitle: "Finding improvement opportunities",
    detail: "Comparing against top-performing resumes in your field",
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  },
  { 
    icon: PenTool, 
    title: "Crafting recommendations",
    subtitle: "Generating personalized suggestions",
    detail: "Creating actionable improvements tailored to your profile",
    color: "text-green-400",
    bg: "bg-green-400/10"
  },
  { 
    icon: CheckCircle2, 
    title: "Finalizing your report",
    subtitle: "Preparing comprehensive feedback",
    detail: "Organizing insights into a clear, actionable improvement plan",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  }
];

const AnimatedText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }
    }, 30 + Math.random() * 20);

    return () => clearTimeout(timeout);
  }, [currentIndex, text]);

  useEffect(() => {
    setDisplayText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-0.5 h-5 bg-current ml-1"
      />
    </span>
  );
};

const ProgressDots = ({ total, current }: { total: number; current: number }) => (
  <div className="flex space-x-2 justify-center">
    {[...Array(total)].map((_, i) => (
      <motion.div
        key={i}
        className={`w-2 h-2 rounded-full ${
          i <= current ? 'bg-blue-400' : 'bg-slate-700'
        }`}
        animate={{
          scale: i === current ? [1, 1.3, 1] : 1,
          opacity: i === current ? [0.7, 1, 0.7] : i <= current ? 1 : 0.3
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    ))}
  </div>
);

const FloatingIcon = ({ icon: Icon, delay }: { icon: React.ElementType; delay: number }) => (
  <motion.div
    className="absolute text-slate-600"
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: [0, 0.6, 0],
      y: [20, -20, -40],
      x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30]
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      delay: delay,
      ease: "easeOut"
    }}
  >
    <Icon className="w-4 h-4" />
  </motion.div>
);

export const AnalysisAnimation = ({
  isAnalyzing,
  analysisStep,
  fileName
}: {
  isAnalyzing: boolean;
  analysisStep: number;
  fileName: string | null;
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const currentStep = analysisSteps[Math.min(analysisStep, analysisSteps.length - 1)];

  useEffect(() => {
    if (isAnalyzing) {
      const timer = setTimeout(() => setShowDetail(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowDetail(false);
    }
  }, [isAnalyzing, analysisStep]);

  return (
    <AnimatePresence>
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="relative max-w-md w-full mx-4">
            
            {/* Floating background icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[Sparkles, Zap, Brain, Lightbulb].map((Icon, i) => (
                <FloatingIcon key={i} icon={Icon} delay={i * 0.8} />
              ))}
            </div>

            {/* Main content */}
            <div className="relative bg-slate-900/50 rounded-2xl p-8 border border-slate-800 backdrop-blur-sm">
              
              {/* File name */}
              {fileName && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-6"
                >
                  <p className="text-slate-400 text-sm mb-1">Analyzing</p>
                  <p className="text-slate-200 font-medium">{fileName}</p>
                </motion.div>
              )}

              {/* Central icon */}
              <motion.div
                className="flex justify-center mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className={`relative p-4 rounded-full ${currentStep.bg} border border-slate-700`}>
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <currentStep.icon className={`w-8 h-8 ${currentStep.color}`} />
                  </motion.div>
                  
                  {/* Pulse effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-full ${currentStep.bg} border border-current`}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </motion.div>

              {/* Step title */}
              <motion.div
                className="text-center mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className={`text-xl font-semibold mb-2 ${currentStep.color}`}>
                  <AnimatedText text={currentStep.title} />
                </h2>
                <p className="text-slate-400 text-sm">
                  <AnimatedText text={currentStep.subtitle} delay={500} />
                </p>
              </motion.div>

              {/* Detail text */}
              <AnimatePresence>
                {showDetail && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center mb-6 overflow-hidden"
                  >
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {currentStep.detail}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress */}
              <div className="space-y-3">
                <ProgressDots total={analysisSteps.length} current={analysisStep} />
                
                <div className="text-center">
                  <span className="text-slate-400 text-sm">
                    Step {analysisStep + 1} of {analysisSteps.length}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};