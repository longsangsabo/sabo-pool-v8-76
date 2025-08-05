import React from 'react';
import { MainLayout } from '@/components/MainLayout';

/**
 * FinancialHub - User financial management hub
 * Handles wallet, transactions, earnings, and payment history
 */
const FinancialHub: React.FC = () => {
  return (
    <MainLayout>
      <div className='container mx-auto px-4 py-6'>
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                Financial Hub
              </h1>
              <p className='text-muted-foreground'>
                Manage your wallet, transactions, and earnings
              </p>
            </div>
          </div>

          {/* Wallet Overview */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-lg border bg-card p-6'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Current Balance
                </p>
              </div>
              <div className='text-2xl font-bold'>$0.00</div>
              <p className='text-xs text-muted-foreground'>
                Available for withdrawal
              </p>
            </div>

            <div className='rounded-lg border bg-card p-6'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Earnings
                </p>
              </div>
              <div className='text-2xl font-bold'>$0.00</div>
              <p className='text-xs text-muted-foreground'>Lifetime earnings</p>
            </div>

            <div className='rounded-lg border bg-card p-6'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Pending
                </p>
              </div>
              <div className='text-2xl font-bold'>$0.00</div>
              <p className='text-xs text-muted-foreground'>
                Awaiting confirmation
              </p>
            </div>

            <div className='rounded-lg border bg-card p-6'>
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Withdrawn
                </p>
              </div>
              <div className='text-2xl font-bold'>$0.00</div>
              <p className='text-xs text-muted-foreground'>Total withdrawn</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='rounded-lg border bg-card p-6'>
            <h2 className='text-lg font-semibold mb-4'>Quick Actions</h2>
            <div className='grid gap-4 md:grid-cols-3'>
              <button className='flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent'>
                <span className='font-medium'>Add Funds</span>
                <span className='text-sm text-muted-foreground'>
                  Deposit money
                </span>
              </button>
              <button className='flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent'>
                <span className='font-medium'>Withdraw</span>
                <span className='text-sm text-muted-foreground'>
                  Cash out earnings
                </span>
              </button>
              <button className='flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent'>
                <span className='font-medium'>Transaction History</span>
                <span className='text-sm text-muted-foreground'>
                  View all transactions
                </span>
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className='rounded-lg border bg-card'>
            <div className='p-6'>
              <h2 className='text-lg font-semibold mb-4'>
                Recent Transactions
              </h2>
              <div className='text-center py-8 text-muted-foreground'>
                <p>No transactions yet</p>
                <p className='text-sm'>
                  Your transaction history will appear here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FinancialHub;
