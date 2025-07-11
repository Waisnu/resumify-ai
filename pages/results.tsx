import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp,
  Briefcase, Zap, Lightbulb, Mail, GraduationCap, Palette, FileText, User, Code, Copy, ExternalLink, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RatingDisplay } from '@/components/ui/rating-display'
import { Logo } from '@/components/ui/logo'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Suggestion = {
  type: 'improvement' | 'success' | 'warning' | 'error';
  category: string;
  message: string;
  impact: string;
  section?: string;
  priority?: number;
  actionable?: string;
};

type AnalysisResult = {
  score: number;
  sentiment: 'poor' | 'fair' | 'good' | 'excellent';
  suggestions: Suggestion[];
  summary: {
    strengths: string[];
    improvements: string[];
  };
  hrPerspective: {
    sentiment: 'positive' | 'neutral' | 'negative';
    summary: string;
  };
};

type LaTeXRecommendation = {
  recommendedTemplate: string;
  confidence: number;
  reasoning: string;
  generatedCode: string;
  suggestions: string[];
};

const Results = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({})
  const [latexRecommendation, setLatexRecommendation] = useState<LaTeXRecommendation | null>(null)
  const [isGeneratingLatex, setIsGeneratingLatex] = useState(false)
  const [showFullCode, setShowFullCode] = useState(false)
  const [resumeText, setResumeText] = useState<string>('')

  const reportRef = useRef<HTMLDivElement>(null)

  const handleAnalyzeAnother = () => {
  
    // localStorage.removeItem('resumeAnalysis');
    // localStorage.removeItem('resumeText');
    router.push('/');
  }

  useEffect(() => {
    // A slight delay to make loading feel more natural
    setTimeout(() => {
      const storedResults = localStorage.getItem('resumeAnalysis');
      const storedResumeText = localStorage.getItem('resumeText');
      
      if (storedResults) {
        try {
          const parsedResults = JSON.parse(storedResults);
          setAnalysisResult(parsedResults);
          setFileName(parsedResults.fileName);
          
          // Load resume text for LaTeX generation
          if (storedResumeText) {
            setResumeText(storedResumeText);
          }

          // Start with all categories collapsed for better UX
          setExpandedCategories({});
        } catch (e) {
          console.error("Failed to parse analysis results:", e);
          setError("There was an error reading your analysis results. Please try again.");
          localStorage.removeItem('resumeAnalysis');
        }
      } else {
        setError("No analysis results found. Please analyze a resume first.");
      }
      setIsLoading(false);
    }, 500);
  }, [])

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return XCircle
      default: return AlertTriangle
    }
  }

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500/30 bg-green-500/10 text-green-400'
      case 'warning': return 'border-amber-500/30 bg-amber-500/10 text-amber-400'
      case 'error': return 'border-red-500/30 bg-red-500/10 text-red-400'
      default: return 'border-sky-500/30 bg-sky-500/10 text-sky-400'
    }
  }

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ElementType } = {
      experience: Briefcase,
      skills: Zap,
      content: Lightbulb,
      contact: Mail,
      education: GraduationCap,
      formatting: Palette,
      general: FileText,
    }
    const Icon = iconMap[category.toLowerCase()] || AlertTriangle
    return <Icon className="h-5 w-5 text-slate-400" />
  }

  const groupSuggestionsByCategory = (suggestions: Suggestion[]) => {
    const grouped: { [key: string]: Suggestion[] } = {};
    suggestions.forEach(suggestion => {
      if (!grouped[suggestion.category]) {
        grouped[suggestion.category] = [];
      }
      grouped[suggestion.category].push(suggestion);
    });
    
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => (a.priority || 5) - (b.priority || 5));
    });
    
    return grouped;
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "LaTeX code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Please select and copy the text manually",
        variant: "destructive",
      });
    }
  };

  const generateLatexRecommendation = async () => {
    if (!resumeText || isGeneratingLatex) return;

    setIsGeneratingLatex(true);
    toast({
      title: "Generating Recommendation",
      description: "AI is analyzing your resume and creating a personalized LaTeX template...",
    });

    try {
      const response = await fetch('/api/latex-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendation');
      }

      const data = await response.json();
      setLatexRecommendation(data.recommendation);

      toast({
        title: "Recommendation Ready!",
        description: "Your personalized LaTeX template has been generated",
      });
    } catch (error) {
      console.error('Error generating LaTeX recommendation:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate LaTeX recommendation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLatex(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <Logo />
          <p className="mt-4 text-slate-400">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-center p-4">
        <Card className="p-8 max-w-md w-full bg-slate-900 border-slate-800">
          <XCircle className="mx-auto h-16 w-16 text-destructive/70" />
          <h2 className="mt-6 text-3xl font-bold text-slate-100">Analysis Unavailable</h2>
          <p className="mt-4 text-slate-400">{error}</p>
          <Button onClick={handleAnalyzeAnother} className="mt-8 w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Analyze a New Resume
          </Button>
        </Card>
      </div>
    )
  }

  if (!analysisResult) {
    // This case should ideally not be reached if logic is sound
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <p className="text-slate-400">An unexpected error occurred.</p>
      </div>
    );
  }

  const suggestionStats = {
    success: analysisResult.suggestions.filter(s => s.type === 'success').length,
    warning: analysisResult.suggestions.filter(s => s.type === 'warning').length,
    improvement: analysisResult.suggestions.filter(s => s.type === 'improvement').length,
    error: analysisResult.suggestions.filter(s => s.type === 'error').length,
  };

  const groupedSuggestions = groupSuggestionsByCategory(analysisResult.suggestions)
  const sortedCategories = Object.keys(groupedSuggestions).sort((a, b) => {
    const aPriority = Math.min(...groupedSuggestions[a].map(s => s.priority || 5))
    const bPriority = Math.min(...groupedSuggestions[b].map(s => s.priority || 5))
    return aPriority - bPriority
  })

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      <header className="sticky top-0 z-50 p-4 md:px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Button onClick={handleAnalyzeAnother} className="bg-primary hover:bg-primary/90 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Analyze Another
            </Button>
          </div>
        </div>
      </header>

      <div ref={reportRef} className="p-4 md:p-8 bg-slate-950">
        <main className="max-w-7xl mx-auto space-y-8">
          <div className="text-center pt-8 pb-4">
            <h1 className="text-4xl font-bold tracking-tighter bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">Resume Analysis Report</h1>
            <p className="text-slate-400 mt-2">For: {fileName 
    ? fileName
        .replace(/\.[^/.]+$/, "") // Remove file extension
        .replace(/_/g, ' ')       // Replace underscores with spaces
        .replace(/resume/i, '')   // Remove 'resume' (case-insensitive)
        .trim()                  // Trim whitespace
    : 'your resume'}</p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Detailed Feedback</TabsTrigger>
              <TabsTrigger value="latex">AI LaTeX Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-1 flex flex-col gap-8">
                  <Card className="p-6 text-center bg-slate-900 border border-slate-800 flex-1">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                      className="flex flex-col items-center justify-center h-full"
                    >
                      <RatingDisplay score={analysisResult.score} sentiment={analysisResult.sentiment} />
                    </motion.div>
                  </Card>
                   <Card className="p-6 bg-slate-900 border border-slate-800">
                    <h3 className="text-lg font-semibold mb-4">Suggestion Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-green-400"><CheckCircle className="mr-2 h-4 w-4"/>Successes</span>
                        <span className="font-bold">{suggestionStats.success}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-sky-400"><AlertTriangle className="mr-2 h-4 w-4"/>Improvements</span>
                        <span className="font-bold">{suggestionStats.improvement}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-amber-400"><AlertTriangle className="mr-2 h-4 w-4"/>Warnings</span>
                        <span className="font-bold">{suggestionStats.warning}</span>
                      </div>
                       <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-red-400"><XCircle className="mr-2 h-4 w-4"/>Errors</span>
                        <span className="font-bold">{suggestionStats.error}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="md:col-span-2 flex flex-col gap-8 h-full">
                   <Card className="p-6 bg-slate-900 border border-slate-800 flex-1">
                    <h3 className="text-lg font-semibold mb-4">Summary</h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center text-green-400"><CheckCircle className="mr-2 h-5 w-5"/>Strengths</h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                          {analysisResult.summary.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-400" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center text-amber-400"><AlertTriangle className="mr-2 h-5 w-5"/>Areas to Improve</h4>
                        <ul className="space-y-2 text-sm text-slate-300">
                          {analysisResult.summary.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-400" />
                              <span>{improvement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>

                  {analysisResult.hrPerspective && (
                    <Card className="p-6 bg-slate-900 border border-slate-800">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <User className="mr-3 h-5 w-5 text-blue-400" />
                        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                          HR & Recruiter Perspective
                        </span>
                      </h3>
                      <blockquote className="italic text-slate-300 border-l-4 border-blue-400 pl-4">
                        "{analysisResult.hrPerspective.summary}"
                      </blockquote>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-8">
              <Card className="p-6 bg-slate-900 border border-slate-800">
                <h3 className="text-lg font-semibold mb-4">Detailed Feedback</h3>
                <div className="space-y-4">
                  {sortedCategories.map((category) => (
                    <div key={category} className="border-b border-slate-800 last:border-b-0 pb-4">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex justify-between items-center py-2 text-left font-semibold text-lg"
                      >
                        <span className="flex items-center gap-3">
                          {getCategoryIcon(category)}
                          <span className="capitalize">{category}</span>
                        </span>
                        {expandedCategories[category] ? <ChevronUp /> : <ChevronDown />}
                      </button>
                      <AnimatePresence>
                        {expandedCategories[category] && (
                          <motion.div
                            initial="collapsed"
                            animate="open"
                            exit="collapsed"
                            variants={{
                              open: { opacity: 1, height: 'auto', marginTop: '16px' },
                              collapsed: { opacity: 0, height: 0, marginTop: '0px' },
                            }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-4 pt-4">
                              {groupedSuggestions[category].map((suggestion, index) => (
                                <div key={index} className={`p-4 rounded-lg border ${getSuggestionColor(suggestion.type)}`}>
                                  <div className="flex items-center mb-2">
                                    <div className={`mr-3`}>
                                      {React.createElement(getSuggestionIcon(suggestion.type), { className: 'h-5 w-5' })}
                                    </div>
                                    <h4 className="font-semibold capitalize">{suggestion.type}</h4>
                                    <Badge variant="secondary" className="ml-auto bg-slate-700 text-slate-300">
                                      Impact: {suggestion.impact}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-300 pl-8">{suggestion.message}</p>
                                  {suggestion.actionable && (
                                    <p className="text-sm text-blue-400 mt-2 pl-8">
                                      <strong>Action:</strong> {suggestion.actionable}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="latex" className="mt-8">
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                    AI LaTeX Recommendations
                  </h2>
                  <p className="text-slate-400 max-w-3xl mx-auto">
                    Get a personalized LaTeX resume template generated specifically for your profile. 
                    Our AI analyzes your experience and recommends the best template format optimized for your target roles.
                  </p>
                </div>

                {/* What is Overleaf Section */}
                <Card className="p-6 bg-slate-900 border border-slate-800">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <Code className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2 text-white">What is Overleaf?</h3>
                      <p className="text-slate-300 mb-4">
                        Overleaf is a collaborative cloud-based LaTeX editor used by over 13 million students and academics worldwide. 
                        It's the industry standard for creating professional, publication-quality documents without installing software.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">No Installation</Badge>
                        <Badge variant="secondary">Real-time Collaboration</Badge>
                        <Badge variant="secondary">Professional Output</Badge>
                        <Badge variant="secondary">ATS-Friendly</Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Generate Recommendation Button */}
                <div className="text-center">
                  <Button 
                    onClick={generateLatexRecommendation}
                    disabled={isGeneratingLatex || !resumeText}
                    className="px-8 py-3 text-lg"
                  >
                    {isGeneratingLatex ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Sparkles className="h-5 w-5" />
                        </motion.div>
                        Generating AI Recommendation...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate AI Recommendation
                      </>
                    )}
                  </Button>
                  {!resumeText && (
                    <p className="text-slate-400 text-sm mt-2">Resume text not available. Please re-analyze your resume.</p>
                  )}
                                 </div>

                 {/* AI Recommendation Results */}
                 <AnimatePresence>
                   {latexRecommendation && (
                     <motion.div
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -20 }}
                       transition={{ duration: 0.5 }}
                       className="space-y-6"
                     >
                       {/* Template Recommendation */}
                       <Card className="p-6 bg-slate-900 border border-slate-800">
                         <h3 className="text-xl font-semibold mb-4 flex items-center">
                           <Sparkles className="mr-3 h-6 w-6 text-primary" />
                           Recommended Template: {latexRecommendation.recommendedTemplate}
                         </h3>
                         <div className="grid md:grid-cols-2 gap-6">
                           <div>
                             <h4 className="font-semibold mb-2 text-slate-300">AI Analysis</h4>
                             <p className="text-slate-300 text-sm mb-4">{latexRecommendation.reasoning}</p>
                             <div className="flex items-center gap-2">
                               <span className="text-sm text-slate-400">Confidence:</span>
                               <div className="flex items-center gap-2">
                                 <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                                   <div 
                                     className="h-full bg-primary transition-all duration-1000"
                                     style={{ width: `${latexRecommendation.confidence * 100}%` }}
                                   ></div>
                                 </div>
                                 <span className="text-sm font-semibold text-slate-300">
                                   {Math.round(latexRecommendation.confidence * 100)}%
                                 </span>
                               </div>
                             </div>
                           </div>
                           <div>
                             <h4 className="font-semibold mb-2 text-slate-300">Improvement Suggestions</h4>
                             <ul className="space-y-1">
                               {latexRecommendation.suggestions.slice(0, 3).map((suggestion, index) => (
                                 <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                                   <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-400" />
                                   <span>{suggestion}</span>
                                 </li>
                               ))}
                             </ul>
                           </div>
                         </div>
                       </Card>

                       {/* Generated LaTeX Code */}
                       <Card className="p-6 bg-slate-900 border border-slate-800">
                         <div className="flex justify-between items-center mb-4">
                           <h3 className="text-xl font-semibold flex items-center">
                             <Code className="mr-3 h-6 w-6 text-primary" />
                             Generated LaTeX Code
                           </h3>
                           <div className="flex gap-2">
                             <Button
                               onClick={() => setShowFullCode(!showFullCode)}
                               variant="outline"
                               size="sm"
                             >
                               {showFullCode ? 'Show Preview' : 'Show Full Code'}
                             </Button>
                             <Button
                               onClick={() => copyToClipboard(latexRecommendation.generatedCode)}
                               variant="outline"
                               size="sm"
                             >
                               <Copy className="h-4 w-4 mr-2" />
                               Copy Code
                             </Button>
                           </div>
                         </div>
                         
                         <div className="relative">
                           <pre className={`bg-slate-950 p-4 rounded-lg overflow-auto text-sm text-slate-300 border border-slate-700 ${
                             showFullCode ? 'max-h-none' : 'max-h-64'
                           }`}>
                             <code>{showFullCode ? latexRecommendation.generatedCode : latexRecommendation.generatedCode.slice(0, 500) + '...'}</code>
                           </pre>
                           {!showFullCode && (
                             <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
                           )}
                         </div>
                       </Card>

                       {/* Overleaf Instructions */}
                       <Card className="p-6 bg-slate-900 border border-slate-800">
                         <h3 className="text-xl font-semibold mb-4 flex items-center">
                           <ExternalLink className="mr-3 h-6 w-6 text-primary" />
                           Ready to Create Your Resume?
                         </h3>
                         <div className="grid md:grid-cols-2 gap-6 text-slate-300">
                           <div>
                             <h4 className="font-semibold mb-3 text-slate-300">Step 1: Open Overleaf</h4>
                             <p className="text-sm mb-4">Click the button below to go to Overleaf and sign in with your Google account for quick access.</p>
                             
                             <h4 className="font-semibold mb-3 text-slate-300">Step 2: Create New Project</h4>
                             <p className="text-sm">Choose "Blank Project" and paste the generated LaTeX code above into the main.tex file.</p>
                           </div>
                           <div>
                             <h4 className="font-semibold mb-3 text-slate-300">Step 3: Customize & Compile</h4>
                             <p className="text-sm mb-4">Edit your information, apply our suggestions, then click "Recompile" to see your beautiful resume!</p>
                             
                             <h4 className="font-semibold mb-3 text-slate-300">Step 4: Download PDF</h4>
                             <p className="text-sm">Once satisfied, download as PDF and start applying to your dream jobs!</p>
                           </div>
                         </div>
                         
                         <div className="mt-6 text-center">
                           <Button asChild className="bg-primary hover:bg-primary/90 text-white px-8 py-3">
                             <a href="https://www.overleaf.com/project/652f8c40f0b194dd2587a391" target="_blank" rel="noopener noreferrer">
                               <ExternalLink className="mr-2 h-5 w-5" />
                               Open Overleaf & Sign In with Google
                             </a>
                           </Button>
                         </div>
                       </Card>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 {/* Pro Tip */}
                 <Card className="p-6 bg-slate-900 border border-slate-800">
                   <div className="text-center">
                     <h3 className="text-xl font-semibold mb-2 text-white">🚀 Pro Tip</h3>
                     <p className="text-slate-300">
                       LaTeX resumes are preferred by 89% of technical recruiters at FAANG companies. 
                       They're ATS-friendly, professionally formatted, and show attention to detail that sets you apart from other candidates.
                     </p>
                   </div>
                 </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

export default Results