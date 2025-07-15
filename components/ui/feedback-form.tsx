import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Star, Send, CheckCircle } from 'lucide-react';

interface FeedbackFormProps {
  className?: string;
}

export function FeedbackForm({ className }: FeedbackFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter your feedback message",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          rating,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Thank You!",
          description: "Your feedback has been submitted successfully",
        });
        
        // Reset form after delay
        setTimeout(() => {
          setIsOpen(false);
          setIsSubmitted(false);
          setMessage('');
          setRating(null);
          setEmail('');
          setName('');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Button
          onClick={() => setIsOpen(true)}
          variant="outline"
          className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Share Feedback
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-slate-50">
            <MessageSquare className="h-5 w-5" />
            Share Your Feedback
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary w-fit">
            Help us improve Resumify
          </Badge>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-50 mb-2">Thank You!</h3>
              <p className="text-slate-400">Your feedback helps us make Resumify better for everyone.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rating */}
              <div className="space-y-2">
                <Label className="text-slate-300">How would you rate your experience?</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1 transition-colors ${
                        rating && star <= rating
                          ? 'text-yellow-400'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-300">
                  Your feedback *
                </Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your experience, suggestions, or any issues you encountered..."
                  className="bg-slate-800 border-slate-700 text-slate-100 min-h-[100px] resize-none"
                  maxLength={1000}
                  required
                />
                <div className="text-xs text-slate-500 text-right">
                  {message.length}/1000 characters
                </div>
              </div>

              {/* Optional fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">
                    Name (optional)
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email (optional)
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-slate-800 border-slate-700 text-slate-100"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="border-slate-700 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}