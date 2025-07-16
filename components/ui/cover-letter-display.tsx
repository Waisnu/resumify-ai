import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { RatingDisplay } from './rating-display';
import { 
  FileText, 
  Download, 
  Copy, 
  Share2, 
  Edit3, 
  Star,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Zap,
  Crown,
  RefreshCw,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  CoverLetterResult, 
  CoverLetterSuggestion,
  CoverLetterExport 
} from '@/lib/cover-letter-types';

interface CoverLetterDisplayProps {
  result: CoverLetterResult;
  onExport?: (format: CoverLetterExport['format']) => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  className?: string;
}

export function CoverLetterDisplay({ 
  result, 
  onExport, 
  onEdit, 
  onRegenerate,
  className 
}: CoverLetterDisplayProps) {
  const [activeTab, setActiveTab] = useState('preview');
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      toast({
        title: "Copied to clipboard",
        description: "Cover letter content has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getSuggestionIcon = (type: CoverLetterSuggestion['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Zap className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSuggestionColor = (type: CoverLetterSuggestion['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-500/20 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/10';
      case 'error':
        return 'border-red-500/20 bg-red-500/10';
      default:
        return 'border-blue-500/20 bg-blue-500/10';
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className={cn(
        "text-slate-200 leading-relaxed",
        line.trim() === '' ? 'mb-4' : 'mb-2'
      )}>
        {line}
      </p>
    ));
  };

  return (
    <Card className={cn("w-full bg-white/5 backdrop-blur-md border-slate-700/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-slate-50 flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            Your Cover Letter
            {result.template.isPro && <Crown className="w-5 h-5 text-yellow-500" />}
          </CardTitle>
          <div className="flex items-center gap-2">
            <RatingDisplay score={result.analysis.score} sentiment={result.analysis.sentiment} />
            <Badge variant="secondary" className="capitalize">
              {result.analysis.sentiment}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>{result.metadata.jobTitle} at {result.metadata.companyName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{result.metadata.wordCount} words · {result.metadata.estimatedReadTime} min read</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>{result.analysis.keyMetrics.skillsMatching}% skills match</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
              <div className="prose prose-invert max-w-none">
                {formatContent(result.content)}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {/* TODO: Share functionality */}}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button>
                )}
                
                {onRegenerate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRegenerate}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </Button>
                )}

                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onExport?.('pdf')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-200">Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Word Count</span>
                    <span className="text-slate-200 font-semibold">{result.analysis.keyMetrics.wordCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Readability Score</span>
                    <span className="text-slate-200 font-semibold">{result.analysis.keyMetrics.readabilityScore}/100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Personalized Elements</span>
                    <span className="text-slate-200 font-semibold">{result.analysis.keyMetrics.personalizedElements}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Skills Matching</span>
                    <span className="text-slate-200 font-semibold">{result.analysis.keyMetrics.skillsMatching}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-200">HR Perspective</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={result.analysis.hrPerspective.sentiment === 'positive' ? 'default' : 'secondary'}>
                      {result.analysis.hrPerspective.sentiment}
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {result.analysis.hrPerspective.summary}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.analysis.summary.strengths.map((strength, index) => (
                      <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                        <Star className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.analysis.summary.improvements.map((improvement, index) => (
                      <li key={index} className="text-slate-300 text-sm flex items-start gap-2">
                        <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {result.analysis.suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border",
                  getSuggestionColor(suggestion.type)
                )}
              >
                <div className="flex items-start gap-3">
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                      {suggestion.section && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.section}
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-200 text-sm mb-2">{suggestion.message}</p>
                    {suggestion.actionable && (
                      <p className="text-slate-400 text-xs">
                        <strong>Action:</strong> {suggestion.actionable}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}