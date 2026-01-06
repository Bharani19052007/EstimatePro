const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const ActivityLog = require('../models/ActivityLog');

// Mock data
const mockUsers = [
  {
    name: "Alex Johnson",
    email: "alex@example.com",
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    location: "San Francisco, CA",
    bio: "Full-stack developer with 5+ years of experience",
    role: "developer",
    skills: ["React", "Node.js", "MongoDB", "TypeScript"],
    hourlyRate: 75,
    department: "Engineering"
  },
  {
    name: "Sarah Chen",
    email: "sarah@example.com", 
    password: "password123",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&q=80",
    location: "New York, NY",
    bio: "Project manager specializing in agile methodologies",
    role: "project_manager",
    skills: ["Agile", "Scrum", "JIRA", "Leadership"],
    hourlyRate: 85,
    department: "Management"
  },
  {
    name: "Mike Wilson",
    email: "mike@example.com",
    password: "password123", 
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    location: "Austin, TX",
    bio: "UI/UX designer focused on user experience",
    role: "designer",
    skills: ["Figma", "Adobe XD", "CSS", "User Research"],
    hourlyRate: 65,
    department: "Design"
  }
];

const mockProjects = [
  {
    projectName: "Web Development Platform",
    description: "Full-stack web application with React and Node.js",
    startDate: new Date("2025-01-15"),
    endDate: new Date("2025-04-15"),
    status: "in_progress",
    priority: "high",
    estimatedBudget: 125000,
    actualCost: 45000,
    client: {
      name: "Tech Corp",
      email: "contact@techcorp.com",
      company: "Tech Corp Inc."
    }
  },
  {
    projectName: "Mobile Banking App",
    description: "iOS and Android banking application with secure transactions",
    startDate: new Date("2025-02-01"),
    endDate: new Date("2025-05-01"),
    status: "planning",
    priority: "medium",
    estimatedBudget: 85000,
    actualCost: 15000,
    client: {
      name: "Finance Bank",
      email: "projects@financebank.com",
      company: "Finance Bank Ltd"
    }
  },
  {
    projectName: "E-commerce Platform",
    description: "Scalable e-commerce solution with payment integration",
    startDate: new Date("2025-03-10"),
    endDate: new Date("2025-08-10"),
    status: "planning",
    priority: "high",
    estimatedBudget: 150000,
    actualCost: 25000,
    client: {
      name: "Retail Store",
      email: "it@retailstore.com",
      company: "Retail Store Chain"
    }
  },
  {
    projectName: "Data Analytics Dashboard",
    description: "Business intelligence dashboard with real-time analytics",
    startDate: new Date("2025-01-20"),
    endDate: new Date("2025-03-20"),
    status: "completed",
    priority: "low",
    estimatedBudget: 95000,
    actualCost: 88000,
    client: {
      name: "Analytics Inc",
      email: "dev@analyticsinc.com",
      company: "Analytics Inc"
    }
  }
];

const mockTasks = [
  {
    taskName: "Setup React project structure",
    description: "Initialize React application with necessary dependencies",
    status: "completed",
    priority: "high",
    estimatedHours: 8,
    actualHours: 6,
    dueDate: new Date("2025-01-20"),
    assignee: "Alex Johnson"
  },
  {
    taskName: "Design database schema",
    description: "Create MongoDB schema for user and project data",
    status: "in_progress",
    priority: "high",
    estimatedHours: 12,
    actualHours: 8,
    dueDate: new Date("2025-01-25"),
    assignee: "Alex Johnson"
  },
  {
    taskName: "Create UI mockups",
    description: "Design user interface mockups for main features",
    status: "completed",
    priority: "medium",
    estimatedHours: 16,
    actualHours: 14,
    dueDate: new Date("2025-01-22"),
    assignee: "Mike Wilson"
  },
  {
    taskName: "Implement authentication",
    description: "Setup JWT-based authentication system",
    status: "in_progress",
    priority: "high",
    estimatedHours: 10,
    actualHours: 7,
    dueDate: new Date("2025-01-28"),
    assignee: "Alex Johnson"
  }
];

const mockActivities = [
  {
    activityName: "Project kickoff meeting",
    description: "Initial meeting with stakeholders to discuss project requirements",
    type: "meeting",
    status: "completed",
    estimatedDuration: 2,
    actualDuration: 2.5,
    date: new Date("2025-01-15"),
    participants: ["Alex Johnson", "Sarah Chen"]
  },
  {
    activityName: "Sprint planning",
    description: "Plan first sprint tasks and deliverables",
    type: "planning",
    status: "completed",
    estimatedDuration: 3,
    actualDuration: 3,
    date: new Date("2025-01-16"),
    participants: ["Sarah Chen", "Mike Wilson"]
  },
  {
    activityName: "Code review",
    description: "Review authentication implementation",
    type: "development",
    status: "in_progress",
    estimatedDuration: 2,
    actualDuration: 1,
    date: new Date("2025-01-24"),
    participants: ["Alex Johnson", "Sarah Chen"]
  }
];

const mockActivityLogs = [
  {
    action: "created_project",
    description: "Created new project: Web Development Platform",
    timestamp: new Date("2025-01-15T09:00:00Z"),
    details: {
      projectId: null,
      projectName: "Web Development Platform",
      userId: null
    }
  },
  {
    action: "completed_task",
    description: "Completed task: Setup React project structure",
    timestamp: new Date("2025-01-20T17:30:00Z"),
    details: {
      taskId: null,
      taskName: "Setup React project structure",
      userId: null
    }
  },
  {
    action: "created_task",
    description: "Created new task: Design database schema",
    timestamp: new Date("2025-01-24T08:15:00Z"),
    details: {
      userId: null,
      userEmail: "alex@example.com"
    }
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project-management');
    console.log('✅ Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const createdUsers = [];
    for (const userData of mockUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({ ...userData, password: hashedPassword });
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`👤 Created user: ${savedUser.name}`);
    }

    // Create projects
    const createdProjects = [];
    for (let i = 0; i < mockProjects.length; i++) {
      const projectData = {
        ...mockProjects[i],
        userId: createdUsers[0]._id, // Assign to first user
        team: [
          {
            userId: createdUsers[0]._id,
            role: "Lead Developer",
            hourlyRate: 75
          },
          {
            userId: createdUsers[1]._id,
            role: "Project Manager", 
            hourlyRate: 85
          }
        ]
      };
      const project = new Project(projectData);
      const savedProject = await project.save();
      createdProjects.push(savedProject);
      console.log(`📁 Created project: ${savedProject.projectName}`);
    }

    // Create tasks first and store their IDs
    const createdTasks = [];
    for (let i = 0; i < mockTasks.length; i++) {
      const taskData = {
        ...mockTasks[i],
        projectId: createdProjects[0]._id, // Assign to first project
        userId: createdUsers[0]._id
      };
      const task = new Task(taskData);
      const savedTask = await task.save();
      createdTasks.push(savedTask);
      console.log(`📋 Created task: ${taskData.taskName}`);
    }

    // Create activities with proper task references
    for (let i = 0; i < mockActivities.length; i++) {
      const activityData = {
        activityName: mockActivities[i].activityName,
        description: mockActivities[i].description,
        taskId: createdTasks[i % createdTasks.length]._id, // Assign to a task
        estimatedHours: mockActivities[i].estimatedDuration,
        actualHours: mockActivities[i].actualDuration,
        status: mockActivities[i].status,
        date: mockActivities[i].date,
        assignedTo: createdUsers[0]._id
      };
      const activity = new Activity(activityData);
      await activity.save();
      console.log(`🎯 Created activity: ${activityData.activityName}`);
    }

    // Create activity logs
    for (let i = 0; i < mockActivityLogs.length; i++) {
      const logData = {
        ...mockActivityLogs[i],
        userId: createdUsers[0]._id,
        ...(mockActivityLogs[i].details?.projectId === null && { 
          'details.projectId': createdProjects[0]._id 
        }),
        ...(mockActivityLogs[i].details?.taskId === null && { 
          'details.taskId': createdTasks[0]._id 
        })
      };
      const log = new ActivityLog(logData);
      await log.save();
      console.log(`📝 Created activity log: ${logData.action}`);
    }

    // Update user statistics
    await User.findByIdAndUpdate(createdUsers[0]._id, {
      projects: createdProjects.length,
      completedProjects: createdProjects.filter(p => p.status === 'completed').length,
      totalHours: mockTasks.reduce((sum, task) => sum + (task.actualHours || 0), 0)
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Projects: ${createdProjects.length}`);
    console.log(`   Tasks: ${mockTasks.length}`);
    console.log(`   Activities: ${mockActivities.length}`);
    console.log(`   Activity Logs: ${mockActivityLogs.length}`);
    
    console.log('\n🔑 Login credentials:');
    console.log('   Email: alex@example.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
