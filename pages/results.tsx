import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import {
  ArrowLeft, Download, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp,
  Briefcase, Zap, Lightbulb, Mail, GraduationCap, Palette, FileText, User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RatingDisplay } from '@/components/ui/rating-display'
import { Logo } from '@/components/ui/logo'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

const Results = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedResults = localStorage.getItem('resumeAnalysis');
    
    if (storedResults) {
      const parsedResults = JSON.parse(storedResults);
      setAnalysisResult(parsedResults);
      setFileName(parsedResults.fileName);
      setIsLoading(false);
      
      const newExpanded: { [key: string]: boolean } = {};
      parsedResults.suggestions?.forEach((suggestion: Suggestion) => {
        if (suggestion.priority && suggestion.priority <= 2) {
          newExpanded[suggestion.category] = true;
        }
      });
      setExpandedCategories(newExpanded);
    } else {
      router.replace('/');
    }
  }, [router])

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

  const handleDownloadPdf = async () => {
    if (!reportRef.current || isDownloading) return
    setIsDownloading(true)
    toast({
      title: "Preparing Report",
      description: "Generating PDF, please wait...",
    })

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#020617',
        useCORS: true,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`Resumify_Report_${fileName?.split('.')[0] || 'analysis'}.pdf`)
      toast({
        title: "Download Complete",
        description: "Your PDF report has been saved.",
      })
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      toast({
        title: "Download Failed",
        description: "Could not generate the PDF report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading || !analysisResult) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <Logo />
          <p className="mt-4 text-slate-400">Loading analysis...</p>
        </div>
      </div>
    )
  }

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
          <Logo />
          <div className="flex items-center gap-4">
            <Button onClick={handleDownloadPdf} disabled={isDownloading} className="bg-primary hover:bg-primary/90 text-white">
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? 'Downloading...' : 'Download Report'}
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
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
            <p className="text-slate-400 mt-2">For: {fileName}</p>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Detailed Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 flex flex-col gap-8">
                  <Card className="p-6 text-center bg-slate-900 border border-slate-800">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                      className="flex flex-col items-center justify-center"
                    >
                      <RatingDisplay score={analysisResult.score} />
                      <h2 className="text-2xl font-bold mt-4 capitalize">{analysisResult.sentiment}</h2>
                    </motion.div>
                    <p className="text-sm mt-4 text-slate-400">
                      This score reflects your resume's current strengths and areas for improvement.
                    </p>
                  </Card>
                </div>

                <div className="md:col-span-2 flex flex-col gap-8">
                   <Card className="p-6 bg-slate-900 border border-slate-800">
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
          </Tabs>
        </main>
      </div>
    </div>
  )
}

export default Results