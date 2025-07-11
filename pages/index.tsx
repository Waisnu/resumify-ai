import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { FileUpload } from '@/components/ui/file-upload'
import { useToast } from '@/hooks/use-toast'
import {
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  CheckCircle,
  Award,
  Upload,
  Brain,
  Search,
  Lightbulb,
  TrendingUp,
  Star,
  Eye
} from 'lucide-react'

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [hasStoredAnalysis, setHasStoredAnalysis] = useState(false)
  const [storedFileName, setStoredFileName] = useState<string>('')
  const router = useRouter()
  const { toast } = useToast()

  // Check for stored analysis on component mount
  useEffect(() => {
    const storedResults = localStorage.getItem('resumeAnalysis');
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setHasStoredAnalysis(true);
        setStoredFileName(parsedResults.fileName || 'Previous Analysis');
      } catch (error) {
        console.error('Error parsing stored analysis:', error);
        localStorage.removeItem('resumeAnalysis');
        localStorage.removeItem('resumeText');
      }
    }
  }, [])

  const analysisSteps = [
    { icon: Upload, message: "Extracting content from your resume...", color: "text-blue-400" },
    { icon: Brain, message: "AI is analyzing your experience...", color: "text-purple-400" },
    { icon: Search, message: "Scanning for optimization opportunities...", color: "text-green-400" },
    { icon: Lightbulb, message: "Generating personalized insights...", color: "text-yellow-400" },
    { icon: TrendingUp, message: "Preparing your detailed report...", color: "text-orange-400" },
    { icon: Star, message: "Almost ready! Finalizing analysis...", color: "text-pink-400" }
  ]

  const handleFileSelect = async (file: File) => {
    if (isAnalyzing) return;

    setSelectedFile(file)
    setIsAnalyzing(true)
    setAnalysisStep(0)
    setProgress(0)

    try {
      // Animate through steps
      for (let i = 0; i < analysisSteps.length; i++) {
        setAnalysisStep(i)
        setProgress((i / analysisSteps.length) * 80) // 80% for visual steps
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      // Step 1: Upload file to get extracted text
      const formData = new FormData();
      formData.append('file', file);

      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const extractData = await extractResponse.json();
      setProgress(90)

      if (!extractResponse.ok) {
        throw new Error(extractData.error || 'Failed to extract text from resume.');
      }

      // Step 2: Send extracted text to be analyzed
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractData.text }),
      });

      const analysisResult = await analyzeResponse.json();
      setProgress(100)

      if (!analyzeResponse.ok) {
        throw new Error(analysisResult.error || 'Failed to analyze resume.');
      }

      // Step 3: Store result and resume text in localStorage and navigate
      localStorage.setItem('resumeAnalysis', JSON.stringify({ ...analysisResult, fileName: file.name }));
      localStorage.setItem('resumeText', extractData.text);
      
      // Small delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500))
      
      router.push('/results');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error('Analysis process failed:', errorMessage);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      })
      setIsAnalyzing(false)
      setSelectedFile(null)
      setAnalysisStep(0)
      setProgress(0)
    }
  }

  const features = [
    {
      icon: Zap,
      title: "Instant Analysis",
      description: "Get comprehensive feedback in under 10 seconds",
      color: "text-yellow-400"
    },
    {
      icon: Target,
      title: "Precision Insights",
      description: "AI-powered suggestions for formatting, tone, and content",
      color: "text-blue-400"
    },
    {
      icon: CheckCircle,
      title: "HR Perspective",
      description: "See exactly how recruiters view your resume",
      color: "text-green-400"
    },
    {
      icon: Award,
      title: "Professional Reports",
      description: "Download detailed PDF reports to share",
      color: "text-purple-400"
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Logo />
          {hasStoredAnalysis && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Button
                variant="outline"
                onClick={() => router.push('/results')}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Last Analysis
              </Button>
            </motion.div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-primary/10 to-transparent blur-3xl" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-500/10 to-transparent blur-3xl" />
        </div>
        
        <div className="container px-6 mx-auto">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="bg-primary/10 border-primary/20 text-primary"
                  >
                    <Sparkles className="mr-2 h-3 w-3" />
                    Instant AI Feedback
                  </Badge>
                </motion.div>

                <motion.h1
                  className="text-6xl lg:text-7xl font-bold leading-tight tracking-tighter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <span className="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">
                    Don't Just Apply.
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    Get Hired.
                  </span>
                </motion.h1>

                <motion.p
                  className="text-xl text-muted-foreground leading-relaxed max-w-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  Resumify instantly analyzes your resume, providing expert feedback to help you stand out and land your dream job.
                </motion.p>
              </div>
            </motion.div>

            {/* Right Column - File Upload */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <Card className="p-8 backdrop-glass border-primary/20 bg-background/50">
                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div
                      key="analyzing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center space-y-6 py-12"
                    >
                      {/* Dynamic Icon Animation */}
                      <motion.div className="relative">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="inline-block"
                        >
                          {React.createElement(analysisSteps[analysisStep]?.icon || Sparkles, {
                            className: `h-16 w-16 ${analysisSteps[analysisStep]?.color || 'text-primary'}`
                          })}
                        </motion.div>
                        
                        {/* Floating particles */}
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-primary/30 rounded-full"
                            animate={{
                              x: [0, 20, -20, 0],
                              y: [0, -30, 30, 0],
                              opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              delay: i * 0.5,
                              ease: "easeInOut"
                            }}
                            style={{
                              left: `${30 + i * 20}%`,
                              top: `${30 + i * 15}%`
                            }}
                          />
                        ))}
                      </motion.div>

                      {/* Progress Bar */}
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-blue-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>

                      {/* Dynamic Message */}
                      <div className="space-y-2">
                        <motion.h3 
                          className="text-xl font-semibold"
                          key={analysisStep}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          Analyzing Your Resume
                        </motion.h3>
                        <motion.p 
                          className={`text-muted-foreground ${analysisSteps[analysisStep]?.color || 'text-primary'}`}
                          key={`step-${analysisStep}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4 }}
                        >
                          {analysisSteps[analysisStep]?.message || "Processing your resume..."}
                        </motion.p>
                        <motion.p
                          className="text-xs text-muted-foreground"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {progress}% Complete
                        </motion.p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <FileUpload onFileSelect={handleFileSelect} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tighter">Why Choose Resumify?</h2>
            <p className="text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
              Our AI-powered platform gives you the ultimate edge in your job search.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 * index, duration: 0.6 }}
                className="flex"
              >
                <Card className="flex flex-col text-center bg-card/50 hover:bg-card/90 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader className="flex-shrink-0">
                    <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full">
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Index;
