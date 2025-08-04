# CLONE.md - Building a Stock Portfolio Management Site

This document provides comprehensive instructions for cloning the Valley Signs architecture to build a stock portfolio management application with the same look, feel, and navigation patterns.

## Architecture Overview

The Valley Signs codebase uses a modern, scalable architecture that's perfect for financial applications. The same patterns can be adapted for portfolio management with multi-portfolio support, role-based access, and professional financial UI.

## Technology Stack

### Core Framework
- **Next.js 15.3.3** with Pages Router (not App Router)
- **TypeScript** with loose typing settings (`strict: false`)
- **React 18** with Context API for state management

### Database & Authentication
- **Supabase** for PostgreSQL database and authentication
- **Row-Level Security (RLS)** for data isolation between portfolios
- **Multi-tenant architecture** (portfolios instead of branches)

### UI & Styling
- **TailwindCSS** with custom brand colors and dark mode
- **Shadcn/ui** components for consistent, accessible UI
- **Radix UI** primitives for complex components
- **Lucide React** for professional icons
- **TanStack React Table** for data grids (perfect for stock tables)

### Development Tools
- **ESLint** for code quality
- **Custom port 4008** (avoiding conflicts with other financial tools)

## Key Features to Replicate

### 1. Navigation Header Component
**Adaptation for Portfolio Site:**
- Replace "Valley Signs" branding with portfolio management branding
- Adapt navigation menu structure:
  - Dashboard → Portfolio Overview
  - Job Tracker → Holdings/Positions
  - Estimator → Portfolio Analysis
  - Admin → Portfolio Management
- Keep the same responsive design patterns
- Maintain role-based menu visibility
- Include portfolio selector (instead of branch selector)

### 2. Multi-Portfolio Architecture
**Database Schema Adaptation:**
```sql
-- Replace 'branches' with 'portfolios'
portfolios (id, name, description, created_at)

-- Replace 'user_branch_roles' with 'user_portfolio_roles'  
user_portfolio_roles (user_id, portfolio_id, role)

-- Portfolio-specific tables
holdings (id, portfolio_id, symbol, shares, cost_basis, purchase_date)
transactions (id, portfolio_id, symbol, type, shares, price, date)
watchlists (id, portfolio_id, symbol, added_date)
```

### 3. Authentication & Role System
**Role Hierarchy for Portfolio Management:**
- **admin**: Full access, can create/manage portfolios
- **manager**: Manage specific portfolios, view analytics
- **trader**: Execute trades, update holdings
- **viewer**: Read-only access to assigned portfolios

**Keep the same authentication patterns:**
- Supabase Auth with email/password
- Extended profiles table
- Session management via AuthContext
- Protected routes with ProtectedRoute component

### 4. Theme & Dark Mode
**Financial-Focused Color Scheme:**
```javascript
// tailwind.config.js - Replace valley-blue with financial colors
colors: {
  'finance-blue': {
    50: '#eff8ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary brand color
    600: '#2563eb',
    700: '#1d4ed8', // Dark mode button color
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  'profit-green': {
    // Green shades for gains
    500: '#10b981',
    600: '#059669',
    700: '#047857'
  },
  'loss-red': {
    // Red shades for losses  
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  }
}
```

### 5. Dashboard Layout Patterns
**Adapt Valley Signs Dashboard for Portfolio Overview:**
- Replace job statistics with portfolio metrics
- Quick action cards for common portfolio tasks
- Recent activity feed (trades, updates)
- Performance charts and key metrics
- Holdings summary table

## Project Setup Instructions

### 1. Initialize Next.js Project
```bash
npx create-next-app@15.3.3 portfolio-manager
cd portfolio-manager

# Install dependencies matching Valley Signs
npm install @supabase/supabase-js
npm install @tanstack/react-table
npm install @radix-ui/react-navigation-menu
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-dialog
npm install lucide-react
npm install tailwindcss
npm install class-variance-authority
npm install clsx tailwind-merge
```

### 2. Configure Development Server
```json
// package.json - scripts section
{
  "scripts": {
    "dev": "next dev -p 4008",
    "build": "next build",
    "start": "next start -p 4008",
    "lint": "next lint"
  }
}
```

### 3. Setup Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Add your financial brand colors here
        'finance-blue': { /* color palette */ },
        // Include Shadcn color variables
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        // ... rest of Shadcn variables
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}
```

### 4. Setup Supabase
```bash
# Create Supabase project at supabase.com
# Create .env.local file:
These are already in the existing .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 5. Database Schema Setup
```sql
-- Create portfolio management schema
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  default_portfolio_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_portfolio_roles (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'trader', 'viewer')),
  PRIMARY KEY (user_id, portfolio_id)
);

-- Add your portfolio-specific tables (holdings, transactions, etc.)
```

## Component Structure to Replicate

### 1. Core Context Providers
Copy and adapt these essential contexts:
- `contexts/AuthContext.js` → Handle authentication and user state
- `contexts/ThemeContext.js` → Dark/light mode management

### 2. Layout Components
- `components/Layout.js` → Main navigation and layout wrapper
- `components/ProtectedRoute.js` → Authentication gates for pages
- `components/ui/` → Shadcn UI components directory

### 3. Page Structure
```
pages/
├── index.js          → Dashboard/Portfolio Overview
├── holdings/         → Holdings management (replaces job-tracker)
├── analysis/         → Portfolio analysis (replaces estimator)
├── admin/           → Portfolio administration
└── api/             → API routes for portfolio operations
```

## Styling Patterns to Follow

### 1. Component Styling
- Use the same card-based layout patterns
- Maintain consistent spacing and typography
- Copy button styles and variants
- Replicate form styling patterns

### 2. Dark Mode Implementation
- Keep the same ThemeContext structure
- Use identical dark mode class toggle approach
- Maintain CSS variable naming conventions
- Copy transition and animation patterns

### 3. Responsive Design
- Follow the same mobile-first approach
- Use identical breakpoint patterns
- Copy navigation responsive behavior
- Maintain the same layout constraints

## Key Files to Study and Adapt

### Essential Files to Reference:
1. `components/Layout.js` - Navigation and layout patterns
2. `contexts/AuthContext.js` - Authentication flow
3. `contexts/ThemeContext.js` - Theme management
4. `tailwind.config.js` - Color system and design tokens
5. `pages/dashboard.js` - Dashboard layout patterns
6. `components/ui/` - UI component library
7. `utils/supabase.js` - Database client setup

### Configuration Files:
- `package.json` - Dependencies and scripts
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript settings
- `components.json` - Shadcn configuration
- `styles/globals.css` - Global styles and CSS variables

## Business Logic Adaptation

### Valley Signs → Portfolio Management Mapping:
- **Jobs** → **Holdings/Positions**
- **Estimates** → **Portfolio Analysis**
- **Branches** → **Portfolios**
- **Job Assignments** → **Portfolio Access**
- **Job Updates** → **Transaction History**
- **User Roles** → **Portfolio Permissions**

### API Route Patterns:
- Copy the same error handling patterns
- Use identical authentication checks
- Follow the same response formatting
- Maintain consistent logging approaches

## Advanced Features to Consider

### 1. Real-time Data Integration
- Replace TSheets integration with stock market APIs
- Consider WebSocket connections for live prices
- Implement real-time portfolio updates

### 2. Financial-Specific Components
- Stock price displays with gain/loss colors
- Portfolio performance charts
- Transaction tables with TanStack Table
- Watchlist management
- Performance analytics dashboards

### 3. Security Considerations
- Follow the same RLS patterns for portfolio isolation
- Implement proper API key management
- Use the same authentication flow
- Maintain audit trails for all transactions

## Development Workflow

1. **Setup Phase**: Initialize project with identical tech stack
2. **Core Architecture**: Implement authentication and theme contexts
3. **Layout Phase**: Copy and adapt Layout component
4. **Navigation**: Build portfolio-focused navigation structure
5. **Database**: Setup portfolio schema with RLS policies
6. **Pages**: Create main portfolio management pages
7. **Components**: Build financial-specific UI components
8. **Integration**: Add stock market data APIs
9. **Testing**: Implement same testing patterns if needed

## Final Notes

The Valley Signs architecture is exceptionally well-suited for financial applications due to its:
- **Multi-tenant design** (perfect for multi-portfolio support)
- **Role-based access control** (essential for financial data)
- **Professional UI patterns** (appropriate for finance)
- **Robust authentication** (critical for financial security)
- **Scalable component architecture** (supports complex financial features)

By following these instructions and studying the referenced files, you can create a professional stock portfolio management application that maintains the same high-quality user experience and architectural patterns as the Valley Signs system.