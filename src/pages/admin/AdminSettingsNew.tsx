import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Database,
  Save,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Smartphone,
  Lock,
  Unlock,
  Key,
  Server,
  Zap
} from 'lucide-react';
import { AdminCoreProvider } from '@/components/admin/core/AdminCoreProvider';
import { AdminPageLayout } from '@/components/admin/shared/AdminPageLayout';
import { toast } from 'sonner';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  settings: Setting[];
}

interface Setting {
  key: string;
  label: string;
  description: string;
  type: 'boolean' | 'text' | 'number' | 'select' | 'textarea';
  value: any;
  options?: { label: string; value: string }[];
  sensitive?: boolean;
  required?: boolean;
}

const AdminSettingsNew = () => {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

  // Mock settings data - would come from API in real app
  const [settingSections, setSettingSections] = useState<SettingSection[]>([
    {
      id: 'general',
      title: 'General Settings',
      description: 'Basic application configuration',
      icon: Settings,
      settings: [
        {
          key: 'app_name',
          label: 'Application Name',
          description: 'The name displayed throughout the application',
          type: 'text',
          value: 'Sabo Pool Arena Hub',
          required: true
        },
        {
          key: 'maintenance_mode',
          label: 'Maintenance Mode',
          description: 'Enable to put the application in maintenance mode',
          type: 'boolean',
          value: false
        },
        {
          key: 'max_tournaments_per_user',
          label: 'Max Tournaments per User',
          description: 'Maximum number of active tournaments per user',
          type: 'number',
          value: 5
        },
        {
          key: 'default_language',
          label: 'Default Language',
          description: 'Default language for new users',
          type: 'select',
          value: 'vi',
          options: [
            { label: 'Vietnamese', value: 'vi' },
            { label: 'English', value: 'en' },
            { label: 'Japanese', value: 'ja' }
          ]
        }
      ]
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Authentication and security configuration',
      icon: Shield,
      settings: [
        {
          key: 'jwt_secret',
          label: 'JWT Secret Key',
          description: 'Secret key for JWT token generation',
          type: 'text',
          value: '*********************',
          sensitive: true,
          required: true
        },
        {
          key: 'session_timeout',
          label: 'Session Timeout (minutes)',
          description: 'Automatic logout time for inactive sessions',
          type: 'number',
          value: 60
        },
        {
          key: 'password_min_length',
          label: 'Minimum Password Length',
          description: 'Minimum required password length',
          type: 'number',
          value: 8
        },
        {
          key: 'two_factor_required',
          label: 'Require Two-Factor Authentication',
          description: 'Force all users to enable 2FA',
          type: 'boolean',
          value: false
        },
        {
          key: 'allowed_login_attempts',
          label: 'Max Login Attempts',
          description: 'Maximum failed login attempts before account lock',
          type: 'number',
          value: 5
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Email and push notification configuration',
      icon: Bell,
      settings: [
        {
          key: 'email_notifications',
          label: 'Email Notifications',
          description: 'Enable system email notifications',
          type: 'boolean',
          value: true
        },
        {
          key: 'smtp_host',
          label: 'SMTP Host',
          description: 'Email server hostname',
          type: 'text',
          value: 'smtp.gmail.com'
        },
        {
          key: 'smtp_port',
          label: 'SMTP Port',
          description: 'Email server port',
          type: 'number',
          value: 587
        },
        {
          key: 'smtp_username',
          label: 'SMTP Username',
          description: 'Email server username',
          type: 'text',
          value: 'admin@sabopool.com'
        },
        {
          key: 'smtp_password',
          label: 'SMTP Password',
          description: 'Email server password',
          type: 'text',
          value: '*********************',
          sensitive: true
        },
        {
          key: 'push_notifications',
          label: 'Push Notifications',
          description: 'Enable mobile push notifications',
          type: 'boolean',
          value: true
        }
      ]
    },
    {
      id: 'database',
      title: 'Database Settings',
      description: 'Database connection and performance settings',
      icon: Database,
      settings: [
        {
          key: 'db_backup_enabled',
          label: 'Automatic Backups',
          description: 'Enable automatic database backups',
          type: 'boolean',
          value: true
        },
        {
          key: 'db_backup_frequency',
          label: 'Backup Frequency',
          description: 'How often to create backups',
          type: 'select',
          value: 'daily',
          options: [
            { label: 'Every 6 hours', value: '6h' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' }
          ]
        },
        {
          key: 'db_connection_pool_size',
          label: 'Connection Pool Size',
          description: 'Maximum database connections',
          type: 'number',
          value: 20
        },
        {
          key: 'db_query_timeout',
          label: 'Query Timeout (seconds)',
          description: 'Maximum time for database queries',
          type: 'number',
          value: 30
        }
      ]
    },
    {
      id: 'api',
      title: 'API Settings',
      description: 'API configuration and rate limiting',
      icon: Server,
      settings: [
        {
          key: 'api_rate_limit',
          label: 'API Rate Limit (requests/minute)',
          description: 'Maximum API requests per minute per user',
          type: 'number',
          value: 100
        },
        {
          key: 'api_key_required',
          label: 'Require API Key',
          description: 'Require API key for external access',
          type: 'boolean',
          value: true
        },
        {
          key: 'cors_enabled',
          label: 'Enable CORS',
          description: 'Allow cross-origin requests',
          type: 'boolean',
          value: true
        },
        {
          key: 'api_version',
          label: 'API Version',
          description: 'Current API version',
          type: 'select',
          value: 'v2',
          options: [
            { label: 'Version 1.0', value: 'v1' },
            { label: 'Version 2.0', value: 'v2' },
            { label: 'Version 3.0 (Beta)', value: 'v3' }
          ]
        }
      ]
    }
  ]);

  const updateSetting = (sectionId: string, settingKey: string, value: any) => {
    setSettingSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              settings: section.settings.map(setting =>
                setting.key === settingKey 
                  ? { ...setting, value }
                  : setting
              )
            }
          : section
      )
    );
  };

  const toggleSensitiveVisibility = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSaved(new Date());
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleExportSettings = () => {
    const exportData = settingSections.reduce((acc, section) => {
      acc[section.id] = section.settings.reduce((settings, setting) => {
        settings[setting.key] = setting.value;
        return settings;
      }, {} as Record<string, any>);
      return acc;
    }, {} as Record<string, any>);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully!');
  };

  const renderSetting = (setting: Setting, sectionId: string) => {
    const isVisible = showSensitive[setting.key];
    
    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">{setting.label}</Label>
              <p className="text-xs text-muted-foreground">{setting.description}</p>
            </div>
            <Switch
              checked={setting.value}
              onCheckedChange={(checked) => updateSetting(sectionId, setting.key, checked)}
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{setting.label}</Label>
            <select
              value={setting.value}
              onChange={(e) => updateSetting(sectionId, setting.key, e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {setting.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{setting.description}</p>
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{setting.label}</Label>
            <Textarea
              value={setting.value}
              onChange={(e) => updateSetting(sectionId, setting.key, e.target.value)}
              placeholder={setting.description}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{setting.description}</p>
          </div>
        );

      default: // text, number
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {setting.label}
              {setting.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="relative">
              <Input
                type={setting.sensitive && !isVisible ? 'password' : setting.type === 'number' ? 'number' : 'text'}
                value={setting.value}
                onChange={(e) => updateSetting(sectionId, setting.key, e.target.value)}
                placeholder={setting.description}
                className="pr-10"
              />
              {setting.sensitive && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => toggleSensitiveVisibility(setting.key)}
                >
                  {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{setting.description}</p>
          </div>
        );
    }
  };

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExportSettings}>
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
      <Button 
        onClick={handleSave} 
        disabled={saving}
        size="sm"
      >
        {saving ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );

  return (
    <AdminCoreProvider>
      <AdminPageLayout
        title="System Settings"
        description="Configure application settings and preferences"
        actions={pageActions}
      >
        <div className="space-y-6">
          {/* Save Status */}
          {lastSaved && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Settings saved successfully at {lastSaved.toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Tabs */}
          <Tabs defaultValue={settingSections[0]?.id} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              {settingSections.map((section) => (
                <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                  <section.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{section.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {settingSections.map((section) => (
              <TabsContent key={section.id} value={section.id} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <section.icon className="h-5 w-5" />
                      {section.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {section.settings.map((setting, index) => (
                      <div key={setting.key}>
                        {renderSetting(setting, section.id)}
                        {index < section.settings.length - 1 && <Separator className="my-4" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Security Warning */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-yellow-800">
                  <p className="font-medium text-sm">Security Notice</p>
                  <p className="text-xs mt-1">
                    Changes to security settings may affect user access and system functionality. 
                    Please review all changes carefully before saving.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminPageLayout>
    </AdminCoreProvider>
  );
};

export default AdminSettingsNew;
