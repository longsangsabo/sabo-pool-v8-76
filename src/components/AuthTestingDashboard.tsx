import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Database,
  Shield,
  User,
  Bell,
  CreditCard,
  Link,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DatabaseTester from '@/utils/databaseTester';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  test: string;
  success: boolean;
  error?: string;
  data?: any;
  duration?: number;
}

const AuthTestingDashboard = () => {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [authTests, setAuthTests] = useState<TestResult[]>([]);
  const [notificationTests, setNotificationTests] = useState<TestResult[]>([]);
  const [paymentTests, setPaymentTests] = useState<TestResult[]>([]);
  const [rlsTests, setRlsTests] = useState<TestResult[]>([]);
  const [fkTests, setFkTests] = useState<TestResult[]>([]);
  const [databaseTester] = useState(new DatabaseTester());

  const runAuthTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    // Test current session
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      results.push({
        test: 'Get Current Session',
        success: !error && !!session,
        error: error?.message,
        data: session ? 'Session active' : 'No session',
      });
    } catch (error: any) {
      results.push({
        test: 'Get Current Session',
        success: false,
        error: error.message,
      });
    }

    // Test user profile
    if (user) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        results.push({
          test: 'User Profile Access',
          success: !error,
          error: error?.message,
          data: data ? 'Profile found' : 'No profile',
        });
      } catch (error: any) {
        results.push({
          test: 'User Profile Access',
          success: false,
          error: error.message,
        });
      }
    }

    // Test token refresh
    try {
      const { data, error } = await supabase.auth.refreshSession();
      results.push({
        test: 'Token Refresh',
        success: !error,
        error: error?.message,
        data: data.session ? 'Token refreshed' : 'No token',
      });
    } catch (error: any) {
      results.push({
        test: 'Token Refresh',
        success: false,
        error: error.message,
      });
    }

    setAuthTests(results);
    setIsRunning(false);
  };

  const runDatabaseTests = async () => {
    setIsRunning(true);
    const results = await databaseTester.runAllTests();
    setTestResults(results);
    setIsRunning(false);
  };

  const runNotificationTests = async () => {
    setIsRunning(true);
    const results = await databaseTester.testNotificationsCRUD();
    setNotificationTests(results);
    setIsRunning(false);
  };

  const runPaymentTests = async () => {
    setIsRunning(true);
    const results = await databaseTester.testPaymentsCRUD();
    setPaymentTests(results);
    setIsRunning(false);
  };

  const runRLSTests = async () => {
    setIsRunning(true);
    const results = await databaseTester.testRLSPolicies();
    setRlsTests(results);
    setIsRunning(false);
  };

  const runFKTests = async () => {
    setIsRunning(true);
    const results = await databaseTester.testForeignKeyConstraints();
    setFkTests(results);
    setIsRunning(false);
  };

  const runAllTests = async () => {
    await runAuthTests();
    await runDatabaseTests();
    await runNotificationTests();
    await runPaymentTests();
    await runRLSTests();
    await runFKTests();
  };

  const TestResultItem = ({ result }: { result: TestResult }) => (
    <div className='flex items-center justify-between p-3 border rounded-lg'>
      <div className='flex items-center space-x-3'>
        {result.success ? (
          <CheckCircle className='h-5 w-5 text-green-500' />
        ) : (
          <XCircle className='h-5 w-5 text-red-500' />
        )}
        <div>
          <p className='font-medium'>{result.test}</p>
          {result.error && (
            <p className='text-sm text-red-600'>{result.error}</p>
          )}
          {result.data && typeof result.data === 'string' && (
            <p className='text-sm text-gray-600'>{result.data}</p>
          )}
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        {result.duration && (
          <Badge variant='outline'>{result.duration}ms</Badge>
        )}
        <Badge variant={result.success ? 'default' : 'destructive'}>
          {result.success ? 'PASS' : 'FAIL'}
        </Badge>
      </div>
    </div>
  );

  const Summary = ({ results }: { results: TestResult[] }) => {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;

    if (total === 0) return null;

    return (
      <div className='grid grid-cols-3 gap-4 mb-6'>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-blue-600'>{total}</div>
            <div className='text-sm text-gray-600'>Total Tests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-green-600'>{passed}</div>
            <div className='text-sm text-gray-600'>Passed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-4 text-center'>
            <div className='text-2xl font-bold text-red-600'>{failed}</div>
            <div className='text-sm text-gray-600'>Failed</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>
          Database CRUD & Authentication Testing
        </h1>
        <div className='flex space-x-2'>
          <Button onClick={runAuthTests} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className='w-4 h-4 animate-spin mr-2' />
            ) : (
              <User className='w-4 h-4 mr-2' />
            )}
            Test Auth
          </Button>
          <Button onClick={runDatabaseTests} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className='w-4 h-4 animate-spin mr-2' />
            ) : (
              <Database className='w-4 h-4 mr-2' />
            )}
            Test Database
          </Button>
          <Button onClick={runAllTests} disabled={isRunning} variant='default'>
            {isRunning ? (
              <Loader2 className='w-4 h-4 animate-spin mr-2' />
            ) : (
              <Shield className='w-4 h-4 mr-2' />
            )}
            Run All Tests
          </Button>
        </div>
      </div>

      {user ? (
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <CheckCircle className='h-5 w-5 text-green-500' />
              <div>
                <p className='font-medium'>Authenticated as: {user.email}</p>
                <p className='text-sm text-gray-600'>User ID: {user.id}</p>
                <p className='text-sm text-gray-600'>
                  Email Verified: {user.email_confirmed_at ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <XCircle className='h-5 w-5 text-red-500' />
              <p className='font-medium'>
                Not authenticated - please login to run tests
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue='auth' className='w-full'>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger value='auth'>Auth</TabsTrigger>
          <TabsTrigger value='database'>Database</TabsTrigger>
          <TabsTrigger value='notifications'>Notifications</TabsTrigger>
          <TabsTrigger value='payments'>Payments</TabsTrigger>
          <TabsTrigger value='rls'>RLS</TabsTrigger>
          <TabsTrigger value='constraints'>FK</TabsTrigger>
        </TabsList>

        <TabsContent value='auth' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <User className='h-5 w-5' />
                <span>Authentication Flow Tests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Summary results={authTests} />
              <div className='space-y-3'>
                {authTests.map((result, index) => (
                  <TestResultItem key={index} result={result} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='database' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Database className='h-5 w-5' />
                <span>Database CRUD Tests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Summary results={testResults} />
              <div className='space-y-3'>
                {testResults.map((result, index) => (
                  <TestResultItem key={index} result={result} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='notifications' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Bell className='h-5 w-5' />
                <span>Notifications CRUD Tests</span>
                <Button
                  onClick={runNotificationTests}
                  disabled={isRunning}
                  size='sm'
                >
                  Run Tests
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Summary results={notificationTests} />
              <div className='space-y-3'>
                {notificationTests.map((result, index) => (
                  <TestResultItem key={index} result={result} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='payments' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <CreditCard className='h-5 w-5' />
                <span>Payment Transactions CRUD Tests</span>
                <Button
                  onClick={runPaymentTests}
                  disabled={isRunning}
                  size='sm'
                >
                  Run Tests
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Summary results={paymentTests} />
              <div className='space-y-3'>
                {paymentTests.map((result, index) => (
                  <TestResultItem key={index} result={result} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='rls' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Shield className='h-5 w-5' />
                <span>Row Level Security Tests</span>
                <Button onClick={runRLSTests} disabled={isRunning} size='sm'>
                  Run Tests
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Summary results={rlsTests} />
              <div className='space-y-3'>
                {rlsTests.map((result, index) => (
                  <TestResultItem key={index} result={result} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='constraints' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Link className='h-5 w-5' />
                <span>Foreign Key Constraint Tests</span>
                <Button onClick={runFKTests} disabled={isRunning} size='sm'>
                  Run Tests
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Summary results={fkTests} />
              <div className='space-y-3'>
                {fkTests.map((result, index) => (
                  <TestResultItem key={index} result={result} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthTestingDashboard;
