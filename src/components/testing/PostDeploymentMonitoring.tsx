import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  TrendingUp,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Send,
  CheckCircle,
} from 'lucide-react';

interface FeedbackData {
  id: string;
  userId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  rating: number;
  category: 'performance' | 'usability' | 'design' | 'bugs';
  message: string;
  timestamp: number;
  status: 'new' | 'reviewed' | 'resolved';
}

interface UserSentiment {
  positive: number;
  neutral: number;
  negative: number;
}

export const PostDeploymentMonitoring: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<FeedbackData[]>([]);
  const [userFeedback, setUserFeedback] = useState('');
  const [userRating, setUserRating] = useState(5);
  const [feedbackCategory, setFeedbackCategory] =
    useState<FeedbackData['category']>('usability');
  const [sentiment, setSentiment] = useState<UserSentiment>({
    positive: 0,
    neutral: 0,
    negative: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Simulate real-time feedback data
  useEffect(() => {
    const sampleFeedback: FeedbackData[] = [
      {
        id: 'fb_1',
        userId: 'user_123',
        deviceType: 'mobile',
        rating: 5,
        category: 'usability',
        message:
          'The new responsive design is amazing! Much better touch targets on mobile.',
        timestamp: Date.now() - 3600000,
        status: 'new',
      },
      {
        id: 'fb_2',
        userId: 'user_456',
        deviceType: 'tablet',
        rating: 4,
        category: 'design',
        message:
          'Love the tablet optimizations. The spacing feels much more natural.',
        timestamp: Date.now() - 7200000,
        status: 'reviewed',
      },
      {
        id: 'fb_3',
        userId: 'user_789',
        deviceType: 'desktop',
        rating: 3,
        category: 'performance',
        message: 'Sometimes there are small delays when resizing the window.',
        timestamp: Date.now() - 10800000,
        status: 'resolved',
      },
    ];

    setFeedbackList(sampleFeedback);

    // Calculate sentiment
    const total = sampleFeedback.length;
    const positive = sampleFeedback.filter(f => f.rating >= 4).length;
    const negative = sampleFeedback.filter(f => f.rating <= 2).length;
    const neutral = total - positive - negative;

    setSentiment({
      positive: (positive / total) * 100,
      neutral: (neutral / total) * 100,
      negative: (negative / total) * 100,
    });
  }, []);

  const submitFeedback = async () => {
    if (!userFeedback.trim()) return;

    setIsSubmitting(true);

    const newFeedback: FeedbackData = {
      id: `fb_${Date.now()}`,
      userId: 'current_user',
      deviceType:
        window.innerWidth < 768
          ? 'mobile'
          : window.innerWidth < 1024
            ? 'tablet'
            : 'desktop',
      rating: userRating,
      category: feedbackCategory,
      message: userFeedback,
      timestamp: Date.now(),
      status: 'new',
    };

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setFeedbackList(prev => [newFeedback, ...prev]);
    setUserFeedback('');
    setHasSubmitted(true);
    setIsSubmitting(false);

    // Update sentiment
    const total = feedbackList.length + 1;
    const positive = [...feedbackList, newFeedback].filter(
      f => f.rating >= 4
    ).length;
    const negative = [...feedbackList, newFeedback].filter(
      f => f.rating <= 2
    ).length;
    const neutral = total - positive - negative;

    setSentiment({
      positive: (positive / total) * 100,
      neutral: (neutral / total) * 100,
      negative: (negative / total) * 100,
    });

    console.log('📝 User feedback submitted:', newFeedback);
  };

  const getDeviceIcon = (device: string) => {
    return device === 'mobile' ? '📱' : device === 'tablet' ? '📋' : '🖥️';
  };

  const getCategoryColor = (category: FeedbackData['category']) => {
    const colors = {
      performance: 'bg-blue-100 text-blue-800',
      usability: 'bg-green-100 text-green-800',
      design: 'bg-purple-100 text-purple-800',
      bugs: 'bg-red-100 text-red-800',
    };
    return colors[category];
  };

  const getStatusColor = (status: FeedbackData['status']) => {
    const colors = {
      new: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
    };
    return colors[status];
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <BarChart3 className='h-5 w-5' />
          <CardTitle>Post-Deployment Monitoring</CardTitle>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Metrics Overview */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center p-3 bg-green-50 rounded-lg'>
            <div className='text-2xl font-bold text-green-600'>
              {sentiment.positive.toFixed(0)}%
            </div>
            <div className='text-sm text-green-600 flex items-center justify-center gap-1'>
              <ThumbsUp className='h-3 w-3' />
              Positive
            </div>
          </div>

          <div className='text-center p-3 bg-gray-50 rounded-lg'>
            <div className='text-2xl font-bold text-gray-600'>
              {sentiment.neutral.toFixed(0)}%
            </div>
            <div className='text-sm text-gray-600'>Neutral</div>
          </div>

          <div className='text-center p-3 bg-red-50 rounded-lg'>
            <div className='text-2xl font-bold text-red-600'>
              {sentiment.negative.toFixed(0)}%
            </div>
            <div className='text-sm text-red-600 flex items-center justify-center gap-1'>
              <ThumbsDown className='h-3 w-3' />
              Negative
            </div>
          </div>

          <div className='text-center p-3 bg-blue-50 rounded-lg'>
            <div className='text-2xl font-bold text-blue-600'>
              {feedbackList.length}
            </div>
            <div className='text-sm text-blue-600 flex items-center justify-center gap-1'>
              <MessageSquare className='h-3 w-3' />
              Total Feedback
            </div>
          </div>
        </div>

        {/* User Sentiment Chart */}
        <Card className='bg-muted/50'>
          <CardHeader>
            <CardTitle className='text-lg'>
              User Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='flex items-center gap-2'>
                  <ThumbsUp className='h-4 w-4 text-green-600' />
                  Positive ({sentiment.positive.toFixed(0)}%)
                </span>
              </div>
              <Progress
                value={sentiment.positive}
                className='h-2 bg-green-100'
              />
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='flex items-center gap-2'>
                  <div className='w-4 h-4 bg-gray-400 rounded-full' />
                  Neutral ({sentiment.neutral.toFixed(0)}%)
                </span>
              </div>
              <Progress value={sentiment.neutral} className='h-2 bg-gray-100' />
            </div>

            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='flex items-center gap-2'>
                  <ThumbsDown className='h-4 w-4 text-red-600' />
                  Negative ({sentiment.negative.toFixed(0)}%)
                </span>
              </div>
              <Progress value={sentiment.negative} className='h-2 bg-red-100' />
            </div>
          </CardContent>
        </Card>

        {/* Feedback Submission */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Share Your Experience</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {hasSubmitted ? (
              <Alert>
                <CheckCircle className='h-4 w-4' />
                <AlertDescription>
                  Thank you for your feedback! Your input helps us improve the
                  responsive experience.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    How would you rate the new responsive design?
                  </label>
                  <div className='flex gap-1'>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        className={`text-2xl ${star <= userRating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        <Star className='h-6 w-6 fill-current' />
                      </button>
                    ))}
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Category</label>
                  <div className='flex gap-2 flex-wrap'>
                    {(
                      ['performance', 'usability', 'design', 'bugs'] as const
                    ).map(category => (
                      <Button
                        key={category}
                        variant={
                          feedbackCategory === category ? 'default' : 'outline'
                        }
                        size='sm'
                        onClick={() => setFeedbackCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>Your feedback</label>
                  <Textarea
                    value={userFeedback}
                    onChange={e => setUserFeedback(e.target.value)}
                    placeholder='Tell us about your experience with the new responsive design...'
                    rows={4}
                  />
                </div>

                <Button
                  onClick={submitFeedback}
                  disabled={isSubmitting || !userFeedback.trim()}
                  className='w-full'
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className='h-4 w-4 mr-2' />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Recent User Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {feedbackList.slice(0, 5).map(feedback => (
                <div
                  key={feedback.id}
                  className='border rounded-lg p-4 space-y-2'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <span>{getDeviceIcon(feedback.deviceType)}</span>
                      <div className='flex gap-1'>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <Badge className={getCategoryColor(feedback.category)}>
                        {feedback.category}
                      </Badge>
                      <Badge className={getStatusColor(feedback.status)}>
                        {feedback.status}
                      </Badge>
                    </div>
                    <span className='text-xs text-muted-foreground'>
                      {formatTimeAgo(feedback.timestamp)}
                    </span>
                  </div>

                  <p className='text-sm text-muted-foreground'>
                    {feedback.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Continuous Optimization Insights */}
        <Card className='bg-blue-50'>
          <CardHeader>
            <CardTitle className='text-lg'>Optimization Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3 text-sm'>
              <div className='flex items-center gap-2'>
                <TrendingUp className='h-4 w-4 text-blue-600' />
                <span>
                  <strong>Performance:</strong> 95% of users report improved
                  load times
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-green-600' />
                <span>
                  <strong>Usability:</strong> Mobile touch targets receive
                  positive feedback
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <BarChart3 className='h-4 w-4 text-purple-600' />
                <span>
                  <strong>Engagement:</strong> 12% increase in time spent on
                  site
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <MessageSquare className='h-4 w-4 text-orange-600' />
                <span>
                  <strong>Feedback:</strong> 88% satisfaction rate with new
                  responsive design
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
