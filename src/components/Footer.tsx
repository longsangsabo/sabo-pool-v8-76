import { Link } from 'react-router-dom';
import {
  Circle,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Youtube,
  MessageCircle,
} from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { name: 'Giải Đấu', href: '/tournaments' },
    { name: 'Bảng Xếp Hạng', href: '/leaderboard' },
    { name: 'CLB', href: '/clubs' },
    { name: 'Thách Đấu', href: '/challenges' },
    { name: 'Marketplace', href: '/marketplace' },
    { name: 'Về Chúng Tôi', href: '/about' },
    { name: 'Trợ Giúp', href: '/help' },
  ];

  const accountLinks = [
    { name: 'Đăng Nhập', href: '/login' },
    { name: 'Đăng Ký', href: '/register' },
    { name: 'Hồ Sơ', href: '/profile' },
    { name: 'Gói Hội Viên', href: '/membership' },
    { name: 'Ví Của Tôi', href: '/wallet' },
    { name: 'Cài Đặt', href: '/settings' },
  ];

  const legalLinks = [
    { name: 'Điều Khoản', href: '/terms' },
    { name: 'Chính Sách', href: '/privacy' },
    { name: 'FAQ', href: '/help' },
  ];

  return (
    <footer className='bg-gradient-to-b from-slate-900 to-black border-t border-yellow-400/20'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
          {/* Logo and Description */}
          <div className='md:col-span-1'>
            <Link to='/' className='flex items-center space-x-3 mb-6'>
              <div className='w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg'>
                <Circle className='w-7 h-7 text-black font-bold' />
              </div>
              <div className='flex flex-col'>
                <span className='text-2xl font-black text-white gold-glow'>
                  SABO
                </span>
                <span className='text-sm text-yellow-400 font-bold -mt-1'>
                  ARENA
                </span>
              </div>
            </Link>
            <p className='text-gray-300 leading-relaxed mb-6 max-w-md'>
              Nền tảng thi đấu bida chuyên nghiệp hàng đầu Việt Nam với hệ thống
              ranking ELO, giải đấu hàng tuần và cộng đồng game thủ đam mê.
            </p>

            {/* Social Links */}
            <div className='flex space-x-4'>
              <a
                href='#'
                className='w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center hover:scale-110 transition-transform'
                aria-label='Facebook'
              >
                <Facebook className='w-5 h-5 text-white' />
              </a>
              <a
                href='#'
                className='w-10 h-10 bg-gradient-to-r from-red-600 to-red-800 rounded-lg flex items-center justify-center hover:scale-110 transition-transform'
                aria-label='Youtube'
              >
                <Youtube className='w-5 h-5 text-white' />
              </a>
              <a
                href='#'
                className='w-10 h-10 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center hover:scale-110 transition-transform'
                aria-label='Chat'
              >
                <MessageCircle className='w-5 h-5 text-white' />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className='text-lg font-bold text-white mb-6 gold-glow'>
              Tính Năng
            </h3>
            <ul className='space-y-3'>
              {quickLinks.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.href}
                    className='text-gray-300 hover:text-yellow-400 transition-colors duration-300'
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className='text-lg font-bold text-white mb-6 gold-glow'>
              Tài Khoản
            </h3>
            <ul className='space-y-3'>
              {accountLinks.map((item, index) => (
                <li key={index}>
                  <Link
                    to={item.href}
                    className='text-gray-300 hover:text-yellow-400 transition-colors duration-300'
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className='text-lg font-bold text-white mb-6 gold-glow'>
              Liên Hệ
            </h3>
            <ul className='space-y-4'>
              <li className='flex items-center space-x-3'>
                <Mail className='w-5 h-5 text-yellow-400' />
                <a
                  href='mailto:info@saboarena.vn'
                  className='text-gray-300 hover:text-yellow-400 transition-colors'
                >
                  info@saboarena.vn
                </a>
              </li>
              <li className='flex items-center space-x-3'>
                <Phone className='w-5 h-5 text-yellow-400' />
                <a
                  href='tel:1900xxxx'
                  className='text-gray-300 hover:text-yellow-400 transition-colors'
                >
                  1900 xxxx
                </a>
              </li>
              <li className='flex items-start space-x-3'>
                <MapPin className='w-5 h-5 text-yellow-400 mt-1' />
                <span className='text-gray-300'>
                  123 Đường ABC, Quận 1<br />
                  TP. Hồ Chí Minh, Việt Nam
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Border */}
        <div className='border-t border-gray-700 mt-12 pt-8'>
          <div className='flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0'>
            <p className='text-gray-400 text-sm'>
              © 2024 SABO ARENA. Tất cả quyền được bảo lưu.
            </p>
            <div className='flex space-x-6 text-sm'>
              {legalLinks.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  className='text-gray-400 hover:text-yellow-400 transition-colors'
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
