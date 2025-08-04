import React, { useState, useEffect, useRef } from 'react';
import { AdminPageLayout } from '@/features/admin/components/shared/AdminPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Progress } from '@/shared/components/ui/progress';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Bot,
  MessageSquare,
  Zap,
  Settings,
  Play,
  Pause,
  Square,
  RefreshCw,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Brain,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Users,
  Trophy,
  DollarSign,
  Calendar,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  Code,
  Database,
  Globe,
  Shield,
  Eye,
  EyeOff,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lightbulb,
  Rocket,
  Star
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestions?: string[];
  actions?: AIAction[];
}

interface AIAction {
  id: string;
  label: string;
  type: 'query' | 'analysis' | 'automation' | 'report';
  icon: React.ReactNode;
  description: string;
}

interface AutomationTask {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  trigger: string;
  lastRun: string;
  nextRun: string;
  success_rate: number;
  executions: number;
  category: 'monitoring' | 'maintenance' | 'analytics' | 'notifications';
}

interface AIInsight {
  id: string;
  title: string;
  type: 'opportunity' | 'warning' | 'recommendation' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  action: string;
  confidence: number;
  timestamp: string;
  data?: any;
}

interface AIModel {
  id: string;
  name: string;
  version: string;
  type: 'chat' | 'analysis' | 'prediction' | 'classification';
  status: 'active' | 'training' | 'offline';
  accuracy: number;
  lastUpdated: string;
  usage: number;
}

const AdminAIAssistantNew: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'system',
      content: 'AI Assistant initialized. How can I help you manage your system today?',
      timestamp: '14:30:00',
      suggestions: [
        'Show me system performance',
        'Analyze user engagement',
        'Generate tournament report',
        'Check for anomalies'
      ]
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([
    {
      id: '1',
      name: 'Performance Monitor',
      description: 'Monitor system performance and alert on anomalies',
      status: 'active',
      trigger: 'Every 5 minutes',
      lastRun: '2 minutes ago',
      nextRun: '3 minutes',
      success_rate: 98.5,
      executions: 2847,
      category: 'monitoring'
    },
    {
      id: '2',
      name: 'User Engagement Analysis',
      description: 'Daily analysis of user engagement metrics',
      status: 'active',
      trigger: 'Daily at 8:00 AM',
      lastRun: '6 hours ago',
      nextRun: '18 hours',
      success_rate: 100,
      executions: 45,
      category: 'analytics'
    },
    {
      id: '3',
      name: 'Database Cleanup',
      description: 'Clean up temporary data and optimize tables',
      status: 'paused',
      trigger: 'Weekly on Sunday',
      lastRun: '3 days ago',
      nextRun: 'Paused',
      success_rate: 95.2,
      executions: 156,
      category: 'maintenance'
    },
    {
      id: '4',
      name: 'Anomaly Detection',
      description: 'Detect unusual patterns in user behavior',
      status: 'active',
      trigger: 'Hourly',
      lastRun: '15 minutes ago',
      nextRun: '45 minutes',
      success_rate: 92.8,
      executions: 1203,
      category: 'monitoring'
    }
  ]);

  const [insights, setInsights] = useState<AIInsight[]>([
    {
      id: '1',
      title: 'Tournament Engagement Peak',
      type: 'opportunity',
      priority: 'high',
      description: 'User engagement increases by 340% during evening tournaments (7-9 PM)',
      impact: 'Potential 25% revenue increase',
      action: 'Schedule more tournaments during peak hours',
      confidence: 94,
      timestamp: '2 hours ago'
    },
    {
      id: '2',
      title: 'Database Performance Degradation',
      type: 'warning',
      priority: 'medium',
      description: 'Query response time increased by 45% in the last 24 hours',
      impact: 'User experience may be affected',
      action: 'Consider database optimization or scaling',
      confidence: 87,
      timestamp: '4 hours ago'
    },
    {
      id: '3',
      title: 'New User Registration Pattern',
      type: 'recommendation',
      priority: 'medium',
      description: 'Mobile users are 3x more likely to complete registration',
      impact: 'Optimize mobile onboarding flow',
      action: 'Improve mobile user experience',
      confidence: 91,
      timestamp: '1 day ago'
    },
    {
      id: '4',
      title: 'Unusual Login Activity',
      type: 'alert',
      priority: 'critical',
      description: 'Detected 50+ failed login attempts from suspicious IPs',
      impact: 'Potential security threat',
      action: 'Enable additional security measures',
      confidence: 99,
      timestamp: '30 minutes ago'
    }
  ]);

  const [aiModels, setAIModels] = useState<AIModel[]>([
    {
      id: '1',
      name: 'Chat Assistant',
      version: 'v2.1.3',
      type: 'chat',
      status: 'active',
      accuracy: 94.2,
      lastUpdated: '2 days ago',
      usage: 78
    },
    {
      id: '2',
      name: 'Anomaly Detector',
      version: 'v1.8.1',
      type: 'analysis',
      status: 'active',
      accuracy: 89.7,
      lastUpdated: '1 week ago',
      usage: 92
    },
    {
      id: '3',
      name: 'Revenue Predictor',
      version: 'v3.0.0',
      type: 'prediction',
      status: 'training',
      accuracy: 96.1,
      lastUpdated: '1 hour ago',
      usage: 34
    },
    {
      id: '4',
      name: 'Content Classifier',
      version: 'v1.5.2',
      type: 'classification',
      status: 'active',
      accuracy: 91.8,
      lastUpdated: '3 days ago',
      usage: 56
    }
  ]);

  const quickActions: AIAction[] = [
    { id: '1', label: 'System Health Check', type: 'analysis', icon: <Activity className="h-4 w-4" />, description: 'Analyze overall system health' },
    { id: '2', label: 'User Analytics', type: 'analysis', icon: <Users className="h-4 w-4" />, description: 'Generate user behavior insights' },
    { id: '3', label: 'Revenue Report', type: 'report', icon: <DollarSign className="h-4 w-4" />, description: 'Generate revenue analysis' },
    { id: '4', label: 'Tournament Insights', type: 'analysis', icon: <Trophy className="h-4 w-4" />, description: 'Analyze tournament performance' },
    { id: '5', label: 'Security Audit', type: 'analysis', icon: <Shield className="h-4 w-4" />, description: 'Run security analysis' },
    { id: '6', label: 'Performance Optimization', type: 'automation', icon: <Zap className="h-4 w-4" />, description: 'Optimize system performance' }
  ];

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(content),
        timestamp: new Date().toLocaleTimeString(),
        suggestions: generateSuggestions(content)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('performance') || lowerInput.includes('system')) {
      return "I've analyzed the current system performance. CPU usage is at 45%, memory at 2.8GB, and all services are running optimally. Would you like me to generate a detailed performance report?";
    }
    
    if (lowerInput.includes('user') || lowerInput.includes('engagement')) {
      return "User engagement metrics show a positive trend. Active users increased by 12% this week, with peak activity during evening hours. The new tournament format is driving 25% higher engagement.";
    }
    
    if (lowerInput.includes('revenue') || lowerInput.includes('money')) {
      return "Revenue analysis indicates strong growth. This month's revenue is up 18% compared to last month, with tournament entry fees contributing 65% of total revenue. Premium memberships show 23% growth.";
    }
    
    if (lowerInput.includes('security') || lowerInput.includes('threat')) {
      return "Security status is good. No active threats detected. Recent security scan found no vulnerabilities. I recommend enabling 2FA for all admin accounts and reviewing access logs weekly.";
    }
    
    return "I understand your request. I can help you with system analysis, user insights, performance monitoring, and automation tasks. What specific area would you like me to focus on?";
  };

  const generateSuggestions = (userInput: string): string[] => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('performance')) {
      return [
        'Show detailed metrics',
        'Performance optimization tips',
        'Set up monitoring alerts',
        'Compare with last week'
      ];
    }
    
    if (lowerInput.includes('user')) {
      return [
        'User retention analysis',
        'Engagement trends',
        'Create user segments',
        'Behavior patterns'
      ];
    }
    
    return [
      'Analyze system health',
      'Generate reports',
      'Set up automation',
      'Check for anomalies'
    ];
  };

  const executeQuickAction = (action: AIAction) => {
    const actionMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: `Execute: ${action.label}`,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, actionMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `${action.label} completed successfully. ${action.description} has been executed and results are ready for review.`,
        timestamp: new Date().toLocaleTimeString(),
        actions: quickActions.slice(0, 3)
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 2000);
  };

  const toggleTaskStatus = (taskId: string) => {
    setAutomationTasks(tasks => 
      tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: task.status === 'active' ? 'paused' : 'active' }
          : task
      )
    );
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'training': return 'text-blue-600 bg-blue-50';
      case 'offline': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <AdminPageLayout
      title="AI Assistant"
      description="Intelligent automation, insights, and assistance for system management"
    >
      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat Assistant
          </TabsTrigger>
          <TabsTrigger value="automation" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Automation
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Models
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Assistant Chat
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      New Chat
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.type === 'user'
                                ? 'bg-blue-600 text-white'
                                : message.type === 'system'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                            
                            {message.suggestions && (
                              <div className="mt-3 space-y-2">
                                <p className="text-xs font-medium">Suggestions:</p>
                                <div className="flex flex-wrap gap-2">
                                  {message.suggestions.map((suggestion, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => sendMessage(suggestion)}
                                    >
                                      {suggestion}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {message.actions && (
                              <div className="mt-3 space-y-2">
                                <p className="text-xs font-medium">Quick Actions:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {message.actions.map((action) => (
                                    <Button
                                      key={action.id}
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs justify-start"
                                      onClick={() => executeQuickAction(action)}
                                    >
                                      {action.icon}
                                      <span className="ml-1">{action.label}</span>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  <div className="border-t p-4">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Ask AI Assistant anything..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsListening(!isListening)}
                        className={isListening ? 'bg-red-50 text-red-600' : ''}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      <Button onClick={() => sendMessage(newMessage)}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => executeQuickAction(action)}
                    >
                      <div className="flex items-start gap-3">
                        {action.icon}
                        <div className="text-left">
                          <p className="font-medium text-sm">{action.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Automation Tasks</h3>
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {automationTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{task.name}</h4>
                        <Badge variant={task.status === 'active' ? 'default' : 'secondary'}>
                          {task.status}
                        </Badge>
                        <Badge variant="outline">{task.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                    <Switch
                      checked={task.status === 'active'}
                      onCheckedChange={() => toggleTaskStatus(task.id)}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Success Rate</span>
                      <span className="font-medium">{task.success_rate}%</span>
                    </div>
                    <Progress value={task.success_rate} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Trigger</p>
                        <p className="font-medium">{task.trigger}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Executions</p>
                        <p className="font-medium">{task.executions}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Run</p>
                        <p className="font-medium">{task.lastRun}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Next Run</p>
                        <p className="font-medium">{task.nextRun}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        Run Now
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Logs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI-Generated Insights</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate New
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-lg">{insight.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getPriorityColor(insight.priority)}>
                              {insight.priority} priority
                            </Badge>
                            <Badge variant="outline">{insight.type}</Badge>
                            <span className="text-sm text-gray-500">{insight.timestamp}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{insight.confidence}%</span>
                          </div>
                          <p className="text-xs text-gray-500">confidence</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-gray-700">{insight.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">Impact:</p>
                            <p className="text-gray-600">{insight.impact}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Recommended Action:</p>
                            <p className="text-gray-600">{insight.action}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm">
                          <Rocket className="h-3 w-3 mr-1" />
                          Take Action
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">AI Models</h3>
            <Button>
              <Bot className="h-4 w-4 mr-2" />
              Deploy Model
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiModels.map((model) => (
              <Card key={model.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-lg">{model.name}</h4>
                        <p className="text-sm text-gray-500">{model.version}</p>
                      </div>
                      <Badge className={getModelStatusColor(model.status)}>
                        {model.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Accuracy</span>
                        <span className="font-medium">{model.accuracy}%</span>
                      </div>
                      <Progress value={model.accuracy} className="h-2" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Usage</span>
                        <span className="font-medium">{model.usage}%</span>
                      </div>
                      <Progress value={model.usage} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="font-medium capitalize">{model.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Updated</p>
                        <p className="font-medium">{model.lastUpdated}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Metrics
                      </Button>
                      <Button size="sm" variant="outline">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retrain
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Assistant Settings</CardTitle>
                <CardDescription>Configure AI behavior and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Voice Input</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Auto-suggestions</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Proactive Insights</Label>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Response Style</Label>
                  <Select defaultValue="balanced">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>Configure automation behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Auto-execute Safe Tasks</Label>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Send Notifications</Label>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Default Retry Attempts</Label>
                  <Select defaultValue="3">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Execution Timeout (minutes)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
};

export default AdminAIAssistantNew;
