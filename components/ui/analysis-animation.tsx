import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BrainCircuit, FileText, ScanSearch, Sparkles, Wand, CheckCircle } from 'lucide-react'

const analysisSteps = [
  { icon: FileText, message: "Deconstructing your resume's structure...", color: "text-cyan-400" },
  { icon: ScanSearch, message: "Scanning for keywords and experience...", color: "text-sky-400" },
  { icon: BrainCircuit, message: "Engaging neural networks for deep analysis...", color: "text-blue-400" },
  { icon: Sparkles, message: "Finding opportunities for enhancement...", color: "text-indigo-400" },
  { icon: Wand, message: "Crafting actionable, expert suggestions...", color: "text-purple-400" },
  { icon: CheckCircle, message: "Compiling your personalized improvement plan...", color: "text-violet-400" }
]

const PARTICLE_COUNT = 30;

const Node = ({ icon: Icon, delay }: { icon: React.ElementType, delay: number }) => (
    <motion.div
        className="absolute w-8 h-8 bg-slate-700/50 border border-slate-600 rounded-full flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
            opacity: [0, 1, 0.8, 0],
            scale: [0.5, 1.2, 1, 0.5],
            transition: { duration: 3, repeat: Infinity, delay, ease: "easeInOut" }
        }}
    >
        <Icon className="w-5 h-5 text-slate-400" />
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
    const currentStep = analysisSteps[analysisStep];

    return (
        <AnimatePresence>
            {isAnalyzing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg flex flex-col items-center justify-center z-50 overflow-hidden"
                >
                    {/* Background decorative elements */}
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_800px_at_50%_400px,#1e293b,transparent)] opacity-30" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.2)_1px,transparent_0)] bg-[length:40px_40px] opacity-10" />
                    </div>

                    {/* Central Brain Animation */}
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        {/* Pulsing Core */}
                        <motion.div
                            className="absolute w-24 h-24 bg-primary/20 rounded-full"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.div
                             className="absolute w-40 h-40 bg-primary/10 rounded-full"
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        />
                        
                        {/* Central Icon */}
                        <motion.div
                            className="relative w-20 h-20 bg-slate-800 border-2 border-primary/50 rounded-full flex items-center justify-center shadow-2xl shadow-primary/20"
                            initial={{ scale: 0.8, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <BrainCircuit className="w-10 h-10 text-primary" />
                        </motion.div>

                        {/* Orbiting particles */}
                        {[...Array(PARTICLE_COUNT)].map((_, i) => {
                            const angle = (i / PARTICLE_COUNT) * 2 * Math.PI;
                            const radius = Math.random() * 100 + 120; // 120-220
                            return (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 bg-slate-500 rounded-full"
                                    style={{
                                        originX: `${-radius/8}rem`,
                                        originY: `${-radius/8}rem`,
                                    }}
                                    animate={{
                                        rotate: [0, 360],
                                        opacity: [0, 0.8, 0],
                                    }}
                                    transition={{
                                        duration: Math.random() * 10 + 10,
                                        repeat: Infinity,
                                        ease: "linear",
                                        delay: Math.random() * 5
                                    }}
                                />
                            )
                        })}
                    </div>
                    
                    {/* File Name */}
                     {fileName && (
                        <p className="mt-12 text-lg font-medium text-slate-300 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
                            Analyzing: <span className="font-bold text-slate-100">{fileName}</span>
                        </p>
                    )}

                    {/* Analysis Step Text */}
                    <div className="mt-6 text-center h-12">
                         <AnimatePresence mode="wait">
                            <motion.div
                                key={analysisStep}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="flex items-center justify-center"
                            >
                                <currentStep.icon className={`w-6 h-6 mr-3 ${currentStep.color}`} />
                                <p className={`text-xl font-semibold ${currentStep.color}`}>
                                    {currentStep.message}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
    )
} 