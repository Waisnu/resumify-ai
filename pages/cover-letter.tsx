import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import { CoverLetterForm } from '@/components/ui/cover-letter-form';
import { CoverLetterDisplay } from '@/components/ui/cover-letter-display';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  ArrowLeft,
  Sparkles,
  Target,
  Zap,
  Crown,
  CheckCircle,
  Users,
  TrendingUp,
  Star,
  Eye,
  RefreshCw,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  CoverLetterRequest, 
  CoverLetterResult,
  CoverLetterExport 
} from '@/lib/cover-letter-types';

const CoverLetterPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [coverLetterResult, setCoverLetterResult] = useState<CoverLetterResult | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [showForm, setShowForm] = useState(true);

  // Load resume text from localStorage or previous analysis
  useEffect(() => {
    const storedResumeText = localStorage.getItem('resumeText');
    if (storedResumeText) {
      setResumeText(storedResumeText);
    }
  }, []);

  const handleGenerateCoverLetter = async (request: CoverLetterRequest) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate cover letter');
      }

      const data = await response.json();
      setCoverLetterResult(data.result);
      setShowForm(false);
      
      // Store the result for potential future use
      localStorage.setItem('coverLetterResult', JSON.stringify(data.result));
      
      toast({
        title: "Cover Letter Generated!",
        description: "Your personalized cover letter has been created successfully.",
      });

    } catch (error) {
      console.error('Cover letter generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (format: CoverLetterExport['format']) => {
    if (!coverLetterResult) return;

    switch (format) {
      case 'pdf':
        // TODO: Implement PDF export
        toast({
          title: "Export Feature",
          description: "PDF export will be available soon!",
        });
        break;
      case 'docx':
        // TODO: Implement DOCX export
        toast({
          title: "Export Feature",
          description: "DOCX export will be available soon!",
        });
        break;
      case 'txt': {
        // Simple text download
        const blob = new Blob([coverLetterResult.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-letter-${coverLetterResult.metadata.companyName}-${coverLetterResult.metadata.jobTitle}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      }
      default:
        break;
    }
  };

  const handleEdit = () => {
    setShowForm(true);
  };

  const handleRegenerate = () => {
    if (coverLetterResult) {
      // Clear result and show form again
      setCoverLetterResult(null);
      setShowForm(true);
    }
  };

  const handleNewCoverLetter = () => {
    setCoverLetterResult(null);
    setShowForm(true);
  };

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Personalization",
      description: "Automatically customize your cover letter for each job application",
      color: "text-yellow-400"
    },
    {
      icon: Target,
      title: "Job-Specific Optimization",
      description: "Analyze job descriptions to highlight relevant skills and experience",
      color: "text-blue-400"
    },
    {
      icon: CheckCircle,
      title: "Professional Templates",
      description: "Choose from industry-specific templates for maximum impact",
      color: "text-green-400"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analysis",
      description: "Get instant feedback on tone, structure, and effectiveness",
      color: "text-purple-400"
    }
  ];

  const proFeatures = [
    {
      title: "Premium Templates",
      description: "Access to 15+ industry-specific templates",
      icon: Crown
    },
    {
      title: "Advanced Analytics",
      description: "Track success rates and optimization suggestions",
      icon: TrendingUp
    },
    {
      title: "Multi-format Export",
      description: "PDF, DOCX, and styled HTML exports",
      icon: FileText
    },
    {
      title: "Collaboration Tools",
      description: "Share and get feedback from mentors",
      icon: Users
    }
  ];

  return (
    <>
      <Head>
        <title>AI Cover Letter Generator - Resumify AI</title>
        <meta name="description" content="Generate personalized, professional cover letters with AI. Tailored for each job application with industry-specific templates and real-time optimization." />
        <meta name="keywords" content="cover letter generator, AI cover letter, job application, personalized cover letter, professional templates" />
        <meta property="og:title" content="AI Cover Letter Generator - Resumify AI" />
        <meta property="og:description" content="Create compelling cover letters with AI assistance. Personalized for each job application with professional templates." />
      </Head>

      <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Enhanced Aurora Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-0 w-2/3 h-full bg-gradient-to-r from-primary/25 via-primary/10 to-transparent blur-3xl" />
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-500/25 via-purple-500/15 to-transparent blur-3xl" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-600/15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-600/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
          <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.4)_1px,_transparent_0)] bg-[length:32px_32px]" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 shadow-lg shadow-black/5">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center space-x-2">
                <Logo disableLink />
              </Link>
              <div className="h-6 w-px bg-border/50" />
              <nav className="flex items-center space-x-6">
                <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                  Resume Analysis
                </Link>
                <Link href="/cover-letter" className="text-sm font-medium text-primary">
                  Cover Letter
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {!coverLetterResult ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hero Section */}
                <div className="text-center mb-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/10 border-primary/20 text-primary mb-4"
                    >
                      <FileText className="mr-2 h-3 w-3" />
                      AI-Powered Cover Letter Generator
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">
                      <span className="bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        Create Compelling
                      </span>
                      <br />
                      <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        Cover Letters
                      </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                      Generate personalized, professional cover letters tailored to each job application. 
                      Stand out from the crowd with AI-powered optimization.
                    </p>
                  </motion.div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                        <CardHeader className="pb-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                            <feature.icon className={cn("w-6 h-6", feature.color)} />
                          </div>
                          <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm">{feature.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Cover Letter Form */}
                <div className="flex justify-center">
                  <CoverLetterForm
                    onSubmit={handleGenerateCoverLetter}
                    isLoading={isLoading}
                    resumeText={resumeText}
                    className="w-full max-w-4xl"
                  />
                </div>

                {/* Pro Features Section */}
                <div className="mt-16 text-center">
                  <h2 className="text-3xl font-bold mb-8">
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      Pro Features
                    </span>
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {proFeatures.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 backdrop-blur-md hover:from-yellow-500/20 hover:to-orange-500/20 transition-all duration-300">
                          <CardHeader className="pb-3">
                            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-3">
                              <feature.icon className="w-6 h-6 text-yellow-400" />
                            </div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {feature.title}
                              <Crown className="w-4 h-4 text-yellow-500" />
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-sm">{feature.description}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Result Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowForm(true)}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Form
                    </Button>
                    <h1 className="text-2xl font-bold">Cover Letter Generated</h1>
                  </div>
                  <Button
                    onClick={handleNewCoverLetter}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Cover Letter
                  </Button>
                </div>

                {/* Cover Letter Display */}
                <CoverLetterDisplay
                  result={coverLetterResult}
                  onExport={handleExport}
                  onEdit={handleEdit}
                  onRegenerate={handleRegenerate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
};

export default CoverLetterPage;