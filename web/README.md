# 🏃‍♂️ Run Houston Web Frontend

A modern, responsive web application for the Run Houston race discovery platform. Built with React, TypeScript, and Vite.

## 🎯 Features

- **Marketing Website**: Public-facing site promoting the Run Houston mobile app
- **Admin Dashboard**: Race management interface for administrators
- **Responsive Design**: Optimized for all devices and screen sizes
- **Modern UI**: Clean, professional design with smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running (see main project README)

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── App.tsx             # Main application component
├── App.css             # Global styles
└── main.tsx            # Application entry point
```

## 🎨 Design System

- **Colors**: Consistent with mobile app (iOS Blue #007AFF)
- **Typography**: System fonts for optimal performance
- **Spacing**: 8px grid system for consistent layouts
- **Shadows**: Subtle elevation for depth and hierarchy

## 🔗 API Integration

The web frontend connects to the Run Houston backend API:
- **Base URL**: `http://localhost:8000` (development)
- **Endpoints**: Races, admin authentication, race management

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

### Code Style
- TypeScript for type safety
- Functional components with hooks
- CSS modules or styled-components for styling
- ESLint for code consistency

## 🚀 Deployment

The web frontend is designed to be deployed to:
- **Render**: Static site hosting
- **Vercel**: Zero-config deployment
- **Netlify**: Git-based deployment
- **AWS S3**: Static website hosting

## 📄 License

Part of the Run Houston project. See main project README for details.

---

**Built with ❤️ for the Houston running community**
