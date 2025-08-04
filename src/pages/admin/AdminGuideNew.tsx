import React, { useState, useEffect } from 'react';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  BookOpen,
  Search,
  Filter,
  Star,
  Heart,
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Upload,
  Edit,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Circle,
  Play,
  Pause,
  Square,
  RotateCcw,
  FastForward,
  Settings,
  HelpCircle,
  FileText,
  Video,
  Image,
  Link,
  Code,
  Database,
  Users,
  Trophy,
  DollarSign,
  Zap,
  Shield,
  Activity,
  BarChart3,
  Calendar,
  Bell,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Lightbulb,
  Target,
  Rocket,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  BookmarkPlus,
  ExternalLink
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  category: 'getting-started' | 'features' | 'advanced' | 'troubleshooting' | 'api' | 'best-practices';
  level: 'beginner' | 'intermediate' | 'advanced';
  readTime: number;
  lastUpdated: string;
  views: number;
  likes: number;
  helpful: number;
  content: string;
  tags: string[];
  author: string;
  subsections?: GuideSubsection[];
}

interface GuideSubsection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'image' | 'video';
  order: number;
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  category: string;
  level: string;
  views: number;
  rating: number;
  publishedAt: string;
  url: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
  lastUpdated: string;
  tags: string[];
}

interface Changelog {
  id: string;
  version: string;
  releaseDate: string;
  type: 'major' | 'minor' | 'patch';
  changes: ChangelogItem[];
  highlights: string[];
}

interface ChangelogItem {
  type: 'feature' | 'improvement' | 'bugfix' | 'breaking';
  description: string;
  component?: string;
}

const AdminGuideNew: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [bookmarkedGuides, setBookmarkedGuides] = useState<string[]>([]);

  const [guides, setGuides] = useState<GuideSection[]>([
    {
      id: '1',
      title: 'Getting Started with Admin Panel',
      category: 'getting-started',
      level: 'beginner',
      readTime: 5,
      lastUpdated: '2025-08-01',
      views: 2843,
      likes: 127,
      helpful: 95,
      content: 'Complete guide to navigating and using the admin panel for the first time.',
      tags: ['dashboard', 'navigation', 'basics'],
      author: 'Admin Team',
      subsections: [
        { id: '1-1', title: 'Dashboard Overview', content: 'Understanding the main dashboard layout and key metrics.', type: 'text', order: 1 },
        { id: '1-2', title: 'Navigation Menu', content: 'How to use the sidebar navigation and find different features.', type: 'text', order: 2 },
        { id: '1-3', title: 'User Management Basics', content: 'Essential user management operations for new admins.', type: 'text', order: 3 }
      ]
    },
    {
      id: '2',
      title: 'Tournament Management Guide',
      category: 'features',
      level: 'intermediate',
      readTime: 15,
      lastUpdated: '2025-07-28',
      views: 1567,
      likes: 89,
      helpful: 78,
      content: 'Comprehensive guide for creating, managing, and monitoring tournaments.',
      tags: ['tournaments', 'brackets', 'scheduling'],
      author: 'Tournament Team',
      subsections: [
        { id: '2-1', title: 'Creating Tournaments', content: 'Step-by-step tournament creation process.', type: 'text', order: 1 },
        { id: '2-2', title: 'Bracket Generation', content: 'Automated and manual bracket generation options.', type: 'text', order: 2 },
        { id: '2-3', title: 'Live Monitoring', content: 'Real-time tournament monitoring and management.', type: 'text', order: 3 }
      ]
    },
    {
      id: '3',
      title: 'Advanced Analytics & Reporting',
      category: 'advanced',
      level: 'advanced',
      readTime: 25,
      lastUpdated: '2025-07-25',
      views: 892,
      likes: 67,
      helpful: 58,
      content: 'Deep dive into analytics tools, custom reports, and data interpretation.',
      tags: ['analytics', 'reports', 'data'],
      author: 'Analytics Team'
    },
    {
      id: '4',
      title: 'API Integration Guide',
      category: 'api',
      level: 'advanced',
      readTime: 30,
      lastUpdated: '2025-07-20',
      views: 1234,
      likes: 94,
      helpful: 87,
      content: 'Complete API documentation and integration examples.',
      tags: ['api', 'integration', 'development'],
      author: 'Dev Team'
    },
    {
      id: '5',
      title: 'Security Best Practices',
      category: 'best-practices',
      level: 'intermediate',
      readTime: 12,
      lastUpdated: '2025-07-15',
      views: 2156,
      likes: 156,
      helpful: 142,
      content: 'Essential security practices for admin panel usage.',
      tags: ['security', 'authentication', 'permissions'],
      author: 'Security Team'
    },
    {
      id: '6',
      title: 'Troubleshooting Common Issues',
      category: 'troubleshooting',
      level: 'beginner',
      readTime: 8,
      lastUpdated: '2025-08-02',
      views: 3421,
      likes: 198,
      helpful: 187,
      content: 'Solutions to frequently encountered problems and errors.',
      tags: ['troubleshooting', 'errors', 'support'],
      author: 'Support Team'
    }
  ]);

  const [videoTutorials, setVideoTutorials] = useState<VideoTutorial[]>([
    {
      id: '1',
      title: 'Admin Panel Quick Tour',
      description: 'A 5-minute overview of the main admin panel features',
      thumbnail: '/api/placeholder/320/180',
      duration: '5:23',
      category: 'getting-started',
      level: 'beginner',
      views: 5642,
      rating: 4.8,
      publishedAt: '2025-07-30',
      url: '#'
    },
    {
      id: '2',
      title: 'Tournament Setup Walkthrough',
      description: 'Complete step-by-step tournament creation process',
      thumbnail: '/api/placeholder/320/180',
      duration: '12:45',
      category: 'features',
      level: 'intermediate',
      views: 3421,
      rating: 4.9,
      publishedAt: '2025-07-25',
      url: '#'
    },
    {
      id: '3',
      title: 'Advanced Analytics Deep Dive',
      description: 'Exploring advanced analytics features and custom reports',
      thumbnail: '/api/placeholder/320/180',
      duration: '18:32',
      category: 'advanced',
      level: 'advanced',
      views: 1876,
      rating: 4.7,
      publishedAt: '2025-07-20',
      url: '#'
    },
    {
      id: '4',
      title: 'User Management Best Practices',
      description: 'Effective strategies for managing users and permissions',
      thumbnail: '/api/placeholder/320/180',
      duration: '9:15',
      category: 'best-practices',
      level: 'intermediate',
      views: 2954,
      rating: 4.6,
      publishedAt: '2025-07-15',
      url: '#'
    }
  ]);

  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: '1',
      question: 'How do I reset a user\'s password?',
      answer: 'Navigate to User Management, find the user, click the three dots menu, and select "Reset Password". The user will receive an email with reset instructions.',
      category: 'user-management',
      helpful: 87,
      notHelpful: 3,
      lastUpdated: '2025-08-01',
      tags: ['password', 'users', 'reset']
    },
    {
      id: '2',
      question: 'Can I customize tournament bracket formats?',
      answer: 'Yes, you can choose from single elimination, double elimination, round robin, and custom formats. Go to Tournament Settings to configure bracket types.',
      category: 'tournaments',
      helpful: 64,
      notHelpful: 8,
      lastUpdated: '2025-07-28',
      tags: ['tournaments', 'brackets', 'formats']
    },
    {
      id: '3',
      question: 'How do I export analytics data?',
      answer: 'In the Analytics section, use the Export button to download data in CSV, Excel, or PDF formats. You can also schedule automated reports.',
      category: 'analytics',
      helpful: 45,
      notHelpful: 2,
      lastUpdated: '2025-07-25',
      tags: ['analytics', 'export', 'reports']
    },
    {
      id: '4',
      question: 'What are the system requirements?',
      answer: 'The admin panel works on modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+). Mobile devices are supported but desktop is recommended for full functionality.',
      category: 'technical',
      helpful: 129,
      notHelpful: 5,
      lastUpdated: '2025-07-30',
      tags: ['system', 'requirements', 'browser']
    },
    {
      id: '5',
      question: 'How do I set up automated notifications?',
      answer: 'Go to Notifications Settings, create notification rules based on events, and configure delivery methods (email, SMS, webhook).',
      category: 'notifications',
      helpful: 78,
      notHelpful: 4,
      lastUpdated: '2025-08-02',
      tags: ['notifications', 'automation', 'alerts']
    }
  ]);

  const [changelog, setChangelog] = useState<Changelog[]>([
    {
      id: '1',
      version: 'v8.76.1',
      releaseDate: '2025-08-03',
      type: 'minor',
      highlights: ['New AI Assistant', 'Enhanced Development Tools', 'Improved Emergency Management'],
      changes: [
        { type: 'feature', description: 'Added AI Assistant with chat interface and automation', component: 'AI Assistant' },
        { type: 'feature', description: 'Enhanced development tools with system monitoring', component: 'Development' },
        { type: 'improvement', description: 'Improved emergency incident management workflow', component: 'Emergency' },
        { type: 'bugfix', description: 'Fixed tournament bracket generation edge cases', component: 'Tournaments' }
      ]
    },
    {
      id: '2',
      version: 'v8.76.0',
      releaseDate: '2025-08-01',
      type: 'major',
      highlights: ['Complete Admin Redesign', 'New Reporting System', 'Advanced Scheduling'],
      changes: [
        { type: 'feature', description: 'Complete admin panel redesign with modern UI', component: 'Admin Panel' },
        { type: 'feature', description: 'New comprehensive reporting system', component: 'Reports' },
        { type: 'feature', description: 'Advanced scheduling and calendar features', component: 'Scheduling' },
        { type: 'improvement', description: 'Enhanced user management capabilities', component: 'Users' },
        { type: 'improvement', description: 'Better tournament management workflow', component: 'Tournaments' }
      ]
    },
    {
      id: '3',
      version: 'v8.75.9',
      releaseDate: '2025-07-28',
      type: 'patch',
      highlights: ['Bug Fixes', 'Performance Improvements'],
      changes: [
        { type: 'bugfix', description: 'Fixed payment processing timeout issues', component: 'Payments' },
        { type: 'bugfix', description: 'Resolved user profile update conflicts', component: 'Users' },
        { type: 'improvement', description: 'Optimized database queries for better performance', component: 'Database' },
        { type: 'improvement', description: 'Enhanced error handling and logging', component: 'System' }
      ]
    }
  ]);

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || guide.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleBookmark = (guideId: string) => {
    setBookmarkedGuides(prev => 
      prev.includes(guideId) 
        ? prev.filter(id => id !== guideId)
        : [...prev, guideId]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting-started': return <Rocket className="h-4 w-4" />;
      case 'features': return <Zap className="h-4 w-4" />;
      case 'advanced': return <Target className="h-4 w-4" />;
      case 'troubleshooting': return <AlertTriangle className="h-4 w-4" />;
      case 'api': return <Code className="h-4 w-4" />;
      case 'best-practices': return <Lightbulb className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Plus className="h-3 w-3 text-green-600" />;
      case 'improvement': return <TrendingUp className="h-3 w-3 text-blue-600" />;
      case 'bugfix': return <CheckCircle className="h-3 w-3 text-yellow-600" />;
      case 'breaking': return <AlertTriangle className="h-3 w-3 text-red-600" />;
      default: return <Circle className="h-3 w-3 text-gray-600" />;
    }
  };

  const getVersionTypeColor = (type: string) => {
    switch (type) {
      case 'major': return 'bg-red-100 text-red-800 border-red-200';
      case 'minor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'patch': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AdminPageLayout
      title="Documentation & Guides"
      description="Comprehensive documentation, tutorials, and help resources"
    >
      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="guides" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Guides
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video Tutorials
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="changelog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Changelog
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search guides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="getting-started">Getting Started</SelectItem>
                  <SelectItem value="features">Features</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="best-practices">Best Practices</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Guide
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <Card key={guide.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(guide.category)}
                        <CardTitle className="text-lg line-clamp-2">{guide.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(guide.level)}>
                          {guide.level}
                        </Badge>
                        <Badge variant="outline">{guide.category}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmark(guide.id)}
                      className={bookmarkedGuides.includes(guide.id) ? 'text-yellow-600' : ''}
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{guide.content}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {guide.readTime} min read
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {guide.views.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {guide.likes}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {guide.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {guide.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{guide.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-500">
                      Updated {guide.lastUpdated}
                    </span>
                    <Button size="sm">
                      Read Guide
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Video Tutorials</h3>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoTutorials.map((video) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="lg" className="rounded-full">
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                  <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">
                    {video.duration}
                  </Badge>
                </div>
                <CardContent className="pt-4 space-y-3">
                  <h4 className="font-medium line-clamp-2">{video.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{video.description}</p>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getLevelColor(video.level)}>
                      {video.level}
                    </Badge>
                    <Badge variant="outline">{video.category}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.views.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {video.rating}
                      </div>
                    </div>
                    <span>{video.publishedAt}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          </div>

          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <Collapsible key={faq.id}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between text-left">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{faq.question}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{faq.category}</Badge>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3" />
                                {faq.helpful}
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3" />
                                {faq.notHelpful}
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <p className="text-gray-700">{faq.answer}</p>
                        
                        <div className="flex flex-wrap gap-1">
                          {faq.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t">
                          <span className="text-xs text-gray-500">
                            Updated {faq.lastUpdated}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Helpful
                            </Button>
                            <Button variant="outline" size="sm">
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Not Helpful
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="changelog" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Version History</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Release
            </Button>
          </div>

          <div className="space-y-6">
            {changelog.map((release) => (
              <Card key={release.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="text-xl font-semibold">{release.version}</h4>
                        <Badge className={getVersionTypeColor(release.type)}>
                          {release.type}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">{release.releaseDate}</span>
                    </div>
                    
                    {release.highlights.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium">Highlights</h5>
                        <ul className="space-y-1">
                          {release.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <h5 className="font-medium">Changes</h5>
                      <div className="space-y-2">
                        {release.changes.map((change, index) => (
                          <div key={index} className="flex items-start gap-3 text-sm">
                            {getChangeTypeIcon(change.type)}
                            <div className="flex-1">
                              <span className="font-medium capitalize">{change.type}:</span> {change.description}
                              {change.component && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {change.component}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Complete API reference and integration guides</p>
                <Button className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View API Docs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Schema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Database structure and relationship documentation</p>
                <Button className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Schema
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">System configuration and environment setup</p>
                <Button className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Guide
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Tools, templates, and resources for download</p>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Browse Downloads
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Community Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Join our community for help and discussions</p>
                <Button className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Community
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Support Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Get help from our support team</p>
                <Button className="w-full" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
};

export default AdminGuideNew;
