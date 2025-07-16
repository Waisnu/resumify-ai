import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Switch } from './switch';
import { Label } from './label';
import { Separator } from './separator';
import { Progress } from './progress';
import { 
  FileText, 
  Target, 
  Link2, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  Star,
  Users,
  Briefcase,
  GraduationCap,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResumeIntegration } from '@/lib/cover-letter-types';

interface ResumeIntegrationProps {
  resumeText: string;
  onIntegrationChange: (integration: ResumeIntegration) => void;
  className?: string;
}

interface ExtractedData {
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  contact: {
    email?: string;
    phone?: string;
    linkedin?: string;
    location?: string;
  };
  achievements: string[];
}

export function ResumeCoverLetterIntegration({ 
  resumeText, 
  onIntegrationChange,
  className 
}: ResumeIntegrationProps) {
  const [integration, setIntegration] = useState<ResumeIntegration>({
    autoExtractSkills: true,
    matchExperience: true,
    alignTone: true,
    syncContactInfo: true,
    suggestImprovements: true
  });

  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);

  // Mock data extraction - in production, this would use AI
  const extractResumeData = async (): Promise<ExtractedData> => {
    setIsExtracting(true);
    setExtractionProgress(0);

    // Simulate extraction progress
    for (let i = 0; i <= 100; i += 10) {
      setExtractionProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Mock extracted data based on resume text analysis
    const mockData: ExtractedData = {
      skills: [
        'JavaScript', 'React', 'Node.js', 'Python', 'TypeScript', 
        'AWS', 'Docker', 'MongoDB', 'PostgreSQL', 'Git'
      ],
      experience: [
        {
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          duration: '2022 - Present',
          achievements: [
            'Led development of microservices architecture',
            'Improved system performance by 40%',
            'Mentored 5 junior developers'
          ]
        },
        {
          title: 'Full Stack Developer',
          company: 'StartupXYZ',
          duration: '2020 - 2022',
          achievements: [
            'Built scalable web applications',
            'Implemented CI/CD pipeline',
            'Reduced deployment time by 60%'
          ]
        }
      ],
      education: [
        {
          degree: 'Bachelor of Science in Computer Science',
          institution: 'University of Technology',
          year: '2020'
        }
      ],
      contact: {
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        linkedin: 'linkedin.com/in/johndoe',
        location: 'San Francisco, CA'
      },
      achievements: [
        'AWS Certified Solutions Architect',
        'Published 3 technical articles',
        'Led team of 8 developers',
        'Increased user engagement by 25%'
      ]
    };

    setIsExtracting(false);
    return mockData;
  };

  useEffect(() => {
    if (resumeText && resumeText.length > 100) {
      extractResumeData().then(setExtractedData);
    }
  }, [resumeText]);

  const handleIntegrationChange = (key: keyof ResumeIntegration, value: boolean) => {
    const newIntegration = { ...integration, [key]: value };
    setIntegration(newIntegration);
    onIntegrationChange(newIntegration);
  };

  const getIntegrationIcon = (key: keyof ResumeIntegration) => {
    switch (key) {
      case 'autoExtractSkills':
        return <Zap className="w-4 h-4 text-blue-400" />;
      case 'matchExperience':
        return <Briefcase className="w-4 h-4 text-green-400" />;
      case 'alignTone':
        return <Target className="w-4 h-4 text-purple-400" />;
      case 'syncContactInfo':
        return <Users className="w-4 h-4 text-orange-400" />;
      case 'suggestImprovements':
        return <TrendingUp className="w-4 h-4 text-pink-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getIntegrationDescription = (key: keyof ResumeIntegration) => {
    switch (key) {
      case 'autoExtractSkills':
        return 'Automatically highlight relevant skills from your resume';
      case 'matchExperience':
        return 'Match your work experience with job requirements';
      case 'alignTone':
        return 'Align cover letter tone with your resume style';
      case 'syncContactInfo':
        return 'Use contact information from your resume';
      case 'suggestImprovements':
        return 'Get suggestions to improve resume-cover letter alignment';
      default:
        return 'Integration option';
    }
  };

  const integrationScore = Object.values(integration).filter(Boolean).length / Object.values(integration).length * 100;

  return (
    <Card className={cn("bg-white/5 backdrop-blur-md border-slate-700/50", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-50 flex items-center gap-3">
          <Link2 className="w-5 h-5 text-primary" />
          Resume Integration
        </CardTitle>
        <p className="text-slate-400 text-sm">
          Automatically sync your resume data with your cover letter for better alignment
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Extraction Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Resume Analysis</Label>
            <Badge variant={extractedData ? 'default' : 'secondary'}>
              {extractedData ? 'Complete' : 'Pending'}
            </Badge>
          </div>
          
          {isExtracting && (
            <div className="space-y-2">
              <Progress value={extractionProgress} className="h-2" />
              <p className="text-xs text-slate-400">Extracting resume data...</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Integration Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Integration Options</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Score:</span>
              <Badge variant="outline">{Math.round(integrationScore)}%</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(integration).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getIntegrationIcon(key as keyof ResumeIntegration)}
                  <div>
                    <Label className="text-sm font-medium capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                    <p className="text-xs text-slate-400 mt-1">
                      {getIntegrationDescription(key as keyof ResumeIntegration)}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleIntegrationChange(key as keyof ResumeIntegration, checked)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Extracted Data Preview */}
        {extractedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Separator />
            
            <div>
              <Label className="text-sm font-medium">Extracted Data Preview</Label>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Skills */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <h4 className="font-medium text-slate-200">Skills</h4>
                    <Badge variant="outline" className="text-xs">{extractedData.skills.length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {extractedData.skills.slice(0, 8).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {extractedData.skills.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{extractedData.skills.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Experience */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-green-400" />
                    <h4 className="font-medium text-slate-200">Experience</h4>
                    <Badge variant="outline" className="text-xs">{extractedData.experience.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {extractedData.experience.slice(0, 2).map((exp, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-slate-200 font-medium">{exp.title}</p>
                        <p className="text-slate-400 text-xs">{exp.company} • {exp.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-purple-400" />
                    <h4 className="font-medium text-slate-200">Education</h4>
                    <Badge variant="outline" className="text-xs">{extractedData.education.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {extractedData.education.slice(0, 2).map((edu, index) => (
                      <div key={index} className="text-sm">
                        <p className="text-slate-200 font-medium">{edu.degree}</p>
                        <p className="text-slate-400 text-xs">{edu.institution} • {edu.year}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <h4 className="font-medium text-slate-200">Achievements</h4>
                    <Badge variant="outline" className="text-xs">{extractedData.achievements.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {extractedData.achievements.slice(0, 3).map((achievement, index) => (
                      <div key={index} className="text-sm text-slate-300 flex items-start gap-2">
                        <Star className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Integration Status */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              integrationScore >= 80 ? "bg-green-400" : 
              integrationScore >= 60 ? "bg-yellow-400" : "bg-red-400"
            )} />
            <span className="text-sm text-slate-400">
              {integrationScore >= 80 ? "Excellent integration" :
               integrationScore >= 60 ? "Good integration" : "Basic integration"}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <CheckCircle className="w-4 h-4" />
            <span>Ready for generation</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}