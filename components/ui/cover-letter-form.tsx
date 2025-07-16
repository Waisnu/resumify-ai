import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Switch } from './switch';
import { Label } from './label';
import { 
  FileText, 
  Building, 
  User, 
  Settings, 
  Sparkles, 
  Target, 
  Zap,
  Crown,
  Lock,
  Info,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  CoverLetterRequest, 
  CoverLetterCustomizations,
  COVER_LETTER_TEMPLATES,
  TONE_GUIDELINES 
} from '@/lib/cover-letter-types';

interface CoverLetterFormProps {
  onSubmit: (request: CoverLetterRequest) => Promise<void>;
  isLoading: boolean;
  resumeText?: string;
  className?: string;
}

export function CoverLetterForm({ 
  onSubmit, 
  isLoading, 
  resumeText = '',
  className 
}: CoverLetterFormProps) {
  const [formData, setFormData] = useState<CoverLetterRequest>({
    resumeText: resumeText,
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    additionalInstructions: '',
    tone: 'professional',
    length: 'medium',
    templateId: 'professional-standard',
    customizations: {
      includeSkills: true,
      includeProjects: true,
      includeAchievements: true,
      emphasizeExperience: true,
      personalizedIntro: true,
      callToAction: true,
      contactInfo: true,
      references: false
    }
  });

  const [activeTab, setActiveTab] = useState('basics');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update resume text when prop changes
  useEffect(() => {
    if (resumeText) {
      setFormData(prev => ({ ...prev, resumeText }));
    }
  }, [resumeText]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.resumeText.trim()) {
      newErrors.resumeText = 'Resume text is required';
    } else if (formData.resumeText.trim().length < 100) {
      newErrors.resumeText = 'Resume text must be at least 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setSubmitError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomizationChange = (key: keyof CoverLetterCustomizations, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      customizations: {
        ...prev.customizations,
        [key]: value
      }
    }));
  };

  const selectedTemplate = COVER_LETTER_TEMPLATES.find(t => t.id === formData.templateId);
  const selectedTone = TONE_GUIDELINES[formData.tone!];

  return (
    <Card className={cn("w-full max-w-2xl bg-white/5 backdrop-blur-md border-slate-700/50", className)}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-slate-50 flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          Create Cover Letter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basics" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Basics
              </TabsTrigger>
              <TabsTrigger value="customization" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Customize
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="e.g., Software Engineer"
                    className={errors.jobTitle ? 'border-red-500' : ''}
                  />
                  {errors.jobTitle && (
                    <p className="text-red-400 text-sm mt-1">{errors.jobTitle}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g., Google"
                    className={errors.companyName ? 'border-red-500' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-red-400 text-sm mt-1">{errors.companyName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="jobDescription">Job Description (Optional)</Label>
                <Textarea
                  id="jobDescription"
                  value={formData.jobDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  placeholder="Paste the job description here for better personalization..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-slate-400 text-sm mt-1">
                  Including the job description helps create a more targeted cover letter
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={formData.tone} onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value as CoverLetterRequest['tone'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TONE_GUIDELINES).map(([key, guide]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{key}</span>
                            <span className="text-slate-400 text-sm">- {guide.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTone && (
                    <p className="text-slate-400 text-sm mt-1">{selectedTone.description}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="length">Length</Label>
                  <Select value={formData.length} onValueChange={(value) => setFormData(prev => ({ ...prev, length: value as CoverLetterRequest['length'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (250-350 words)</SelectItem>
                      <SelectItem value="medium">Medium (350-500 words)</SelectItem>
                      <SelectItem value="long">Long (500-650 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="customization" className="space-y-6">
              <div>
                <Label htmlFor="template">Template</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {COVER_LETTER_TEMPLATES.map((template) => (
                    <motion.div
                      key={template.id}
                      whileHover={{ scale: 1.02 }}
                      className={cn(
                        "border rounded-lg p-4 cursor-pointer transition-all",
                        formData.templateId === template.id
                          ? "border-primary bg-primary/10"
                          : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
                      )}
                      onClick={() => setFormData(prev => ({ ...prev, templateId: template.id }))}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                            {template.name}
                            {template.isPro && <Crown className="w-4 h-4 text-yellow-500" />}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                          {template.industry && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.industry.map((ind) => (
                                <Badge key={ind} variant="secondary" className="text-xs">
                                  {ind}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {formData.templateId === template.id && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Customizations</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {Object.entries(formData.customizations!).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <Label htmlFor={key} className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleCustomizationChange(key as keyof CoverLetterCustomizations, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <div>
                <Label htmlFor="additionalInstructions">Additional Instructions</Label>
                <Textarea
                  id="additionalInstructions"
                  value={formData.additionalInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                  placeholder="Any specific requirements or preferences for your cover letter..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-200">Pro Tips</h4>
                    <ul className="text-sm text-slate-400 mt-2 space-y-1">
                      <li>• Include specific achievements and metrics from your resume</li>
                      <li>• Research the company and mention specific details</li>
                      <li>• Customize the tone to match the company culture</li>
                      <li>• Keep it concise but compelling</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Target className="w-4 h-4" />
              <span>Personalized for {formData.jobTitle || 'your role'}</span>
            </div>
            
            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-red-400">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">{submitError}</span>
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 flex items-center gap-2"
            >
              {isLoading || isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-4 h-4" />
                  </motion.div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Cover Letter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}