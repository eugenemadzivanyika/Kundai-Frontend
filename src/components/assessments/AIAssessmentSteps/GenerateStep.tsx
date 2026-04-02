import React from 'react';
import { Loader2, BookOpen, FileText, Sparkles } from 'lucide-react';
import { Progress } from '../../../components/ui/progress';

export interface GenerateStepProps {
  formData: {
    questionCount: number;
    questionTypes: string[];
    difficulty: string;
    selectedAttributes: string[];
  };
  attributes: Array<{ _id: string; name: string }>;
  uploadedFile?: File | null;
}

export function GenerateStep({ formData, attributes, uploadedFile }: GenerateStepProps) {
  const { questionCount, questionTypes, difficulty, selectedAttributes } = formData;
  
  // Get attribute names for display
  const selectedAttributeNames = selectedAttributes
    .map(id => attributes.find(a => a._id === id)?.name)
    .filter(Boolean);

  // Format question types for display
  const formattedQuestionTypes = questionTypes
    .map(type => {
      switch (type) {
        case 'multiple_choice': return 'Multiple Choice';
        case 'true_false': return 'True/False';
        case 'short_answer': return 'Short Answer';
        case 'essay': return 'Essay';
        case 'code': return 'Coding';
        default: return type;
      }
    })
    .join(', ');

  // Simulate progress (in a real app, this would come from the API)
  const [progress, setProgress] = React.useState(0);
  // AI status messages to keep the user informed while generation runs
  const statuses = [
    'Analyzing course objectives...',
    'Scanning reference documents...',
    'Drafting multiple choice options...',
    'Reviewing question difficulty...',
    'Finalizing assessment layout...'
  ];
  const [statusIndex, setStatusIndex] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress >= 90) {
          clearInterval(timer);
          return 90; // Hold at 90% until generation is complete
        }
        return oldProgress + 10;
      });
    }, 500);
    
    return () => clearInterval(timer);
  }, []);

  // Update the displayed AI status based on progress value so the user sees
  // contextual messages while waiting.
  React.useEffect(() => {
    const idx = Math.min(
      Math.floor(progress / (100 / statuses.length)),
      statuses.length - 1
    );
    setStatusIndex(idx);
  }, [progress, statuses.length]);

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        <h3 className="text-xl font-semibold">Generating Your Assessment</h3>
        <p className="text-xs text-gray-500 leading-relaxed">This may take a moment. Please don't close this window.</p>
      </div>

      <Progress value={progress} className="h-2" />
      
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <h4 className="font-medium">Assessment Details</h4>
          <div className="space-y-4 text-xs text-gray-500 leading-relaxed">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-gray-500 leading-relaxed">Questions</p>
                <p className="text-sm text-gray-700">{questionCount} questions</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-gray-500 leading-relaxed">Question Types</p>
                <p className="text-sm text-gray-700">{formattedQuestionTypes}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-gray-500 leading-relaxed">Difficulty</p>
                <p className="text-sm text-gray-700 capitalize">{difficulty}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">Content Sources</h4>
          <div className="space-y-4 text-xs text-gray-500 leading-relaxed">
            {selectedAttributeNames.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 leading-relaxed">Course Attributes</p>
                <p className="text-sm text-gray-700">{selectedAttributeNames.join(', ')}</p>
              </div>
            )}
            
            {uploadedFile && (
              <div>
                <p className="text-xs text-gray-500 leading-relaxed">Uploaded Document</p>
                <p className="truncate text-sm text-gray-700">{uploadedFile.name}</p>
              </div>
            )}
            
            {!uploadedFile && selectedAttributeNames.length === 0 && (
              <p className="text-xs text-gray-500 leading-relaxed">Using course content as context</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-4 text-center text-sm text-muted-foreground">
        <p aria-live="polite">{statuses[statusIndex]}</p>
      </div>
    </div>
  );
}
