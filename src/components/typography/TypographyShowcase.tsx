import React from 'react';
import { Card } from '@/components/common/Card';

export const TypographyShowcase: React.FC = () => {
  return (
    <div className='container mx-auto p-6 space-y-8'>
      <div className='text-center space-y-4'>
        <h1 className='brand-logo'>SABO ARENA</h1>
        <p className='description'>
          Hệ thống typography mới với 4 font chủ đạo cho SABO ARENA
        </p>
      </div>

      {/* Brand Typography - Bebas Neue */}
      <Card className='p-6'>
        <h2 className='heading-primary mb-4'>
          1. Brand Typography - Bebas Neue
        </h2>
        <div className='space-y-4'>
          <div>
            <h3 className='brand-logo'>SABO ARENA</h3>
            <p className='body-small text-muted-foreground'>
              Class: brand-logo
            </p>
          </div>
          <div>
            <h3 className='brand-title'>Giải Đấu Thế Giới</h3>
            <p className='body-small text-muted-foreground'>
              Class: brand-title
            </p>
          </div>
          <div>
            <h3 className='tournament-name'>Tournament Premier League</h3>
            <p className='body-small text-muted-foreground'>
              Class: tournament-name
            </p>
          </div>
        </div>
      </Card>

      {/* Heading Typography - Epilogue */}
      <Card className='p-6'>
        <h2 className='heading-primary mb-4'>
          2. Heading Typography - Epilogue
        </h2>
        <div className='space-y-4'>
          <div>
            <h3 className='heading-primary'>Heading Primary</h3>
            <p className='body-small text-muted-foreground'>
              Class: heading-primary
            </p>
          </div>
          <div>
            <h4 className='heading-secondary'>Heading Secondary</h4>
            <p className='body-small text-muted-foreground'>
              Class: heading-secondary
            </p>
          </div>
          <div>
            <h5 className='heading-tertiary'>Heading Tertiary</h5>
            <p className='body-small text-muted-foreground'>
              Class: heading-tertiary
            </p>
          </div>
          <div>
            <h6 className='section-title'>Section Title</h6>
            <p className='body-small text-muted-foreground'>
              Class: section-title
            </p>
          </div>
          <div>
            <h6 className='card-title'>Card Title</h6>
            <p className='body-small text-muted-foreground'>
              Class: card-title
            </p>
          </div>
        </div>
      </Card>

      {/* Body Typography - Outfit */}
      <Card className='p-6'>
        <h2 className='heading-primary mb-4'>3. Body Typography - Outfit</h2>
        <div className='space-y-4'>
          <div>
            <p className='body-large'>
              Body Large - Lorem ipsum dolor sit amet, consectetur adipiscing
              elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
              aliqua.
            </p>
            <p className='body-small text-muted-foreground'>
              Class: body-large
            </p>
          </div>
          <div>
            <p className='body-medium'>
              Body Medium - Lorem ipsum dolor sit amet, consectetur adipiscing
              elit.
            </p>
            <p className='body-small text-muted-foreground'>
              Class: body-medium
            </p>
          </div>
          <div>
            <p className='body-small'>
              Body Small - Lorem ipsum dolor sit amet.
            </p>
            <p className='body-small text-muted-foreground'>
              Class: body-small
            </p>
          </div>
          <div>
            <p className='description'>
              Description - This is a descriptive text with muted color.
            </p>
            <p className='body-small text-muted-foreground'>
              Class: description
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Typography - Racing Sans One */}
      <Card className='p-6'>
        <h2 className='heading-primary mb-4'>
          4. Stats Typography - Racing Sans One
        </h2>
        <div className='space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='text-center p-4 bg-muted rounded-lg'>
            <div className='stats-large text-primary'>2450</div>
            <p className='body-small text-muted-foreground'>
              ELO Score (stats-large)
            </p>
          </div>
          <div className='text-center p-4 bg-muted rounded-lg'>
            <div className='stats-medium text-green-600'>87.5%</div>
            <p className='body-small text-muted-foreground'>
              Win Rate (stats-medium)
            </p>
          </div>
          <div className='text-center p-4 bg-muted rounded-lg'>
            <div className='elo-score text-blue-600'>1875</div>
            <p className='body-small text-muted-foreground'>
              Current ELO (elo-score)
            </p>
          </div>
          <div className='text-center p-4 bg-muted rounded-lg'>
            <div className='match-score text-orange-600'>15-7</div>
            <p className='body-small text-muted-foreground'>
              Match Score (match-score)
            </p>
          </div>
        </div>
      </Card>

      {/* Interactive Typography */}
      <Card className='p-6'>
        <h2 className='heading-primary mb-4'>5. Interactive Typography</h2>
        <div className='space-y-4'>
          <div className='flex flex-wrap gap-4'>
            <button className='button-text bg-primary text-primary-foreground px-4 py-2 rounded'>
              Button Text
            </button>
            <a href='#' className='link-text text-primary underline'>
              Link Text
            </a>
            <span className='nav-text'>Navigation Text</span>
          </div>
          <div className='space-y-2'>
            <div className='username'>@player_username</div>
            <div className='timestamp'>2 phút trước</div>
            <div className='badge-text bg-primary text-primary-foreground px-2 py-1 rounded'>
              Badge Text
            </div>
            <div className='label-text'>Label Text</div>
          </div>
        </div>
      </Card>

      {/* Responsive Typography */}
      <Card className='p-6'>
        <h2 className='heading-primary mb-4'>6. Responsive Typography</h2>
        <div className='space-y-4'>
          <div>
            <p className='text-responsive-xl'>Responsive XL Text</p>
            <p className='body-small text-muted-foreground'>
              Class: text-responsive-xl
            </p>
          </div>
          <div>
            <p className='text-responsive-lg'>Responsive Large Text</p>
            <p className='body-small text-muted-foreground'>
              Class: text-responsive-lg
            </p>
          </div>
          <div>
            <p className='text-responsive-md'>Responsive Medium Text</p>
            <p className='body-small text-muted-foreground'>
              Class: text-responsive-md
            </p>
          </div>
          <div>
            <p className='text-responsive-sm'>Responsive Small Text</p>
            <p className='body-small text-muted-foreground'>
              Class: text-responsive-sm
            </p>
          </div>
          <div>
            <p className='text-responsive-xs'>Responsive XS Text</p>
            <p className='body-small text-muted-foreground'>
              Class: text-responsive-xs
            </p>
          </div>
        </div>
      </Card>

      {/* Usage Examples */}
      <Card className='p-6'>
        <h2 className='heading-primary mb-4'>7. Ví dụ sử dụng thực tế</h2>

        {/* Tournament Card Example */}
        <div className='bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6'>
          <h3 className='tournament-name text-primary mb-2'>
            GIẢI ĐẤU MÙA XUÂN 2024
          </h3>
          <h4 className='section-title mb-3'>Thông tin giải đấu</h4>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
            <div className='text-center'>
              <div className='stats-medium text-green-600'>32</div>
              <p className='body-small text-muted-foreground'>Người chơi</p>
            </div>
            <div className='text-center'>
              <div className='stats-medium text-blue-600'>₫500K</div>
              <p className='body-small text-muted-foreground'>Giải thưởng</p>
            </div>
            <div className='text-center'>
              <div className='stats-medium text-orange-600'>3</div>
              <p className='body-small text-muted-foreground'>Ngày</p>
            </div>
          </div>
          <p className='description mb-4'>
            Giải đấu bi-a 8 bi lớn nhất trong năm với sự tham gia của các tay cơ
            hàng đầu tại SABO ARENA. Cơ hội để thể hiện kỹ năng và giành được
            giải thưởng hấp dẫn.
          </p>
          <div className='flex gap-3'>
            <button className='button-text bg-primary text-primary-foreground px-6 py-2 rounded-lg'>
              Đăng ký tham gia
            </button>
            <button className='button-text border border-primary text-primary px-6 py-2 rounded-lg'>
              Xem chi tiết
            </button>
          </div>
        </div>

        {/* Player Stats Example */}
        <div className='bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg'>
          <div className='flex items-center gap-4 mb-4'>
            <div className='w-16 h-16 bg-gray-300 rounded-full'></div>
            <div>
              <h3 className='username text-lg'>Nguyễn Văn An</h3>
              <div className='badge-text bg-green-100 text-green-800 px-2 py-1 rounded'>
                PRO PLAYER
              </div>
            </div>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='elo-score text-blue-600'>2450</div>
              <p className='body-small text-muted-foreground'>ELO</p>
            </div>
            <div className='text-center'>
              <div className='win-rate text-green-600'>87.5%</div>
              <p className='body-small text-muted-foreground'>Tỷ lệ thắng</p>
            </div>
            <div className='text-center'>
              <div className='stats-small text-orange-600'>156</div>
              <p className='body-small text-muted-foreground'>Trận thắng</p>
            </div>
            <div className='text-center'>
              <div className='stats-small text-red-600'>23</div>
              <p className='body-small text-muted-foreground'>Trận thua</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TypographyShowcase;
