import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with base URL and common headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API Request - Token exists:', !!token);
    console.log('API Request - URL:', config.baseURL + config.url);
    console.log('API Request - Method:', config.method);
    
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data || '',
      token: token ? token.substring(0, 20) + '...' : 'null',
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    console.log(`[API Response Status] ${response.status}`, response.statusText);
    
    // For reports endpoint, handle binary data specially
    if (response.config.url?.includes('/reports/data')) {
      console.log('📊 Reports endpoint detected');
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response config responseType:', response.config?.responseType);
      
      // For binary data (PDF, Excel) with arraybuffer responseType, return the raw data
      if (response.config?.responseType === 'arraybuffer') {
        console.log('📊 ArrayBuffer response detected, returning raw data');
        return response.data;
      }
      
      // For text data (CSV, Text), return the response directly
      console.log('📊 Text response detected, returning response');
      return response;
    }
    
    // Handle different response structures
    if (response.data && typeof response.data === 'object') {
      // Backend returns { success: true, data: ... }
      if (response.data.success === false) {
        console.error('[API Error]', response.data.error);
        return Promise.reject(new Error(response.data.error || 'Request failed'));
      }
      return response.data.data; // Return the actual data
    }
    
    return response; // Return full response for other cases
  },
  (error) => {
    console.error('[API Response Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    let errorMessage = 'An error occurred';
    const status = error.response?.status;
    const data = error.response?.data;
    
    // Extract error message from response
    if (data?.error) {
      errorMessage = data.error;
    } else if (data?.message) {
      errorMessage = data.message;
    }
    
    // For reports endpoint, don't intercept errors - let them bubble up
    if (error.config?.url?.includes('/reports/data')) {
      console.log('📊 Reports endpoint error, letting it bubble up');
      return Promise.reject(error);
    }
    
    if (status === 401) {
      // Handle unauthorized access
      console.log('🚫 401 error detected, checking if we should clear auth...');
      console.log('🚫 Request URL:', error.config?.url);
      console.log('🚫 Request method:', error.config?.method);
      
      // Only clear auth if it's not a network issue or server error
      // Check if this is a genuine auth error (not a server issue)
      if (error.config?.url && !error.config.url.includes('/health')) {
        console.log('🚫 Clearing auth and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('globetrotter_auth');
        sessionStorage.removeItem('globetrotter_auth');
        window.location.href = '/login';
      } else {
        console.log('🚫 401 on health check, not clearing auth');
      }
      errorMessage = 'Your session has expired. Please log in again.';
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

// Test API connection
export const testApiConnection = async () => {
  try {
    const response = await api.get('/health');
    console.log('API Connection Test:', response);
    return response;
  } catch (error) {
    console.error('API Connection Test Failed:', error);
    throw error;
  }
};

// Authentication API calls
export const authApi = {
  login: async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  },

  signup: async (name, email, password) => {
    try {
      const response = await api.post('/users/signup', { name, email, password });
      return response.data;
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data.user;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData);
      return response.data.user;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  updateAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.put('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data.user;
    } catch (error) {
      console.error('Error updating avatar:', error);
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/users/password', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }
};

// Project API calls
export const projectApi = {
  createProject: async (projectData) => {
    try {
      const isFormData = projectData instanceof FormData;
      const response = await api.post('/projects', projectData, {
        headers: isFormData ? {
          'Content-Type': 'multipart/form-data',
        } : {
          'Content-Type': 'application/json',
        }
      });
      return response;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },
  
  getProjectsByUser: async () => {
    try {
      console.log('Fetching projects for authenticated user');
      const response = await api.get('/projects', {
        params: { _t: Date.now() } // Cache-busting parameter
      });
      
      console.log('API Response:', response);
      
      // Response interceptor already extracts the data and handles success checks
      console.log('Returning projects:', response);
      return response;
    } catch (error) {
      console.error('Error in getProjectsByUser:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  },

  getProjectById: async (projectId) => {
    try {
      const response = await api.get(`/projects/single/${projectId}`);
      return response;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  updateProject: async (projectId, projectData) => {
    try {
      const isFormData = projectData instanceof FormData;
      const response = await api.put(`/projects/${projectId}`, projectData, {
        headers: isFormData ? {
          'Content-Type': 'multipart/form-data',
        } : {
          'Content-Type': 'application/json',
        }
      });
      return response;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Tasks API
  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      return response;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  getTasksByProject: async (projectId) => {
    try {
      const response = await api.get(`/tasks/project/${projectId}`);
      return response || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Activities API
  createActivity: async (activityData) => {
    try {
      const response = await api.post('/activities', activityData);
      return response;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  },

  getActivitiesByTask: async (taskId) => {
    try {
      const response = await api.get(`/activities/task/${taskId}`);
      return response || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  updateActivity: async (activityId, activityData) => {
    try {
      const response = await api.put(`/activities/${activityId}`, activityData);
      return response;
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },

  deleteActivity: async (activityId) => {
    try {
      const response = await api.delete(`/activities/${activityId}`);
      return response;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  // Activity Log API
  getActivitiesByUser: async (userId, limit = 10) => {
    try {
      const response = await api.get(`/activity-log/user/${userId}?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  logActivity: async (userId, action, details) => {
    try {
      const response = await api.post('/activity-log/log', {
        userId,
        action,
        details
      });
      return response;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  },

  // Estimation API
  getAllEstimations: async () => {
    try {
      const response = await api.get('/estimations', {
        params: { _t: Date.now() } // Cache-busting parameter
      });
      console.log('Raw API response for getAllEstimations:', response);
      
      // Ensure we return an array
      const estimations = response || [];
      console.log('Processed estimations:', estimations);
      
      return estimations;
    } catch (error) {
      console.error('Error fetching estimations:', error);
      return [];
    }
  },

  getEstimationById: async (id) => {
    try {
      const response = await api.get(`/estimations/${id}`);
      console.log('API Response:', response);
      return response; // Response interceptor already extracts the data
    } catch (error) {
      console.error('Error fetching estimation:', error);
      throw error;
    }
  },

  createEstimation: async (estimationData) => {
    try {
      const response = await api.post('/estimations', estimationData);
      console.log('Create estimation response:', response);
      return response; // Backend returns { success: true, data: savedEstimation }
    } catch (error) {
      console.error('Error creating estimation:', error);
      throw error;
    }
  },

  updateEstimation: async (id, estimationData) => {
    try {
      const response = await api.put(`/estimations/${id}`, estimationData);
      return response;
    } catch (error) {
      console.error('Error updating estimation:', error);
      throw error;
    }
  },

  deleteEstimation: async (id) => {
    try {
      const response = await api.delete(`/estimations/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting estimation:', error);
      throw error;
    }
  },

  getEstimationStats: async () => {
    try {
      const response = await api.get('/estimations/stats/summary');
      const data = response; // Response interceptor already extracts the data
      
      // Transform backend data to match frontend expectations
      return {
        totalEstimations: data.totalEstimations || 0,
        completedEstimations: data.completedEstimations || 0,
        avgEstimationTime: data.avgEstimationTime || 0
      };
    } catch (error) {
      console.error('Error fetching estimation stats:', error);
      return {
        totalEstimations: 0,
        completedEstimations: 0,
        avgEstimationTime: 0
      };
    }
  },

  // Resource API (now using team members)
  getAllResources: async () => {
    try {
      const response = await api.get('/team-members');
      return response;
    } catch (error) {
      console.error('Error fetching resources:', error);
      return [];
    }
  },

  seedResources: async () => {
    try {
      const response = await api.post('/team-members/seed');
      return response;
    } catch (error) {
      console.error('Error seeding team members:', error);
      return [];
    }
  },

  getResourceById: async (id) => {
    try {
      console.log('API getResourceById called with ID:', id);
      const response = await api.get(`/team-members/${id}`);
      console.log('API getResourceById response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching resource:', error);
      throw error;
    }
  },

  createResource: async (resourceData) => {
    try {
      const response = await api.post('/team-members', resourceData);
      return response;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  },

  updateResource: async (id, resourceData) => {
    try {
      const response = await api.put(`/team-members/${id}`, resourceData);
      return response;
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  },

  deleteResource: async (resourceId) => {
    try {
      await api.delete(`/team-members/${resourceId}`);
      return true;
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  },

  // Reports API
  getAllReports: async () => {
    try {
      const response = await api.get('/reports');
      return response; // Backend returns { success: true, data: reports }
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  },

  getReportData: async (reportType, dateRange) => {
    try {
      const response = await api.post('/reports/data', { reportType, dateRange });
      console.log('📊 API Response:', response);
      console.log('📊 Response data:', response.data);
      console.log('📊 Response type:', typeof response.data);
      
      // For reports endpoint, the interceptor returns the full response
      if (response.data && typeof response.data === 'object') {
        console.log('📊 Extracted report data:', response.data);
        return response.data;
      }
      return response.data || {}; // Fallback
    } catch (error) {
      console.error('Error fetching report data:', error);
      return {};
    }
  },

  generateReport: async (reportType, dateRange, format = 'txt') => {
    try {
      // Configure axios for binary response
      const response = await api.post('/reports/data', { 
        reportType, 
        dateRange, 
        format,
        exportOnly: true 
      }, {
        responseType: (format === 'pdf' || format === 'excel') ? 'arraybuffer' : 'text'
      });
      
      console.log('📊 Raw response type:', typeof response);
      console.log('📊 Response keys:', Object.keys(response || {}));
      console.log('📊 Response config responseType:', response.config?.responseType);
      
      // Handle different response formats
      if (response.config?.responseType === 'arraybuffer') {
        console.log('📊 ArrayBuffer response detected');
        return response.data;
      } else if (response.data) {
        console.log('📊 Using response.data');
        return response.data;
      } else {
        console.log('📊 Using response directly');
        return response;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  },

  // Dashboard API
  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      console.log('Dashboard stats response:', response);
      return response; // Response interceptor already extracts the data
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalProjects: 0,
        totalEstimations: 0,
        totalValue: 0,
        activeProjects: 0,
        completedProjects: 0
      };
    }
  },
};

// Export separate API objects for better organization
export const estimationApi = {
  getAllEstimations: projectApi.getAllEstimations,
  getEstimationById: projectApi.getEstimationById,
  createEstimation: projectApi.createEstimation,
  updateEstimation: projectApi.updateEstimation,
  deleteEstimation: projectApi.deleteEstimation,
  getEstimationStats: projectApi.getEstimationStats,
};

export const resourceApi = {
  getAllResources: projectApi.getAllResources,
  getResourceById: projectApi.getResourceById,
  createResource: projectApi.createResource,
  updateResource: projectApi.updateResource,
  deleteResource: projectApi.deleteResource,
};

export const taskApi = {
  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      return response;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  getTasksByProject: async (projectId) => {
    try {
      const response = await api.get(`/tasks/project/${projectId}`);
      return response || [];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  },

  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  getTaskById: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  }
};

export const reportsApi = {
  getAllReports: projectApi.getAllReports,
  getReportData: projectApi.getReportData,
  generateReport: projectApi.generateReport,
  
  saveReport: async (reportData) => {
    try {
      const response = await api.post('/reports', reportData);
      return response.data;
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }
};

// Helper function to generate text-based reports
const generateTextReport = (reportType, dateRange, data) => {
  const timestamp = new Date().toLocaleString();
  let content = `Project Estimation Report\n`;
  content += `Generated: ${timestamp}\n`;
  content += `Report Type: ${reportType}\n`;
  content += `Date Range: ${dateRange}\n`;
  content += `=====================================\n\n`;

  switch (reportType) {
    case 'overview':
      content += `OVERVIEW REPORT\n`;
      content += `----------------\n`;
      content += `Total Revenue: $${data.totalRevenue?.toLocaleString() || 0}\n`;
      content += `Active Projects: ${data.activeProjects || 0}\n`;
      content += `Team Members: ${data.teamMembers || 0}\n`;
      content += `Avg Project Value: $${Math.round(data.avgProjectValue || 0).toLocaleString()}\n\n`;
      
      if (data.projectCostsOverTime) {
        content += `PROJECT COSTS OVER TIME\n`;
        content += `-----------------------\n`;
        data.projectCostsOverTime.forEach(item => {
          content += `${item.name}: $${item.costs?.toLocaleString() || 0} (${item.projects || 0} projects)\n`;
        });
      }
      break;

    case 'financial':
      content += `FINANCIAL REPORT\n`;
      content += `----------------\n`;
      
      if (data.revenueBreakdown) {
        content += `REVENUE BREAKDOWN\n`;
        content += `-----------------\n`;
        data.revenueBreakdown.forEach(item => {
          content += `${item.period}: $${item.amount?.toLocaleString() || 0} (${item.projectCount || 0} projects)\n`;
        });
      }
      
      if (data.projectProfitability) {
        content += `\nPROJECT PROFITABILITY\n`;
        content += `--------------------\n`;
        data.projectProfitability.forEach(item => {
          content += `${item.projectName}:\n`;
          content += `  Revenue: $${item.revenue?.toLocaleString() || 0}\n`;
          content += `  Cost: $${item.cost?.toLocaleString() || 0}\n`;
          content += `  Profit: $${item.profit?.toLocaleString() || 0}\n`;
          content += `  Margin: ${item.margin || 0}%\n\n`;
        });
      }
      break;

    case 'resources':
      content += `RESOURCES REPORT\n`;
      content += `----------------\n`;
      
      if (data.teamPerformance) {
        content += `TEAM PERFORMANCE\n`;
        content += `-----------------\n`;
        data.teamPerformance.forEach(member => {
          content += `${member.name} (${member.role}):\n`;
          content += `  Projects: ${member.projects || 0}\n`;
          content += `  Hours: ${member.hours || 0}\n`;
          content += `  Efficiency: ${member.efficiency || 0}%\n\n`;
        });
      }
      break;

    case 'projects':
      content += `PROJECTS REPORT\n`;
      content += `----------------\n`;
      
      if (data.projectStatus) {
        content += `PROJECT STATUS OVERVIEW\n`;
        content += `---------------------\n`;
        data.projectStatus.forEach(status => {
          content += `${status.status}: ${status.count || 0} (${status.percentage || 0}%)\n`;
        });
      }
      
      if (data.recentProjects) {
        content += `\nRECENT PROJECTS\n`;
        content += `---------------\n`;
        data.recentProjects.forEach(project => {
          content += `${project.name}:\n`;
          content += `  Status: ${project.status}\n`;
          content += `  Budget: $${project.budget?.toLocaleString() || 0}\n`;
          content += `  Actual: $${project.actual?.toLocaleString() || 0}\n\n`;
        });
      }
      break;
  }

  return content;
};

export default api;
