# SoActiv - Gym Management System

A comprehensive fitness center management application built with modern web technologies. SoActiv helps gym owners and administrators efficiently manage their fitness business operations.

## 🏋️ Features

### 📊 Dashboard & Analytics
- Real-time business metrics and KPIs
- Revenue tracking and payment analytics
- Member statistics and growth insights
- Staff performance monitoring

### 👥 Member Management
- **Client Registration & Profiles**: Complete member information management
- **Membership Plans**: Basic and Premium packages with personal training options
- **Status Tracking**: Active, expired, and pending memberships
- **Emergency Contacts**: Safety and communication management

### 📝 Enquiry Management
- Lead capture and tracking system
- Follow-up scheduling and reminders
- Conversion tracking from enquiry to membership
- Staff assignment for enquiry handling

### 👨‍💼 Staff Management
- Employee profiles and role management
- Salary and compensation tracking
- Staff attendance monitoring
- Performance analytics

### 📈 Reports & Analytics
- Financial reports and revenue analysis
- Member attendance patterns
- Staff productivity metrics
- Business growth insights

### 🔐 Authentication & Security
- Secure JWT-based authentication
- Google Sign-In integration
- Role-based access control (Admin/Staff/Client)
- Session management with HTTP-only cookies

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Socket.io Client** for real-time features
- **Axios** for API communication

### Backend
- **Node.js** with **Bun** runtime
- **Express.js** web framework
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Firebase Admin** for Google authentication
- **Bcrypt** for password hashing
- **Express Rate Limit** for API protection

### Development Tools
- **ESLint** for code linting
- **PostCSS** with **Autoprefixer**
- **Nodemon** for development server
- **Docker** support for containerization

## 🚀 Getting Started

### Prerequisites
- **Bun** (v1.2.5 or higher) - [Install Bun](https://bun.sh)
- **MongoDB** (local or cloud instance)
- **Node.js** (v18 or higher) - for frontend development

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SoActiv
   ```

2. **Backend Setup**
   ```bash
   cd be
   bun install
   ```

3. **Frontend Setup**
   ```bash
   cd ../fe
   npm install
   ```

### Environment Configuration

1. **Backend Environment** (`be/.env`)
   ```env
   PORT=8000
   CORS_ORIGIN="http://localhost:5173"
   MONGODB_URI="mongodb://127.0.0.1:27017/soActive"
   ACCESS_TOKEN_SECRET="your-super-secret-jwt-key"
   NODE_ENV="development"
   ```

2. **Firebase Setup** (Optional - for Google Sign-In)
   - Place your `serviceAccountKey.json` in the `be/` directory
   - Configure Firebase Admin SDK

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd be
   bun run dev
   ```
   Server will run on `http://localhost:8000`

3. **Start Frontend Development Server**
   ```bash
   cd fe
   npm run dev
   ```
   Application will run on `http://localhost:5173`

## 📁 Project Structure

```
SoActiv/
├── be/                          # Backend application
│   ├── controllers/             # Route controllers
│   ├── models/                  # MongoDB models
│   ├── routes/                  # API routes
│   ├── middlewares/             # Custom middleware
│   ├── lib/                     # Utility libraries
│   ├── db/                      # Database configuration
│   ├── uploads/                 # File upload storage
│   └── index.ts                 # Server entry point
├── fe/                          # Frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── contexts/            # React contexts
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript type definitions
│   │   └── App.tsx              # Main app component
│   ├── public/                  # Static assets
│   └── index.html               # HTML template
└── README.md                    # Project documentation
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/user/register` - User registration
- `POST /api/v1/user/login` - User login
- `POST /api/v1/user/logout` - User logout
- `GET /api/v1/user/getCurrentUser` - Get current user
- `POST /api/v1/user/google-signin` - Google Sign-In

### Client Management
- `GET /api/v1/client` - Get all clients
- `POST /api/v1/client` - Create new client
- `PUT /api/v1/client/:id` - Update client
- `DELETE /api/v1/client/:id` - Delete client

### Staff Management
- `GET /api/v1/staff` - Get all staff
- `POST /api/v1/staff` - Create new staff member
- `PUT /api/v1/staff/:id` - Update staff member
- `DELETE /api/v1/staff/:id` - Delete staff member

### Enquiry Management
- `GET /api/v1/enquiry` - Get all enquiries
- `POST /api/v1/enquiry` - Create new enquiry
- `PUT /api/v1/enquiry/:id` - Update enquiry
- `DELETE /api/v1/enquiry/:id` - Delete enquiry

### Staff Attendance
- `GET /api/v1/staff-attendance` - Get attendance records
- `POST /api/v1/staff-attendance` - Record attendance

## 🎨 UI Features

- **Dark/Light Theme** support
- **Responsive Design** for all screen sizes
- **Modern UI Components** with Tailwind CSS
- **Interactive Dashboard** with real-time updates
- **Form Validation** and error handling
- **Loading States** and user feedback
- **Mobile-First** approach

## 🔒 Security Features

- **JWT Authentication** with HTTP-only cookies
- **Password Hashing** with bcrypt
- **Rate Limiting** on authentication endpoints
- **CORS Protection** with configurable origins
- **Input Validation** and sanitization
- **Role-Based Access Control**

## 🚢 Deployment

### Using Docker
```bash
# Backend
cd be
docker build -t soactiv-backend .
docker run -p 8000:8000 soactiv-backend

# Frontend
cd fe
npm run build
# Deploy dist/ folder to your preferred hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔄 Version History

- **v1.0.0** - Initial release with core features
  - User authentication and management
  - Client and staff management
  - Enquiry tracking system
  - Basic reporting and analytics

---

**Built with ❤️ for the fitness community**
