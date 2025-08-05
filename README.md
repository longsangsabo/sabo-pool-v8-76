# 🎱 SABO Pool Arena Hub

A comprehensive pool arena management system with VNPAY payment integration, built with React, TypeScript, and modern web technologies.

## 🚀 Features

- **🏆 Tournament Management** - Create and manage pool tournaments
- **💰 Payment Integration** - VNPAY payment gateway integration
- **📊 ELO Ranking System** - Advanced player ranking algorithm
- **👥 User Management** - Complete user profiles and authentication
- **📱 PWA Support** - Progressive Web App capabilities
- **🎨 Modern UI/UX** - Beautiful, responsive design with Tailwind CSS
- **🔔 Real-time Notifications** - Live updates and notifications
- **📈 Analytics Dashboard** - Comprehensive statistics and insights

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Radix UI
- **State Management:** React Query, React Hook Form
- **Backend:** Supabase, Express.js
- **Payment:** VNPAY Integration
- **Deployment:** Loveable, Vercel
- **Code Quality:** ESLint, Prettier, Husky

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm 8+
- Git

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/sabo-pool-arena-hub.git
cd sabo-pool-arena-hub

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## 🔧 Development

### Available Scripts
```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
npm run type-check      # Run TypeScript type checking

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode

# Database
npm run db:push         # Push database changes
npm run db:reset        # Reset database
```

### Code Quality Tools
- **ESLint** - Code linting with TypeScript support
- **Prettier** - Code formatting
- **Husky** - Git hooks for pre-commit checks
- **lint-staged** - Run linters on staged files

### Pre-commit Hooks
The project uses Husky to run automatic checks before commits:
- ESLint fixes
- Prettier formatting
- Type checking

## 🌐 Deployment

### Loveable Deployment
1. Push code to GitHub
2. Connect repository to Loveable
3. Configure environment variables
4. Deploy

### Environment Variables
```env
# VNPAY Configuration
VNP_TMN_CODE=your_terminal_id
VNP_HASH_SECRET=your_secret_key
VNP_RETURN_URL=your_return_url
VNP_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server Configuration
NODE_ENV=production
PORT=3000
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── auth/           # Authentication components
│   ├── tournament/     # Tournament components
│   └── ...
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── integrations/       # External service integrations
└── main.tsx           # Application entry point
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run code quality checks (`npm run lint && npm run format`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📋 CI/CD Pipeline

The project uses GitHub Actions for continuous integration:

### Automated Checks
- **Linting** - ESLint with TypeScript support
- **Formatting** - Prettier code formatting
- **Type Checking** - TypeScript compilation
- **Testing** - Unit and integration tests
- **Build** - Production build verification
- **Security** - Dependency vulnerability scanning

### Deployment
- **Preview** - Automatic deployment for pull requests
- **Production** - Automatic deployment for main branch

## 🔒 Security

- Input validation and sanitization
- CORS configuration
- Rate limiting
- Security headers
- Dependency vulnerability scanning
- Regular security updates via Dependabot

## 📊 Performance

- Code splitting and lazy loading
- Image optimization
- Bundle size optimization
- Caching strategies
- PWA capabilities for offline support

## 🐛 Bug Reports

Please use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when reporting issues.

## 💡 Feature Requests

Please use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) when suggesting new features.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Lead Developer** - [Your Name](https://github.com/yourusername)
- **UI/UX Designer** - [Designer Name](https://github.com/designerusername)
- **Backend Developer** - [Backend Dev](https://github.com/backendusername)

## 🙏 Acknowledgments

- VNPAY for payment integration
- Supabase for backend services
- Tailwind CSS for styling
- Radix UI for accessible components

---

**Made with ❤️ by the SABO Pool Arena Team**
