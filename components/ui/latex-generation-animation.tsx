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
  Zap,
  Code,
  Layers,
  Wrench,
  Cpu
} from 'lucide-react';

const generationSteps = [
  { 
    icon: FileText, 
    title: "Analyzing resume structure",
    subtitle: "Understanding your professional profile",
    detail: "Parsing sections, experience, and formatting preferences",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  { 
    icon: Search, 
    title: "Selecting optimal template",
    subtitle: "Matching template to your profile",
    detail: "Choosing the best LaTeX template for your industry and experience",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10"
  },
  { 
    icon: Brain, 
    title: "Processing content mapping",
    subtitle: "Intelligent content organization",
    detail: "Mapping your experience to LaTeX template sections",
    color: "text-purple-400",
    bg: "bg-purple-400/10"
  },
  { 
    icon: Cpu, 
    title: "Optimizing for ATS systems",
    subtitle: "Ensuring compatibility",
    detail: "Structuring content for applicant tracking systems",
    color: "text-orange-400",
    bg: "bg-orange-400/10"
  },
  { 
    icon: Code, 
    title: "Generating LaTeX code",
    subtitle: "Creating professional markup",
    detail: "Converting your content into clean, compilable LaTeX",
    color: "text-green-400",
    bg: "bg-green-400/10"
  },
  { 
    icon: Layers, 
    title: "Applying formatting rules",
    subtitle: "Professional styling",
    detail: "Implementing consistent fonts, spacing, and layout",
    color: "text-pink-400",
    bg: "bg-pink-400/10"
  },
  { 
    icon: Lightbulb, 
    title: "Enhancing readability",
    subtitle: "Optimizing visual hierarchy",
    detail: "Adjusting sections for maximum impact and clarity",
    color: "text-amber-400",
    bg: "bg-amber-400/10"
  },
  { 
    icon: PenTool, 
    title: "Personalizing content",
    subtitle: "Tailoring to your strengths",
    detail: "Highlighting your unique value proposition",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10"
  },
  { 
    icon: Wrench, 
    title: "Finalizing compilation",
    subtitle: "Ensuring error-free output",
    detail: "Validating LaTeX syntax and structure",
    color: "text-teal-400",
    bg: "bg-teal-400/10"
  },
  { 
    icon: CheckCircle2, 
    title: "Ready for Overleaf",
    subtitle: "Your professional resume is complete",
    detail: "Delivering publication-quality LaTeX code",
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
    }, 25 + Math.random() * 15);

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
  <div className="flex justify-center space-x-2">
    {Array.from({ length: total }, (_, i) => (
      <motion.div
        key={i}
        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          i <= current ? 'bg-primary' : 'bg-slate-700'
        }`}
        initial={{ scale: 0.8 }}
        animate={{ 
          scale: i === current ? [0.8, 1.2, 0.8] : 0.8,
          opacity: i <= current ? 1 : 0.5
        }}
        transition={{ 
          duration: i === current ? 1.5 : 0.3,
          repeat: i === current ? Infinity : 0
        }}
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

export const LaTeXGenerationAnimation = ({
  isGenerating,
  templateName
}: {
  isGenerating: boolean;
  templateName: string | null;
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [adaptiveStep, setAdaptiveStep] = useState(0);
  
  const currentStep = generationSteps[Math.min(adaptiveStep, generationSteps.length - 1)];

  // Smart timing logic
  useEffect(() => {
    if (isGenerating && !startTime) {
      setStartTime(Date.now());
      setAdaptiveStep(0);
    } else if (!isGenerating) {
      setStartTime(null);
      setAdaptiveStep(0);
    }
  }, [isGenerating, startTime]);

  // Adaptive step progression
  useEffect(() => {
    if (!isGenerating || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const expectedTotalTime = 25000; // 25 seconds expected for LaTeX generation
      const progress = Math.min(elapsed / expectedTotalTime, 0.9); // Cap at 90% until completion
      const targetStep = Math.floor(progress * (generationSteps.length - 1));
      
      if (targetStep > adaptiveStep && adaptiveStep < generationSteps.length - 1) {
        setAdaptiveStep(targetStep);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isGenerating, startTime, adaptiveStep]);

  // Force completion when generation is done
  useEffect(() => {
    if (!isGenerating && adaptiveStep < generationSteps.length - 1) {
      setAdaptiveStep(generationSteps.length - 1);
    }
  }, [isGenerating, adaptiveStep]);

  useEffect(() => {
    if (isGenerating) {
      const timer = setTimeout(() => setShowDetail(true), 600);
      return () => clearTimeout(timer);
    } else {
      setShowDetail(false);
    }
  }, [isGenerating, adaptiveStep]);

  return (
    <AnimatePresence>
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div className="relative max-w-md w-full mx-4">
            
            {/* Floating background icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[Sparkles, Zap, Code, Layers, Brain, Cpu].map((Icon, i) => (
                <FloatingIcon key={i} icon={Icon} delay={i * 0.8} />
              ))}
            </div>

            {/* Main content */}
            <div className="relative bg-slate-900/50 rounded-2xl p-8 border border-slate-800 backdrop-blur-sm">
              
              {/* Template name */}
              {templateName && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-6"
                >
                  <p className="text-slate-400 text-sm mb-1">Generating LaTeX for</p>
                  <p className="text-slate-200 font-medium">{templateName}</p>
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
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  >
                    <currentStep.icon className={`w-8 h-8 ${currentStep.color}`} />
                  </motion.div>
                  
                  {/* Pulse effect */}
                  <motion.div
                    className={`absolute inset-0 rounded-full ${currentStep.bg} border border-current`}
                    animate={{
                      scale: [1, 1.3, 1],
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
                  <AnimatedText text={currentStep.subtitle} delay={400} />
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
                <ProgressDots total={generationSteps.length} current={adaptiveStep} />
                
                <div className="text-center">
                  <span className="text-slate-400 text-sm">
                    Step {adaptiveStep + 1} of {generationSteps.length}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${((adaptiveStep + 1) / generationSteps.length) * 100}%` }}
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