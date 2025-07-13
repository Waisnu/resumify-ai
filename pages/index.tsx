import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { FileUpload } from '@/components/ui/file-upload'
import { useToast } from '@/hooks/use-toast'
import { AnalysisAnimation } from '@/components/ui/analysis-animation'
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
    { message: "Deconstructing your resume's structure..." },
    { message: "Scanning for keywords and experience..." },
    { message: "Engaging neural networks for deep analysis..." },
    { message: "Finding opportunities for enhancement..." },
    { message: "Crafting actionable, expert suggestions..." },
    { message: "Compiling your personalized improvement plan..." }
  ]

  const handleFileSelect = async (file: File) => {
    if (isAnalyzing) return;

    setSelectedFile(file)
    setIsAnalyzing(true)
    setAnalysisStep(0)
    setProgress(0)

    try {
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
      await new Promise(resolve => setTimeout(resolve, 1000))
      
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
      title: "30-Second AI Analysis",
      description: "Get instant, expert-level feedback faster than you can read your resume",
      color: "text-yellow-400",
      stat: "10x faster than human review"
    },
    {
      icon: Target,
      title: "Beat the ATS",
      description: "Optimize for Applicant Tracking Systems that 75% of companies use",
      color: "text-blue-400",
      stat: "75% more likely to pass ATS"
    },
    {
      icon: CheckCircle,
      title: "HR Insider View",
      description: "See your resume through recruiter eyes - know what they think before they do",
      color: "text-green-400",
      stat: "Real recruiter perspective"
    },
    {
      icon: Award,
      title: "LaTeX Professional Edge",
      description: "Generate stunning, publication-quality resumes that make you stand out",
      color: "text-purple-400",
      stat: "Used by top tech companies"
    },
    {
      icon: TrendingUp,
      title: "Interview Rate Boost",
      description: "Optimized resumes get 3x more interviews than generic ones",
      color: "text-orange-400",
      stat: "3x more interviews"
    },
    {
      icon: Star,
      title: "Zero Learning Curve",
      description: "No resume writing experience needed - just upload and improve",
      color: "text-pink-400",
      stat: "Works in 3 clicks"
    }
  ]

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden select-none">
      {/* Enhanced Aurora/Glassmorphism Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Primary aurora gradients - made more visible */}
        <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-r from-primary/25 via-primary/10 to-transparent blur-3xl" />
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-500/25 via-purple-500/15 to-transparent blur-3xl" />
        
        {/* Additional aurora layers for depth - enhanced */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-600/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-emerald-400/15 to-teal-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        
        {/* Moving aurora effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 animate-pulse" style={{animationDuration: '4s'}} />
        
        {/* Enhanced grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.4)_1px,_transparent_0)] bg-[length:32px_32px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 shadow-lg shadow-black/5">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Logo disableLink />
          </Link>
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
                    AI-Powered Resume Optimization
                  </Badge>
                </motion.div>

                <motion.h1
                  className="text-6xl lg:text-7xl font-bold leading-tight tracking-tighter select-none"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <span className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent drop-shadow-lg">
                    Don't Just Apply.
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                    Get Hired.
                  </span>
                </motion.h1>

                <motion.p
                  className="text-xl text-muted-foreground leading-relaxed max-w-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  Transform your resume from overlooked to interview-ready in seconds. Our AI analyzes, optimizes, and creates stunning LaTeX resumes that recruiters can't ignore.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-wrap gap-4 text-sm text-slate-400"
                >
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                    <span>ATS-Optimized</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                    <span>HR-Approved</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                    <span>LaTeX Professional</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right Column - File Upload */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="relative overflow-hidden bg-white/5 backdrop-blur-md border-slate-700/50 shadow-2xl shadow-black/20">
                <CardHeader>
                  <CardTitle className="text-2xl font.bold text-slate-50 flex items-center">
                    <Zap className="w-6 h-6 mr-3 text-primary" />
                    Get Your Edge in 30 Seconds
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    isAnalyzing={isAnalyzing}
                  />
                  <p className="text-xs text-center text-slate-500 mt-4">
                    🔒 Your resume is encrypted and processed securely. We don't store it.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Analysis Animation Overlay */}
      <AnalysisAnimation
        isAnalyzing={isAnalyzing}
        analysisStep={analysisStep}
        fileName={selectedFile?.name || null}
      />

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container px-6 mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge 
                variant="secondary" 
                className="bg-primary/10 border-primary/20 text-primary mb-4"
              >
                <TrendingUp className="mr-2 h-3 w-3" />
                Competitive Advantage
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
                Why <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Top Candidates</span> Choose Resumify
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Join thousands of professionals who've transformed their job search with AI-powered resume optimization. 
                <span className="text-primary font-semibold"> Get the unfair advantage.</span>
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                className="flex"
              >
                <Card className="flex flex-col text-center bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20 transition-all duration-300 transform hover:-translate-y-1 select-none relative overflow-hidden">
                  <CardHeader className="flex-shrink-0 relative">
                    <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full">
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold mb-2">{feature.title}</CardTitle>
                    <Badge variant="outline" className="mx-auto text-xs bg-primary/5 border-primary/20 text-primary">
                      {feature.stat}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-r from-primary/10 to-blue-400/10 border border-primary/20 rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">
                Ready to 3x Your Interview Rate?
              </h3>
              <p className="text-muted-foreground mb-6">
                Join the thousands of professionals who've already transformed their careers with Resumify's AI-powered optimization.
              </p>
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
                onClick={() => document.querySelector('input[type="file"]')?.click()}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Your Transformation
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-background border-t border-border/40">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Resumify. All Rights Reserved.
          </p>
          <p className="text-xs mt-2 max-w-2xl mx-auto">
            <strong>Privacy First:</strong> Your resume is processed in real-time and stored only in your browser. 
            Zero data collection, maximum privacy protection.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Index;
