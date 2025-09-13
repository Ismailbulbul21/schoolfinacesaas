# School Finance Management System

A comprehensive finance management system designed specifically for schools in Somalia. This system replaces paper-based fee tracking with a modern, digital solution that works reliably even with slow internet connections.

## 🎯 Features

### Core Functionality
- **Multi-tenant Architecture**: Each school's data is completely isolated
- **Role-based Access Control**: Super Admin, School Admin, and Finance Staff roles
- **Offline Support**: Works with React Query caching for unreliable connections
- **Bulk Data Import**: CSV/Excel file upload for students and payments
- **Real-time Reporting**: Live statistics and downloadable reports
- **Mobile-first Design**: Responsive interface optimized for mobile devices

### User Roles

#### Super Admin
- System-wide oversight and management
- Create and manage schools
- Create school admin accounts
- View system-wide statistics
- Access to all school financial data

#### School Admin
- Manage school-level data
- Upload student lists
- Create fee items (tuition, exam fees, etc.)
- Generate invoices for all students
- Create finance staff accounts
- View and download reports
- Monitor payment status

#### Finance Staff
- Mark student payments as paid/unpaid
- Upload payment data via CSV/Excel
- Filter and search students
- Simple, focused interface for payment management

## 🛠️ Technology Stack

### Backend
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Row Level Security (RLS)**: Data isolation between schools
- **Supabase Auth**: Secure authentication system
- **PostgreSQL Functions**: Custom business logic

### Frontend
- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Zod**: Schema validation
- **React Router**: Client-side routing
- **Lucide React**: Beautiful icons

### Additional Libraries
- **Papa Parse**: CSV parsing
- **XLSX**: Excel file handling
- **Recharts**: Lightweight charts
- **Date-fns**: Date manipulation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd saasfinanceee
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (see Database Setup section)
   - Update the Supabase configuration in `src/lib/supabase.ts`

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:5173 in your browser
   - Create your first super admin account at `/setup`

## 🗄️ Database Setup

The system uses the following main tables:

### Core Tables
- `schools`: School information
- `super_admins`: System administrators
- `school_admins`: School-level administrators
- `finance_staff`: Finance staff members
- `students`: Student records
- `fee_items`: Fee types and amounts
- `invoices`: Payment records

### Key Features
- **Row Level Security**: Ensures data isolation between schools
- **Foreign Key Constraints**: Maintains data integrity
- **Custom Functions**: Bulk operations and statistics
- **Indexes**: Optimized for performance

### Sample Data
The system includes sample data for testing:
- 1 Super Admin account
- 1 Sample school (Somalia Primary School)
- 10 Sample students across different grades
- 5 Fee items (tuition, exam fees, etc.)
- Sample invoices with some marked as paid

## 📱 User Interface

### Design Principles
- **Mobile-first**: Optimized for mobile devices
- **Simple Language**: Easy to understand for all users
- **Large Touch Targets**: Finger-friendly buttons
- **Clear Navigation**: Minimal and intuitive
- **Fast Loading**: Optimized for slow connections

### Key Pages
- **Login Page**: Email/password authentication
- **Setup Page**: One-time super admin creation
- **Super Admin Dashboard**: System overview and school management
- **School Admin Dashboard**: School-level management (coming soon)
- **Finance Staff Dashboard**: Payment management (coming soon)

## 🔒 Security Features

- **HTTPS**: All connections encrypted
- **Input Validation**: Frontend and backend validation
- **Row Level Security**: Database-level access control
- **Rate Limiting**: Protection against brute force attacks
- **SQL Injection Prevention**: Parameterized queries
- **Data Sanitization**: All inputs cleaned

## 📊 Reporting & Analytics

### Available Reports
- **System Statistics**: Total schools, students, and revenue
- **School Statistics**: Per-school payment summaries
- **Payment Status**: Paid vs unpaid breakdowns
- **Export Options**: CSV and Excel downloads

### Analytics Features
- Real-time statistics
- Payment trend analysis
- Student enrollment tracking
- Revenue monitoring

## 🔄 Offline Support

The system includes offline capabilities:
- **React Query Caching**: Data cached for offline access
- **Payment Queuing**: Offline payments queued for sync
- **Automatic Sync**: Data syncs when connection restored
- **Conflict Resolution**: Handles data conflicts gracefully

## 📁 File Upload Features

### Supported Formats
- **CSV**: Comma-separated values
- **Excel**: .xlsx files

### Upload Types
- **Student Lists**: Bulk student import
- **Payment Data**: Bulk payment updates

### Data Validation
- **Format Validation**: File structure checking
- **Data Validation**: Field validation and error reporting
- **Duplicate Prevention**: Prevents duplicate records
- **Error Reporting**: Detailed error messages with fixes

## 🚀 Deployment

### Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
The application is ready for deployment to modern hosting platforms.

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Component and function testing
- **Integration Tests**: API and database testing
- **E2E Tests**: Full user workflow testing

### Running Tests
```bash
npm run test
npm run test:e2e
```

## 📈 Performance

### Optimizations
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Compressed and optimized images
- **Bundle Analysis**: Optimized bundle sizes
- **Database Indexing**: Optimized queries
- **Caching Strategy**: Intelligent data caching

### Scalability
- **Database Scaling**: Handles thousands of students
- **Bulk Operations**: Efficient bulk data processing
- **Connection Pooling**: Optimized database connections
- **CDN Ready**: Static asset optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Features

- **Expense Tracking**: Track school expenses
- **Custom Fee Names**: School-specific fee customization
- **Invoice Templates**: Customizable invoice formats
- **SMS Notifications**: Payment reminders via SMS
- **Multi-language Support**: Somali and English
- **Advanced Analytics**: Detailed financial reports
- **Integration APIs**: Connect with other school systems

---

**Built with ❤️ for schools in Somalia**