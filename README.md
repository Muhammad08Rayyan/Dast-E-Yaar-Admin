# 🏥 Dast-e-Yaar Admin Portal

**CCL Pakistan - Prescription Management System**

A comprehensive Next.js admin portal for managing doctors, prescriptions, orders, and Shopify integration for the Dast-e-Yaar healthcare platform.

---

## 🎯 Project Overview

The Dast-e-Yaar Admin Portal is a web-based management system that enables:
- **Super Admins**: Full system access and management (create/edit/delete all entities)
- **Key Account Managers (KAMs)**: District-scoped read-only access to view doctors and track prescriptions/orders in their assigned districts

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB Atlas (Shared with Node.js backend)
- **Styling**: Tailwind CSS
- **Authentication**: JWT (Single token, no expiry)
- **UI Components**: Custom components with CCL red theme
- **Charts**: Recharts
- **Icons**: Lucide React
- **API Integration**: Shopify Admin API

---

## 🚀 Development Progress

### ✅ **Phase 1: Foundation & Authentication** (COMPLETED)
**Status**: 100% Complete | **Date Completed**: October 7, 2025

#### Completed Tasks:
- [x] **Project Setup**
  - Next.js 15 with App Router and TypeScript
  - Tailwind CSS configuration
  - All dependencies installed and configured
  - Project structure with organized folders

- [x] **MongoDB Integration**
  - Serverless-friendly connection utility
  - Connection pooling configured
  - All 8 data models imported (User, Doctor, District, Patient, Prescription, Order, Product, DistrictProduct)

- [x] **Authentication System**
  - JWT-based authentication
  - Login API route (`/api/auth/login`)
  - User profile API route (`/api/auth/me`)
  - Auth middleware with RBAC (Role-Based Access Control)
  - Token storage in localStorage
  - Protected route system

- [x] **UI Components**
  - Button component with variants
  - Input component with proper styling
  - Card components (Card, CardHeader, CardContent, etc.)
  - CCL red theme colors throughout

- [x] **Login Page**
  - Beautiful gradient background
  - Dast-e-Yaar logo integration
  - Form validation
  - Error handling
  - Demo credentials display
  - Responsive design

- [x] **Dashboard Layout**
  - Sidebar navigation with logo
  - Header with search and user info
  - Role-based navigation (Super Admin vs KAM)
  - Responsive layout
  - Logout functionality

- [x] **Dashboard Page**
  - Statistics cards (Users, Doctors, Prescriptions, Orders)
  - Order status visualization
  - Quick actions section
  - Placeholder for recent activity

- [x] **Testing & Deployment**
  - Authentication flow tested end-to-end
  - Super Admin account created in database
  - All routes accessible

#### Live Credentials:
```
Super Admin:
Email: superadmin@dasteyaar.com
Password: Super@Admin123

KAM (Lahore):
Email: kam.lahore@dasteyaar.com
Password: Kam@Lahore123
```

---

### ✅ **Phase 2: Core Management** (COMPLETED)
**Status**: 100% Complete | **Date Completed**: October 7, 2025

#### Completed Features:

##### 2.1 User Management (Super Admin Only)
- [x] User list page with data table
  - Display all admins and KAMs
  - Sortable columns (Name, Email, Role, Status, Created Date)
  - Search and filter functionality
  - Pagination

- [x] Create user functionality
  - Form with validation
  - Fields: Name, Email, Password, Role, Assigned Districts (for KAMs)
  - Email uniqueness validation
  - Password strength requirements

- [x] Edit user functionality
  - Pre-filled form with existing data
  - Update user details
  - Change password option
  - Update district assignments

- [x] User status management
  - Activate/Deactivate users
  - Confirmation dialogs
  - Status indicators

- [x] API Routes
  - `GET /api/users` - List all users (Super Admin only)
  - `POST /api/users` - Create new user
  - `GET /api/users/:id` - Get user details
  - `PUT /api/users/:id` - Update user
  - `PATCH /api/users/:id/status` - Toggle user status

##### 2.2 District Management
- [x] District list page
  - Display all districts (teams)
  - Show assigned KAM for each district
  - District code and status
  - Search functionality

- [x] Create district functionality
  - Form: District Name, District Code, Assign KAM
  - Code format validation (e.g., LHE-GLB)

- [x] Edit district functionality
  - Update district details
  - Reassign KAMs
  - Update status

- [x] District-KAM assignment
  - Assign/unassign KAMs to districts
  - Visual assignment interface

- [x] API Routes
  - `GET /api/districts` - List all districts
  - `POST /api/districts` - Create district (Super Admin)
  - `GET /api/districts/:id` - Get district details
  - `PUT /api/districts/:id` - Update district (Super Admin)
  - `PATCH /api/districts/:id/status` - Toggle district status

##### 2.3 Doctor Management (Updated Architecture)
- [x] Doctor list page (with role-based access)
  - **Super Admin**: See all doctors + can create/edit/delete
  - **KAM**: See only doctors in assigned districts (READ-ONLY, cannot create/edit/delete)
  - Columns: Name, Email, Phone, PMDC, Specialty, District, Status
  - Advanced filters (Specialty)
  - Search by name, email, PMDC number

- [x] Create doctor functionality (SUPER ADMIN ONLY)
  - Form fields: Name, Email, Phone, Password, PMDC Number, Specialty, District
  - District selection (all active districts)
  - **KAM auto-assigned based on selected district**
  - Form validation
  - KAM cannot create doctors

- [x] Edit doctor functionality (SUPER ADMIN ONLY)
  - Update doctor details
  - Change district (**automatically updates KAM** based on new district)
  - Reset password option
  - Update status
  - KAM cannot edit doctors

- [x] Delete doctor functionality (SUPER ADMIN ONLY)
  - Delete with confirmation dialog
  - KAM cannot delete doctors

- [x] Doctor status management (SUPER ADMIN ONLY)
  - Activate/Deactivate doctors
  - Confirmation dialogs
  - Click to toggle status

- [x] API Routes
  - `GET /api/doctors` - List doctors (with KAM read-only scoping)
  - `POST /api/doctors` - Create doctor (Super Admin only)
  - `GET /api/doctors/:id` - Get doctor details
  - `PUT /api/doctors/:id` - Update doctor (Super Admin only, auto-updates KAM)
  - `DELETE /api/doctors/:id` - Delete doctor (Super Admin only)

##### 2.4 Product Management (Super Admin Only)
- [x] Product list page (all fields displayed in table)
  - Columns: Name, SKU, Description, Price, Status, Shopify Product ID, Shopify Variant ID, Actions
  - Search by name or SKU
  - All product details visible directly in table (no separate detail page needed)
  - Horizontally scrollable for all columns

- [x] Create product functionality
  - Form: Name, SKU, Description, Price, Status
  - Shopify Product ID and Variant ID fields for order integration
  - Form validation (name, SKU, price required)
  - SKU uniqueness validation

- [x] Edit product functionality
  - Update all product details
  - Change price, description, status
  - Update Shopify Product/Variant IDs
  - Pre-filled form with existing data

- [x] Delete product functionality
  - Delete with confirmation dialog
  - Permanent deletion

- [x] API Routes
  - `GET /api/products` - List all products ✅
  - `POST /api/products` - Create product (Super Admin only) ✅
  - `GET /api/products/:id` - Get product details ✅
  - `PUT /api/products/:id` - Update product (Super Admin only) ✅
  - `DELETE /api/products/:id` - Delete product (Super Admin only) ✅
  - `POST /api/products/sync` - Sync from Shopify (exists, not in UI) ⚠️

**Important Architectural Change:**
- ❌ **District-Product Assignment Feature REMOVED**
- ✅ **All active products are now available to ALL doctors** across all districts
- ✅ No district-based product filtering
- ✅ Backend API (`/api/v1/products/team`) returns all active products
- ✅ KAMs have NO access to product management (Super Admin only)
- ⚠️ District-product endpoints marked as deprecated but kept for backward compatibility

---

### 📝 **Phase 3: Prescription & Order Monitoring** (PENDING)
**Status**: 0% Complete | **Target Date**: TBD

#### Planned Features:

##### 3.1 Prescription Monitoring
- [ ] Prescription list page (KAM-scoped)
  - Super Admin: All prescriptions
  - KAM: Only prescriptions from assigned districts
  - Columns: MRN, Patient, Doctor, District, Date, Status
  - Advanced filters (Date range, District, Doctor, Status, Priority)
  - Search by MRN or patient name

- [ ] Prescription details view
  - Patient information
  - Doctor information
  - Prescription text (full content)
  - Uploaded prescription files (view/download)
  - Selected product details
  - Duration, priority, diagnosis, notes
  - Order status and Shopify order link

- [ ] Prescription file viewer
  - Image viewer for prescription photos
  - PDF viewer for prescription documents
  - Download functionality
  - Zoom and pan capabilities

- [ ] Prescription statistics
  - Total prescriptions count
  - Prescriptions by status
  - Prescriptions by priority
  - Top prescribing doctors
  - Most prescribed products

- [ ] API Routes
  - `GET /api/prescriptions` - List prescriptions (with KAM scoping)
  - `GET /api/prescriptions/:id` - Get prescription details
  - `GET /api/prescriptions/doctor/:doctorId` - Get doctor's prescriptions
  - `GET /api/prescriptions/district/:districtId` - Get district's prescriptions
  - `GET /api/prescriptions/stats` - Get prescription statistics

##### 3.2 Order Tracking
- [ ] Order list page (KAM-scoped)
  - Super Admin: All orders
  - KAM: Only orders from assigned districts
  - Columns: Order #, Patient, Doctor, Product, Amount, Status, Date
  - Filters (Status, District, Date range, Financial status)
  - Search by order number or MRN

- [ ] Order details view
  - Complete order information
  - Patient and doctor details
  - Product information
  - Order status timeline
  - Financial status
  - Fulfillment status
  - Tracking number and URL
  - Shopify order link (direct link to Shopify admin)

- [ ] Order status management
  - View real-time status from Shopify
  - Manual sync button
  - Status history log
  - Webhook activity log

- [ ] Order statistics
  - Total orders count
  - Revenue (total amount)
  - Orders by status
  - Fulfillment rate
  - Average order value
  - Top performing districts

- [ ] Shopify integration
  - Fetch order details from Shopify API
  - Display Shopify order number
  - Show fulfillment tracking
  - Sync order updates

- [ ] API Routes
  - `GET /api/orders` - List orders (with KAM scoping)
  - `GET /api/orders/:id` - Get order details
  - `GET /api/orders/status/:status` - Get orders by status
  - `GET /api/orders/district/:districtId` - Get district's orders
  - `GET /api/orders/:id/shopify` - Get Shopify order details
  - `POST /api/orders/:id/sync` - Manual sync with Shopify
  - `GET /api/orders/stats` - Get order statistics

---

### 📊 **Phase 4: Analytics & Reports** (PENDING)
**Status**: 0% Complete | **Target Date**: TBD

#### Planned Features:

##### 4.1 Analytics Dashboard Enhancement
- [ ] Real-time statistics
  - Fetch actual data from database
  - Live updates (real-time or polling)
  - Comparison with previous periods
  - Percentage change indicators

- [ ] Key Performance Indicators (KPIs)
  - Total prescriptions (today, week, month)
  - Total orders (today, week, month)
  - Revenue (today, week, month)
  - Active doctors count
  - Prescription-to-order conversion rate
  - Average fulfillment time

- [ ] Charts and graphs
  - Prescriptions over time (line chart)
  - Orders by status (pie chart)
  - Revenue over time (bar chart)
  - Top performing districts (horizontal bar)
  - Top prescribing doctors (horizontal bar)
  - Product usage distribution

- [ ] District performance comparison
  - Side-by-side district metrics
  - Performance rankings
  - Growth trends

##### 4.2 Advanced Reports
- [ ] Prescription reports
  - Detailed prescription data export (CSV/Excel)
  - Filters: Date range, District, Doctor, Status
  - Custom column selection
  - Summary statistics

- [ ] Order reports
  - Detailed order data export (CSV/Excel)
  - Revenue reports
  - Fulfillment reports
  - Payment status reports

- [ ] Doctor performance reports
  - Prescriptions per doctor
  - Order conversion rate per doctor
  - Average prescription value
  - Activity timeline

- [ ] Product usage reports
  - Most prescribed products
  - Product revenue
  - Product by district
  - Inventory recommendations

- [ ] District reports (KAM-specific)
  - District performance overview
  - Doctor activity in district
  - Prescription and order trends
  - Revenue by district

- [ ] Custom report builder
  - Select data sources
  - Choose metrics
  - Apply filters
  - Schedule reports (email delivery)

- [ ] API Routes
  - `GET /api/analytics/dashboard` - Dashboard statistics
  - `GET /api/analytics/prescriptions` - Prescription analytics
  - `GET /api/analytics/orders` - Order analytics
  - `GET /api/analytics/doctors` - Doctor performance
  - `GET /api/analytics/districts` - District performance
  - `GET /api/analytics/products` - Product usage analytics
  - `GET /api/reports/export/prescriptions` - Export prescriptions CSV
  - `GET /api/reports/export/orders` - Export orders CSV
  - `GET /api/reports/export/doctors` - Export doctor performance CSV

---

### 🔧 **Phase 5: Advanced Features & Polish** (PENDING)
**Status**: 0% Complete | **Target Date**: TBD

#### Planned Features:

##### 5.1 Settings & Configuration
- [ ] General settings page
  - System name and logo
  - Contact information
  - Email configuration
  - Timezone settings

- [ ] User profile management
  - Edit own profile
  - Change password
  - Update contact information
  - Profile picture upload

- [ ] Notification settings
  - Email notification preferences
  - In-app notification settings
  - Webhook notification settings

- [ ] API configuration
  - Shopify API credentials management
  - MongoDB connection settings (read-only display)
  - Third-party integrations

##### 5.2 Notifications System
- [ ] In-app notifications
  - Notification bell icon
  - Notification dropdown
  - Mark as read/unread
  - Notification history

- [ ] Notification types
  - New prescription created
  - Order status updated
  - Doctor status changed
  - System alerts

- [ ] Email notifications
  - Welcome emails
  - Password reset emails
  - Order update emails
  - Weekly/Monthly reports

##### 5.3 Search & Filters
- [ ] Global search
  - Search across all entities
  - Quick results dropdown
  - Advanced search page

- [ ] Advanced filtering
  - Multi-select filters
  - Date range pickers
  - Saved filter presets
  - Filter by multiple criteria

##### 5.4 Activity Logs & Audit Trail
- [ ] Activity log page
  - All system activities
  - User actions log
  - API calls log
  - Filters by user, action, date

- [ ] Audit trail
  - Track all data modifications
  - Who created/updated records
  - Timestamp of changes
  - Before/after values

##### 5.5 Data Management
- [ ] Bulk operations
  - Bulk user import (CSV)
  - Bulk doctor import (CSV)
  - Bulk product import (CSV)
  - Bulk district assignment

- [ ] Data export
  - Export all data to CSV/Excel
  - Database backup utility
  - Data migration tools

##### 5.6 UI/UX Enhancements
- [ ] Loading states
  - Skeleton loaders
  - Progress indicators
  - Optimistic UI updates

- [ ] Empty states
  - Beautiful empty state designs
  - Call-to-action buttons
  - Helpful messages

- [ ] Error handling
  - User-friendly error messages
  - Error boundary components
  - Retry mechanisms

- [ ] Responsive design
  - Mobile-friendly layouts
  - Tablet optimization
  - Touch-friendly controls

- [ ] Dark mode (Optional)
  - Dark theme toggle
  - Persistent preference
  - System preference detection

- [ ] Keyboard shortcuts
  - Quick navigation
  - Accessible shortcuts
  - Shortcut help menu

##### 6.7 Performance Optimization
- [ ] Code splitting
  - Route-based code splitting
  - Component lazy loading
  - Dynamic imports

- [ ] Caching strategies
  - API response caching
  - Browser caching
  - Service worker (PWA)

- [ ] Database optimization
  - Query optimization
  - Index creation
  - Connection pooling tuning

---

### 🧪 **Phase 7: Testing & Quality Assurance** (PENDING)
**Status**: 0% Complete | **Target Date**: TBD

#### Planned Tasks:

##### 7.1 Unit Testing
- [ ] API route tests
  - Test all authentication endpoints
  - Test CRUD operations
  - Test authorization logic
  - Test error handling

- [ ] Component tests
  - Test UI components
  - Test form validation
  - Test user interactions

- [ ] Utility function tests
  - Test helper functions
  - Test formatters
  - Test validators

##### 7.2 Integration Testing
- [ ] End-to-end authentication flow
  - Login → Dashboard → Logout
  - Token refresh
  - Session management

- [ ] CRUD operations testing
  - Create → Read → Update → Delete flows
  - Test all entities

- [ ] Shopify integration testing
  - Order creation
  - Order sync
  - Webhook handling

##### 7.3 Security Testing
- [ ] Authentication security
  - JWT token validation
  - Password hashing verification
  - Session hijacking prevention

- [ ] Authorization testing
  - Role-based access control
  - District scoping for KAMs
  - Permission boundaries

- [ ] Input validation
  - SQL/NoSQL injection prevention
  - XSS protection
  - CSRF protection

##### 7.4 Performance Testing
- [ ] Load testing
  - API response times
  - Database query performance
  - Concurrent user handling

- [ ] Stress testing
  - Maximum load capacity
  - System breaking points
  - Recovery mechanisms

##### 7.5 User Acceptance Testing (UAT)
- [ ] Super Admin testing
  - All administrative functions
  - User management
  - System configuration

- [ ] KAM testing
  - District-scoped access
  - Doctor management
  - Prescription/order monitoring

- [ ] Cross-browser testing
  - Chrome, Firefox, Safari, Edge
  - Mobile browsers

- [ ] Accessibility testing
  - Screen reader compatibility
  - Keyboard navigation
  - ARIA labels

---

### 🚀 **Phase 8: Deployment & Production** (PENDING)
**Status**: 0% Complete | **Target Date**: TBD

#### Planned Tasks:

##### 8.1 Pre-Deployment
- [ ] Environment configuration
  - Production environment variables
  - API keys rotation
  - Database security hardening

- [ ] Build optimization
  - Production build testing
  - Bundle size optimization
  - Image optimization

- [ ] Security hardening
  - HTTPS enforcement
  - Security headers configuration
  - Rate limiting setup

##### 8.2 Deployment to Vercel
- [ ] Vercel project setup
  - Connect GitHub repository
  - Configure environment variables
  - Set up custom domain

- [ ] Deployment pipeline
  - Automatic deployments from main branch
  - Preview deployments for PRs
  - Rollback mechanism

- [ ] Production database
  - MongoDB Atlas production cluster
  - Connection string update
  - Database indexes creation
  - Initial data seeding

##### 8.3 Monitoring & Logging
- [ ] Error tracking
  - Sentry integration (optional)
  - Error alerts
  - Error reporting dashboard

- [ ] Performance monitoring
  - Vercel Analytics
  - API response time monitoring
  - Database query monitoring

- [ ] User analytics
  - Usage statistics
  - User behavior tracking
  - Feature adoption metrics

##### 8.4 Documentation
- [ ] Admin user guide
  - Super Admin handbook
  - KAM user guide
  - Common tasks documentation

- [ ] Technical documentation
  - API documentation
  - Database schema documentation
  - Architecture overview

- [ ] Deployment documentation
  - Deployment checklist
  - Rollback procedures
  - Troubleshooting guide

##### 8.5 Training & Handoff
- [ ] User training sessions
  - Super Admin training
  - KAM training
  - Video tutorials

- [ ] Knowledge transfer
  - Codebase walkthrough
  - Maintenance guide
  - Support procedures

---

## 📁 Project Structure

```
admin/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login)
│   │   ├── login/
│   │   │   └── page.tsx         # Login page ✅
│   │   └── layout.tsx           # Auth layout ✅
│   │
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Main dashboard ✅
│   │   ├── users/               # User management (Phase 2)
│   │   ├── districts/           # District management (Phase 2)
│   │   ├── doctors/             # Doctor management (Phase 2)
│   │   ├── products/            # Product management (Phase 3)
│   │   ├── prescriptions/       # Prescription monitoring (Phase 4)
│   │   ├── orders/              # Order tracking (Phase 4)
│   │   ├── reports/             # Analytics & reports (Phase 5)
│   │   ├── settings/            # Settings (Phase 6)
│   │   └── layout.tsx           # Dashboard layout ✅
│   │
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   ├── login/route.ts   # Login endpoint ✅
│   │   │   └── me/route.ts      # Get current user ✅
│   │   ├── users/               # User CRUD (Phase 2)
│   │   ├── districts/           # District CRUD (Phase 2)
│   │   ├── doctors/             # Doctor CRUD (Phase 2)
│   │   ├── products/            # Product CRUD (Phase 3)
│   │   ├── prescriptions/       # Prescription monitoring (Phase 4)
│   │   ├── orders/              # Order tracking (Phase 4)
│   │   └── analytics/           # Analytics endpoints (Phase 5)
│   │
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Root page (redirect) ✅
│
├── components/                   # Reusable components
│   ├── layout/
│   │   ├── sidebar.tsx          # Sidebar navigation ✅
│   │   └── header.tsx           # Top header ✅
│   │
│   └── ui/                       # UI components
│       ├── button.tsx           # Button component ✅
│       ├── input.tsx            # Input component ✅
│       ├── card.tsx             # Card components ✅
│       ├── table.tsx            # Table component (Phase 2)
│       ├── dialog.tsx           # Dialog/Modal (Phase 2)
│       ├── select.tsx           # Select dropdown (Phase 2)
│       └── ...                  # More components
│
├── lib/                          # Utilities and configurations
│   ├── db/
│   │   └── connection.ts        # MongoDB connection ✅
│   │
│   ├── auth/
│   │   ├── jwt.ts               # JWT utilities ✅
│   │   └── middleware.ts        # Auth middleware ✅
│   │
│   ├── models/                   # Mongoose models
│   │   ├── User.ts              # User model ✅
│   │   ├── Doctor.ts            # Doctor model ✅
│   │   ├── District.ts          # District model ✅
│   │   ├── Patient.ts           # Patient model ✅
│   │   ├── Prescription.ts      # Prescription model ✅
│   │   ├── Order.ts             # Order model ✅
│   │   ├── Product.ts           # Product model ✅
│   │   └── DistrictProduct.ts   # District-Product mapping ✅
│   │
│   └── utils/
│       ├── cn.ts                # Class name utility ✅
│       └── response.ts          # API response utilities ✅
│
├── scripts/                      # Utility scripts
│   └── create-admin.js          # Create super admin ✅
│
├── public/                       # Static assets
│   └── logo.png                 # Dast-e-Yaar logo ✅
│
├── .env.local                    # Environment variables ✅
├── package.json                  # Dependencies ✅
├── tsconfig.json                # TypeScript config ✅
├── tailwind.config.ts           # Tailwind config ✅
└── README.md                     # This file ✅
```

---

## 🛠️ Tech Stack Details

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icons
- **Recharts**: Charts and graphs
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Axios**: HTTP client

### Backend (API Routes)
- **Next.js API Routes**: Serverless functions
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing

### Database
- **MongoDB Atlas**: Cloud database (shared with Node.js backend)

### Deployment
- **Vercel**: Frontend hosting and API routes
- **MongoDB Atlas**: Database hosting

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- MongoDB Atlas account
- Shopify store credentials (for Phase 3+)

### Installation

1. **Clone the repository**
   ```bash
   cd admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string

   # JWT
   JWT_SECRET=your_jwt_secret_key

   # Shopify (for Phase 3+)
   SHOPIFY_STORE_URL=your_store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your_shopify_access_token

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Create Super Admin** (if not exists)
   ```bash
   node scripts/create-admin.js
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

### Login Credentials

**Super Admin:**
- Email: `superadmin@dasteyaar.com`
- Password: `Super@Admin123`

**KAM (Lahore):**
- Email: `kam.lahore@dasteyaar.com`
- Password: `Kam@Lahore123`

---

## 🎨 Design System

### Colors (CCL Theme)
```css
Primary Red: #D32F2F
Dark Red: #B71C1C
Light Red: #FFCDD2
White: #FFFFFF
Off White: #FAFAFA

Gray Scale:
- Dark Gray: #1F2937
- Medium Gray: #6B7280
- Light Gray: #E5E7EB
```

### Typography
- **Font**: System fonts (sans-serif)
- **Headings**: Bold, 24-32px
- **Body**: Regular, 14-16px
- **Small**: 12-14px

### Components
- **Buttons**: Rounded, red primary, white text
- **Cards**: White background, subtle shadow, rounded corners
- **Inputs**: Border, rounded, focus ring in red
- **Tables**: Striped rows, hover effects

---

## 📝 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Login with email and password
```json
Request:
{
  "email": "superadmin@dasteyaar.com",
  "password": "Super@Admin123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "name": "...",
      "role": "super_admin"
    },
    "token": "jwt_token_here"
  }
}
```

#### GET `/api/auth/me`
Get current user profile (requires auth token)
```json
Headers:
{
  "Authorization": "Bearer jwt_token_here"
}

Response:
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "name": "...",
    "role": "super_admin",
    "assigned_districts": []
  }
}
```

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Role-Based Access Control**: Super Admin vs KAM permissions
- **District Scoping**: KAMs only see their assigned districts
- **Input Validation**: Zod schema validation
- **HTTPS Only**: Production enforces HTTPS
- **CORS Protection**: Configured allowed origins
- **Rate Limiting**: API rate limiting (Phase 6)

---

## 🧪 Testing

```bash
# Run tests (Phase 7)
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:coverage
```

---

## 📦 Build & Deploy

### Build for production
```bash
npm run build
```

### Start production server
```bash
npm start
```

### Deploy to Vercel
```bash
vercel --prod
```

---

## 🤝 Contributing

This is a private project for CCL Pakistan. For any issues or feature requests, please contact the development team.

---

## 📄 License

Proprietary - CCL Pakistan © 2025

---

## 👥 Team

- **Project Manager**: Syed Umair Maroof
- **Department**: Commercial Pakistan
- **Development**: AI-Assisted Development
- **Date Started**: January 2025

---

## 📞 Support

For technical support or questions:
- Email: support@dasteyaar.com
- Phone: [Contact Number]

---

**Last Updated**: October 7, 2025
**Version**: 1.0.0 (Phase 1 Complete)

