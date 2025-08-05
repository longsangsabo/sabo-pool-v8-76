import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Progress } from '@/shared/components/ui/progress';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Play,
  RefreshCw,
  Info,
  Database,
  Code,
  Settings,
} from 'lucide-react';
import {
  validateOfficialELOIntegration,
  getValidationSummary,
  ELOValidationResult,
} from '@/utils/eloValidation';

export const ELOIntegrationValidator: React.FC = () => {
  const [results, setResults] = useState<ELOValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const validationResults = await validateOfficialELOIntegration();
      setResults(validationResults);
      setHasRun(true);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'WARNING':
        return <AlertTriangle className='w-4 h-4 text-yellow-600' />;
      case 'FAIL':
        return <XCircle className='w-4 h-4 text-red-600' />;
      default:
        return <Info className='w-4 h-4 text-gray-600' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'FAIL':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComponentIcon = (component: string) => {
    if (component.includes('Database') || component.includes('Mapping')) {
      return <Database className='w-4 h-4' />;
    }
    if (component.includes('Frontend') || component.includes('Constants')) {
      return <Code className='w-4 h-4' />;
    }
    return <Settings className='w-4 h-4' />;
  };

  const summary = hasRun ? getValidationSummary(results) : null;

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>ELO Integration Validator</h2>
          <p className='text-muted-foreground'>
            Kiểm tra tính nhất quán của hệ thống ELO integration
          </p>
        </div>
        <Button onClick={runValidation} disabled={loading} className='gap-2'>
          {loading ? (
            <RefreshCw className='w-4 h-4 animate-spin' />
          ) : (
            <Play className='w-4 h-4' />
          )}
          {hasRun ? 'Re-run Validation' : 'Run Validation'}
        </Button>
      </div>

      {/* Validation Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              {getStatusIcon(summary.overallStatus)}
              Validation Summary
            </CardTitle>
            <CardDescription>
              Overall integration status và component breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Overall Status</span>
                <Badge
                  variant='outline'
                  className={getStatusColor(summary.overallStatus)}
                >
                  {summary.overallStatus}
                </Badge>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Progress</span>
                  <span>{summary.percentage}%</span>
                </div>
                <Progress value={summary.percentage} className='h-2' />
              </div>

              <div className='grid grid-cols-4 gap-4 text-center'>
                <div>
                  <p className='text-2xl font-bold text-green-600'>
                    {summary.passed}
                  </p>
                  <p className='text-xs text-muted-foreground'>Passed</p>
                </div>
                <div>
                  <p className='text-2xl font-bold text-yellow-600'>
                    {summary.warnings}
                  </p>
                  <p className='text-xs text-muted-foreground'>Warnings</p>
                </div>
                <div>
                  <p className='text-2xl font-bold text-red-600'>
                    {summary.failed}
                  </p>
                  <p className='text-xs text-muted-foreground'>Failed</p>
                </div>
                <div>
                  <p className='text-2xl font-bold text-gray-600'>
                    {summary.total}
                  </p>
                  <p className='text-xs text-muted-foreground'>Total</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {results.length > 0 && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Validation Results</h3>
          {results.map((result, index) => (
            <Card
              key={index}
              className={`border-l-4 ${getStatusColor(result.status)}`}
            >
              <CardContent className='p-4'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-start gap-3'>
                    <div
                      className={`p-2 rounded-lg ${getStatusColor(result.status)}`}
                    >
                      {getComponentIcon(result.component)}
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h4 className='font-semibold'>{result.component}</h4>
                        {getStatusIcon(result.status)}
                      </div>
                      <p className='text-sm text-muted-foreground mb-2'>
                        {result.message}
                      </p>

                      {/* Show details if available */}
                      {result.details && (
                        <details className='text-xs'>
                          <summary className='cursor-pointer text-muted-foreground hover:text-foreground'>
                            View Details
                          </summary>
                          <pre className='mt-2 p-2 bg-muted rounded text-xs overflow-x-auto'>
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant='outline'
                    className={getStatusColor(result.status)}
                  >
                    {result.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Initial State */}
      {!hasRun && !loading && (
        <Alert>
          <Info className='w-4 h-4' />
          <AlertDescription>
            Nhấn <strong>"Run Validation"</strong> để kiểm tra tính nhất quán
            của hệ thống ELO integration. Validation sẽ kiểm tra:
            <br />
            • Frontend constants consistency
            <br />
            • Database rank definitions
            <br />
            • ELO calculation rules
            <br />
            • Game configurations
            <br />
            • Official mapping functions
            <br />• Cross-component consistency
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className='p-8'>
            <div className='flex flex-col items-center gap-4'>
              <RefreshCw className='w-8 h-8 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>
                Running ELO integration validation...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {hasRun && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Actions để fix common issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <h4 className='font-medium'>Database Issues</h4>
                <p className='text-sm text-muted-foreground'>
                  Nếu validation fail ở database, run migration:
                </p>
                <code className='text-xs bg-muted p-2 rounded block'>
                  supabase db push
                </code>
              </div>
              <div className='space-y-2'>
                <h4 className='font-medium'>Frontend Issues</h4>
                <p className='text-sm text-muted-foreground'>
                  Nếu constants không match, check file:
                </p>
                <code className='text-xs bg-muted p-2 rounded block'>
                  src/utils/eloConstants.ts
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
