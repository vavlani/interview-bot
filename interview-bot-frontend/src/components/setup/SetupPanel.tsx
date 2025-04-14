import React, { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Chip,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  HelpOutline as HelpIcon,
  AssignmentTurnedIn as CompletedIcon
} from '@mui/icons-material';
import { useInterview, InterviewConfig } from '../../context/InterviewContext';

interface SetupPanelProps {
  onStartInterview: () => void;
}

// Example interview templates
const INTERVIEW_TEMPLATES = [
  {
    name: 'Technical Interview',
    topic: 'Technical Skills Assessment',
    duration: 20,
    roleType: 'technical interviewer',
    context: 'This is a technical assessment for a software developer position. Focus on problem-solving skills, coding experience, and system design knowledge. Ask about the candidate\'s experience with relevant technologies and their approach to complex problems.'
  },
  {
    name: 'Job Interview',
    topic: 'Career Background',
    duration: 15,
    roleType: 'hiring manager',
    context: 'This is a job interview for a professional position. Ask about the candidate\'s work experience, skills, and career goals. Focus on their achievements, challenges they\'ve overcome, and how they might fit with the team culture.'
  },
  {
    name: 'Practice Interview',
    topic: 'Interview Preparation',
    duration: 10,
    roleType: 'career coach',
    context: 'This is a practice interview to help prepare for actual job interviews. Provide constructive feedback on responses, suggest improvements, and help build confidence through realistic questions and scenarios.'
  }
];

const SetupPanel: React.FC<SetupPanelProps> = ({ onStartInterview }) => {
  const theme = useTheme();
  const { interviewConfig, setInterviewConfig, startInterview, isLoading } = useInterview();
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState({
    topic: false,
    duration: false
  });

  // Apply a template to the interview config
  const applyTemplate = (templateIndex: number) => {
    const template = INTERVIEW_TEMPLATES[templateIndex];
    setInterviewConfig({
      interviewTopic: template.topic,
      interviewDuration: template.duration,
      roleType: template.roleType,
      initialContext: template.context
    });
    setSelectedTemplate(templateIndex);
    setFormErrors({ topic: false, duration: false });
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const topicError = !interviewConfig.interviewTopic.trim();
    const durationError = interviewConfig.interviewDuration < 5 || interviewConfig.interviewDuration > 60;
    
    if (topicError || durationError) {
      setFormErrors({
        topic: topicError,
        duration: durationError
      });
      return;
    }
    
    // Start the interview
    await startInterview();
    onStartInterview();
  };

  // Handle input changes
  const handleChange = (field: keyof InterviewConfig, value: string | number) => {
    setInterviewConfig({
      ...interviewConfig,
      [field]: value
    });
    
    // Clear field-specific error when user types
    if (field === 'interviewTopic' || field === 'interviewDuration') {
      setFormErrors({
        ...formErrors,
        [field === 'interviewTopic' ? 'topic' : 'duration']: false
      });
    }
    
    // Clear template selection when user modifies fields
    setSelectedTemplate(null);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        maxWidth: 850,
        mx: 'auto',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Typography variant="h2" sx={{ mb: 3, color: theme.palette.primary.main, textAlign: 'center' }}>
        Interview Setup
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Choose Template</StepLabel>
        </Step>
        <Step>
          <StepLabel>Configure Details</StepLabel>
        </Step>
        <Step>
          <StepLabel>Start Interview</StepLabel>
        </Step>
      </Stepper>

      {/* Step 0: Template Selection */}
      {activeStep === 0 && (
        <>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Choose a template or create a custom interview
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {INTERVIEW_TEMPLATES.map((template, index) => (
              <Card 
                key={index}
                sx={{
                  width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 16px)' },
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: selectedTemplate === index 
                    ? `2px solid ${theme.palette.primary.main}` 
                    : `1px solid ${theme.palette.divider}`,
                  '&:hover': {
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-4px)',
                  }
                }}
                onClick={() => applyTemplate(index)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h3" fontSize="1.1rem" fontWeight="bold">
                      {template.name}
                    </Typography>
                    {selectedTemplate === index && (
                      <CompletedIcon sx={{ color: theme.palette.primary.main }} />
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                    <Chip 
                      label={`${template.duration} min`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip 
                      label={template.roleType}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {template.context.substring(0, 100)}...
                  </Typography>
                </CardContent>
              </Card>
            ))}
            
            <Card
              sx={{
                width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.333% - 16px)' },
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: selectedTemplate === null && (
                  interviewConfig.interviewTopic || 
                  interviewConfig.initialContext || 
                  interviewConfig.interviewDuration !== 15 || 
                  interviewConfig.roleType !== 'interviewer'
                ) ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.primary.main, 0.03),
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-4px)',
                }
              }}
              onClick={() => {
                setSelectedTemplate(null);
                setActiveStep(1);
              }}
            >
              <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', py: 4 }}>
                <Typography variant="h3" fontSize="1.1rem" fontWeight="bold" textAlign="center">
                  Custom Interview
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
                  Create a completely custom interview with your own settings
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button 
              variant="outlined"
              onClick={() => setActiveStep(1)}
              disabled={isLoading}
            >
              Skip Template
            </Button>
            
            <Button 
              variant="contained"
              onClick={() => setActiveStep(1)}
              disabled={isLoading}
            >
              Continue
            </Button>
          </Box>
        </>
      )}

      {/* Step 1: Interview Configuration */}
      {activeStep === 1 && (
        <>
          <Typography variant="h3" sx={{ mb: 3 }}>
            Configure Interview Details
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Interview Topic"
              fullWidth
              value={interviewConfig.interviewTopic}
              onChange={(e) => handleChange('interviewTopic', e.target.value)}
              error={formErrors.topic}
              helperText={formErrors.topic ? "Topic is required" : "What's the subject of this interview?"}
              required
            />
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                label="Duration (minutes)"
                type="number"
                InputProps={{ inputProps: { min: 5, max: 60 } }}
                value={interviewConfig.interviewDuration}
                onChange={(e) => handleChange('interviewDuration', parseInt(e.target.value) || 15)}
                error={formErrors.duration}
                helperText={formErrors.duration ? "Duration must be 5-60 minutes" : "How long should the interview be?"}
                required
                sx={{ flex: 1 }}
              />
              
              <FormControl sx={{ flex: 2 }}>
                <InputLabel id="role-type-label">Interviewer Role</InputLabel>
                <Select
                  labelId="role-type-label"
                  value={interviewConfig.roleType}
                  label="Interviewer Role"
                  onChange={(e) => handleChange('roleType', e.target.value)}
                >
                  <MenuItem value="interviewer">General Interviewer</MenuItem>
                  <MenuItem value="hiring manager">Hiring Manager</MenuItem>
                  <MenuItem value="technical interviewer">Technical Interviewer</MenuItem>
                  <MenuItem value="career coach">Career Coach</MenuItem>
                  <MenuItem value="industry expert">Industry Expert</MenuItem>
                </Select>
                <FormHelperText>What kind of interviewer should conduct this session?</FormHelperText>
              </FormControl>
            </Box>
            
            <Box sx={{ position: 'relative' }}>
              <TextField
                label="Interview Context & Instructions"
                multiline
                rows={6}
                fullWidth
                value={interviewConfig.initialContext}
                onChange={(e) => handleChange('initialContext', e.target.value)}
                helperText="Provide background information, specific areas to cover, and any special instructions."
              />
              
              <Tooltip
                title="This information helps the AI understand the purpose of the interview and what topics to focus on. Include candidate background, specific skill assessments, or topic areas."
                placement="bottom-end"
              >
                <IconButton 
                  sx={{ position: 'absolute', top: 0, right: 0 }}
                  size="small"
                >
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button 
              variant="outlined"
              onClick={() => setActiveStep(0)}
              disabled={isLoading}
            >
              Back to Templates
            </Button>
            
            <Button 
              variant="contained"
              onClick={() => setActiveStep(2)}
              disabled={isLoading || 
                !interviewConfig.interviewTopic.trim() || 
                interviewConfig.interviewDuration < 5 || 
                interviewConfig.interviewDuration > 60
              }
            >
              Review & Start
            </Button>
          </Box>
        </>
      )}

      {/* Step 2: Review and Start */}
      {activeStep === 2 && (
        <>
          <Typography variant="h3" sx={{ mb: 3 }}>
            Review & Start Interview
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h3" fontSize="1.1rem" gutterBottom>
                  Interview Details
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip 
                      label={`Topic: ${interviewConfig.interviewTopic}`}
                      color="primary"
                    />
                    <Chip 
                      label={`Duration: ${interviewConfig.interviewDuration} min`}
                      color="secondary"
                    />
                    <Chip 
                      label={`Role: ${interviewConfig.roleType}`}
                      variant="outlined"
                    />
                  </Box>
                  
                  <Typography variant="subtitle1" fontWeight="medium" sx={{ mt: 1 }}>
                    Context & Instructions:
                  </Typography>
                  
                  <Typography variant="body2" sx={{ 
                    p: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}>
                    {interviewConfig.initialContext || "No specific context provided. The AI will conduct a general interview on the specified topic."}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              The AI interviewer will guide you through a conversation based on these settings.
              Remember that you can end the interview at any time using the "End Interview" button.
            </Typography>
            
            <Box sx={{ 
              p: 2, 
              bgcolor: alpha(theme.palette.warning.light, 0.1),
              borderRadius: 1,
              border: `1px solid ${alpha(theme.palette.warning.light, 0.3)}`,
            }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Tips for a successful interview:</strong>
                <ul>
                  <li>Speak naturally and give detailed responses</li>
                  <li>Take your time to think before answering</li>
                  <li>Ask for clarification if you don't understand a question</li>
                  <li>The AI will adapt to your responses and follow up accordingly</li>
                </ul>
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined"
              onClick={() => setActiveStep(1)}
              disabled={isLoading}
            >
              Edit Settings
            </Button>
            
            <Button 
              variant="contained"
              color="primary"
              startIcon={<StartIcon />}
              onClick={handleSubmit}
              disabled={isLoading}
              sx={{ 
                px: 4,
                py: 1,
                fontWeight: 'bold',
                boxShadow: theme.shadows[4]
              }}
            >
              {isLoading ? 'Starting...' : 'Start Interview'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default SetupPanel;