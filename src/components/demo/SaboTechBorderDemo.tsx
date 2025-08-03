import React from 'react';
import {
  SaboTechBorder,
  SaboTechButton,
  SaboTechCard,
  SaboTechInput,
  SaboTechAvatar,
} from '@/components/ui/sabo-tech-border';
import { Badge } from '@/components/ui/badge';

/**
 * Demo component showcasing the SABO Tech Border System
 */
export const SaboTechBorderDemo: React.FC = () => {
  return (
    <div className='p-8 space-y-8 bg-background min-h-screen'>
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold text-foreground mb-4'>
          SABO TECH BORDER SYSTEM
        </h1>
        <p className='text-muted-foreground text-lg'>
          Advanced tech-style borders with dynamic animations and effects
        </p>
      </div>

      {/* Border Variants */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-foreground'>
          Border Variants
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <SaboTechBorder variant='primary' interactive>
            <div className='p-6 text-center'>
              <h3 className='font-bold text-lg mb-2'>Primary Border</h3>
              <p className='text-sm text-muted-foreground'>
                Golden tech border with animated pulse
              </p>
            </div>
          </SaboTechBorder>

          <SaboTechBorder variant='secondary' interactive>
            <div className='p-6 text-center'>
              <h3 className='font-bold text-lg mb-2'>Secondary Border</h3>
              <p className='text-sm text-muted-foreground'>
                Blue tech border with moving lines
              </p>
            </div>
          </SaboTechBorder>

          <SaboTechBorder variant='success' interactive>
            <div className='p-6 text-center'>
              <h3 className='font-bold text-lg mb-2'>Success Border</h3>
              <p className='text-sm text-muted-foreground'>
                Green tech border for victories
              </p>
            </div>
          </SaboTechBorder>

          <SaboTechBorder variant='warning' interactive>
            <div className='p-6 text-center'>
              <h3 className='font-bold text-lg mb-2'>Warning Border</h3>
              <p className='text-sm text-muted-foreground'>
                Red tech border with alert pulse
              </p>
            </div>
          </SaboTechBorder>

          <SaboTechBorder variant='premium' interactive>
            <div className='p-6 text-center'>
              <h3 className='font-bold text-lg mb-2'>Premium Border</h3>
              <p className='text-sm text-muted-foreground'>
                Purple premium border with conic rotation
              </p>
            </div>
          </SaboTechBorder>
        </div>
      </section>

      {/* Rank-based Borders */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-foreground'>
          Rank-based Borders
        </h2>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
          {(['K', 'I', 'H', 'G', 'F', 'E'] as const).map(rank => (
            <SaboTechBorder
              key={rank}
              variant='rank'
              rankLevel={rank}
              interactive
            >
              <div className='p-4 text-center'>
                <div className='text-2xl font-bold mb-2'>{rank}</div>
                <div className='text-xs text-muted-foreground'>Rank {rank}</div>
              </div>
            </SaboTechBorder>
          ))}
        </div>
      </section>

      {/* Pre-configured Components */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-foreground'>
          Pre-configured Components
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Buttons */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>SABO Tech Buttons</h3>
            <div className='space-y-3'>
              <SaboTechButton>Primary Action</SaboTechButton>
              <SaboTechButton className='w-full'>
                Full Width Button
              </SaboTechButton>
            </div>
          </div>

          {/* Cards */}
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>SABO Tech Cards</h3>
            <SaboTechCard>
              <h4 className='font-bold mb-2'>Standard Tech Card</h4>
              <p className='text-sm text-muted-foreground'>
                This is a standard tech card with secondary border styling.
              </p>
            </SaboTechCard>
            <SaboTechCard premium>
              <h4 className='font-bold mb-2'>Premium Tech Card</h4>
              <p className='text-sm text-muted-foreground'>
                This is a premium tech card with enhanced styling and effects.
              </p>
            </SaboTechCard>
          </div>
        </div>

        {/* Inputs and Avatars */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>SABO Tech Inputs</h3>
            <SaboTechInput placeholder='Enter your username...' />
            <SaboTechInput placeholder='Enter your email...' type='email' />
          </div>

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>SABO Tech Avatars</h3>
            <div className='flex gap-4 items-center'>
              <SaboTechAvatar
                src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                alt='Standard Avatar'
              />
              <SaboTechAvatar
                src='https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
                alt='Rank Avatar'
                rank
              />
            </div>
          </div>
        </div>
      </section>

      {/* Integration Example */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-foreground'>
          Integration Example
        </h2>
        <SaboTechCard premium className='max-w-md mx-auto'>
          <div className='text-center space-y-4'>
            <SaboTechAvatar
              src='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
              alt='Player Avatar'
              rank
              className='w-24 h-24 mx-auto'
            />
            <div>
              <h3 className='text-xl font-bold'>SABO Champion</h3>
              <Badge className='sabo-tech-border-rank-e'>Rank E+</Badge>
            </div>
            <div className='grid grid-cols-3 gap-4 text-center'>
              <div className='sabo-tech-border-secondary p-3'>
                <div className='text-lg font-bold'>1250</div>
                <div className='text-xs text-muted-foreground'>SPA Points</div>
              </div>
              <div className='sabo-tech-border-success p-3'>
                <div className='text-lg font-bold'>89</div>
                <div className='text-xs text-muted-foreground'>Wins</div>
              </div>
              <div className='sabo-tech-border-primary p-3'>
                <div className='text-lg font-bold'>92%</div>
                <div className='text-xs text-muted-foreground'>Win Rate</div>
              </div>
            </div>
            <SaboTechButton className='w-full'>Challenge Player</SaboTechButton>
          </div>
        </SaboTechCard>
      </section>
    </div>
  );
};
