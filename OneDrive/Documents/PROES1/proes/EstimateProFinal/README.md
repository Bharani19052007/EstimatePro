# Project Estimation System

A comprehensive project estimation and management system with ML-powered analytics, resource management, and cost estimation capabilities.

## 🚀 Features

### Core Features
- **Project Management**: Create, edit, and manage projects with detailed information
- **Cost Estimation**: Phase-wise cost breakdown with resource allocation
- **Resource Management**: Team member management with availability tracking
- **ML Project Analyzer**: AI-powered project analysis with trained models
- **Dashboard**: Analytics and insights for project management
- **Authentication**: Secure login system with OAuth support

### ML Analyzer Features
- **Project Type Detection**: Automatically identifies project type (Restaurant, E-commerce, Mobile App)
- **Phase-wise Estimation**: Detailed breakdown of project phases
- **Cost & Time Estimates**: ML-powered predictions based on historical data
- **Confidence Levels**: Reliability scores for predictions

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization
- **Axios** for API calls
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Passport.js** for OAuth
- **Bcrypt** for password hashing
- **Multer** for file uploads

### ML Features
- **Custom ML models** trained on project data
- **Project type classification**
- **Cost and time estimation algorithms**
- **Phase-based project breakdown**

## 📦 Installation

### Prerequisites
- Node.js 16+
- MongoDB
- Git

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your database and OAuth credentials
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Environment Variables (Backend)
Create a `.env` file in the backend directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/project-management

# Server
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend URL
FRONTEND_URL=http://localhost:8080

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 📊 ML Training Data

The system comes pre-seeded with training data for:
- **Restaurant Projects**: 6 phases, 186 days avg, ₹21L avg cost
- **E-commerce Projects**: 6 phases, 254 days avg, ₹35L avg cost  
- **Mobile App Projects**: 6 phases, 236 days avg, ₹29L avg cost

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bharani19052007/PROJECT-ESTIMATOR.git
   cd PROJECT-ESTIMATOR
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend  
   cd ../frontend && npm install
   ```

3. **Set up environment**
   ```bash
   # Backend environment
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the application**
   ```bash
   # Start backend (port 5000)
   cd backend && npm run dev
   
   # Start frontend (port 8080)
   cd frontend && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:5000

## 📱 Usage

### ML Analyzer
1. Go to Admin Dashboard → ML Analyzer
2. Enter a project description
3. Click "Analyze Project with AI"
4. View detailed phase-wise estimates

### Project Management
1. Create new projects with detailed information
2. Add team members and resources
3. Generate cost estimations
4. Track progress and analytics

## 🔐 Authentication

The system supports:
- **Local Authentication**: Email/password login
- **Google OAuth**: Sign in with Google
- **Microsoft OAuth**: Sign in with Microsoft

## 📈 Analytics & Reports

- **Project Overview**: Total projects, costs, timelines
- **Resource Utilization**: Team member availability and allocation
- **Cost Analysis**: Budget vs actual spending
- **ML Insights**: Project type distribution and predictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support and questions:
- Create an issue on GitHub
- Email: bharani@example.com

## 🗺️ Roadmap

- [ ] Advanced ML models for more project types
- [ ] Real-time collaboration features
- [ ] Mobile applications
- [ ] Advanced reporting and export features
- [ ] Integration with popular project management tools

---

**Built with ❤️ by Bharani**
