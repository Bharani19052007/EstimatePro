import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Plus, Calculator, TrendingUp, DollarSign, Users, Clock, AlertTriangle, CheckCircle, BarChart3, Eye, RefreshCw, PieChart, FileText, FolderOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { projectApi } from "@/services/api";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [estimations, setEstimations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalEstimations: 0,
    totalValue: 0,
    activeProjects: 0,
    completedProjects: 0,
    activeEstimations: 0,
    completedEstimations: 0,
    avgEstimationTime: 0
  });
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  useEffect(() => {
    console.log('🔄 Dashboard useEffect running. User:', user);
    console.log('🔄 User ID:', user?.id);
    console.log('🔄 User _id:', user?._id);
    console.log('🔄 User keys:', user ? Object.keys(user) : 'No user');
    if (user?.id || user?._id) {
      fetchDashboardData();
    } else if (user) {
      // User exists but no ID - still stop loading
      console.log('❌ User exists but no ID found');
      setIsLoading(false);
    }
  }, [user]);

  // Refresh data when tab changes or component gets focus
  useEffect(() => {
    if (user?.id && !isLoading) {
      fetchDashboardData();
    }
  }, [activeTab]);

  // Refresh data when window gets focus (user returns from other tabs)
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id && !isLoading) {
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, isLoading]);

  // Add a refresh function
  const refreshDashboard = () => {
    console.log('🔄 Refreshing dashboard...');
    setAuthError(false); // Clear auth error on refresh attempt
    const userId = user?.id || user?._id;
    if (userId) {
      fetchDashboardData();
    }
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const userId = user?.id || user?._id;
      console.log('🔄 Fetching dashboard data for user:', userId);
      console.log('🔄 User object:', user);
      
      // Check if user is authenticated
      if (!userId) {
        console.error('❌ No user ID found - user not authenticated');
        setAuthError(true);
        setIsLoading(false);
        return;
      }
      
      // Check if token exists
      const token = localStorage.getItem('token');
      console.log('🔄 Token exists:', !!token);
      console.log('🔄 Token value:', token ? token.substring(0, 50) + '...' : 'null');
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      console.log('🔄 Starting API calls...');
      
      const [projectsData, estimationsData, statsData] = await Promise.race([
        Promise.all([
          projectApi.getProjectsByUser(),
          projectApi.getAllEstimations(),
          projectApi.getDashboardStats()
        ]),
        timeoutPromise
      ]);
      
      console.log('✅ Dashboard data received:', {
        projectsCount: projectsData?.length || 0,
        estimationsCount: estimationsData?.length || 0,
        statsData
      });
      
      console.log('🔍 Projects data:', projectsData);
      console.log('🔍 Estimations data:', estimationsData);
      console.log('🔍 First estimation structure:', estimationsData?.[0] ? {
        id: estimationsData[0].id,
        _id: estimationsData[0]._id,
        keys: Object.keys(estimationsData[0])
      } : 'No estimations');
      console.log('🔍 Stats data:', statsData);
      
      setProjects(projectsData || []);
      setEstimations(estimationsData || []);
      
      // Calculate estimation-specific stats
      const estimationStats = {
        activeEstimations: estimationsData?.filter(e => e.status === 'draft' || e.status === 'in_progress').length || 0,
        completedEstimations: estimationsData?.filter(e => e.status === 'completed').length || 0,
        avgEstimationTime: 0 // Could be calculated based on creation/completion times
      };
      
      setStats({
        ...statsData,
        ...estimationStats
      } || {
        totalProjects: 0,
        totalEstimations: 0,
        totalValue: 0,
        activeProjects: 0,
        completedProjects: 0,
        activeEstimations: 0,
        completedEstimations: 0,
        avgEstimationTime: 0
      });
      
      // Clear auth error if successful
      setAuthError(false);
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ This is likely an authentication issue');
      console.error('❌ Please check if you are logged in correctly');
      
      // Set auth error flag
      setAuthError(true);
      
      // Set default values on error to prevent infinite loading
      setProjects([]);
      setEstimations([]);
      setStats({
        totalProjects: 0,
        totalEstimations: 0,
        totalValue: 0,
        activeProjects: 0,
        completedProjects: 0,
        activeEstimations: 0,
        completedEstimations: 0,
        avgEstimationTime: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Authentication Error Warning */}
        {authError && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Authentication Issue Detected</h3>
                <p className="text-sm text-red-700">
                  Unable to fetch your data. Please try logging out and logging back in.
                </p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/login')}
                  >
                    Go to Login
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setAuthError(false);
                      refreshDashboard();
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user?.name}! Here's your project overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={refreshDashboard}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => navigate('/cost-estimation')}
              className="flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              New Estimation
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="estimations" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Estimations
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeProjects} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimations</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEstimations}</div>
              <p className="text-xs text-muted-foreground">
                Created this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedProjects}</div>
              <p className="text-xs text-muted-foreground">
                Projects finished
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>
                    Latest project activities
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
                    View All Projects
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/create-project')}>
                    Create Project
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first project to get started
                  </p>
                  <Button onClick={() => navigate('/create-project')}>
                    Create Project
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project._id || project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{project.projectName || project.name}</h4>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Client: {project.client?.name || project.client}</span>
                          <span>•</span>
                          <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                        {project.progress !== undefined && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        {project.estimatedCost && (
                          <div className="font-semibold">
                            {formatCurrency(project.estimatedCost)}
                          </div>
                        )}
                        <Link to={`/project/${project._id || project.id}`}>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Estimations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Estimations</CardTitle>
                  <CardDescription>
                    Latest cost estimations
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/estimation-dashboard')}>
                    View All Estimations
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/cost-estimation')}>
                    Create Estimation
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {estimations.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No estimations yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first cost estimation
                  </p>
                  <Button onClick={() => navigate('/cost-estimation')}>
                    Create Estimation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {estimations.slice(0, 5).map((estimation) => (
                    <div key={estimation._id || estimation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{estimation.projectName}</h4>
                          <Badge className={getStatusColor(estimation.status)}>
                            {estimation.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Client: {estimation.projectName}</span>
                          <span>•</span>
                          <span>Created: {new Date(estimation.createdAt).toLocaleDateString()}</span>
                        </div>
                        {estimation.progress !== undefined && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{estimation.progress}%</span>
                            </div>
                            <Progress value={estimation.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold">
                          {formatCurrency(estimation.finalCost || estimation.estimatedCost)}
                        </div>
                        <Link to={`/cost-estimation/${estimation._id || estimation.id}`}>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => navigate('/cost-estimation')}
              >
                <Calculator className="w-6 h-6 mb-2" />
                <div className="text-left">
                  <div className="font-medium">New Estimation</div>
                  <div className="text-xs text-muted-foreground">Create cost estimate</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => navigate('/create-project')}
              >
                <Plus className="w-6 h-6 mb-2" />
                <div className="text-left">
                  <div className="font-medium">New Project</div>
                  <div className="text-xs text-muted-foreground">Start a project</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => navigate('/resource-management')}
              >
                <Users className="w-6 h-6 mb-2" />
                <div className="text-left">
                  <div className="font-medium">Manage Resources</div>
                  <div className="text-xs text-muted-foreground">Team allocation</div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-4"
                onClick={() => navigate('/reports')}
              >
                <TrendingUp className="w-6 h-6 mb-2" />
                <div className="text-left">
                  <div className="font-medium">View Reports</div>
                  <div className="text-xs text-muted-foreground">Analytics & insights</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Estimations Tab */}
          <TabsContent value="estimations" className="space-y-6">
            {/* Estimation Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Estimations</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeEstimations}</div>
                  <p className="text-xs text-muted-foreground">
                    In progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedEstimations}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Estimations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Estimations</CardTitle>
                    <CardDescription>
                      Latest project cost estimations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {estimations.length === 0 ? (
                      <div className="text-center py-8">
                        <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No estimations yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Create your first project estimation to get started
                        </p>
                        <Button onClick={() => navigate('/cost-estimation')}>
                          Create Estimation
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {estimations.slice(0, 5).map((estimation) => (
                          <div key={estimation.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">{estimation.projectName}</h4>
                                <Badge className={getStatusColor(estimation.status)}>
                                  {estimation.status?.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Client: {estimation.projectName}</span>
                                <span>•</span>
                                <span>Created: {new Date(estimation.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{estimation.progress || 0}%</span>
                                </div>
                                <Progress value={estimation.progress || 0} className="h-2" />
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">{formatCurrency(estimation.finalCost || estimation.totalCost || 0)}</div>
                              <Button variant="ghost" size="sm" onClick={() => navigate(`/cost-estimation/${estimation._id || estimation.id}`)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Estimation Analytics */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Estimation Analytics</CardTitle>
                    <CardDescription>
                      Performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg. Estimation Value</span>
                        <span className="font-semibold">
                          {stats.totalEstimations > 0 ? formatCurrency(stats.totalValue / stats.totalEstimations) : '$0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Completion Rate</span>
                        <span className="font-semibold">
                          {stats.totalEstimations > 0 ? Math.round((stats.completedEstimations / stats.totalEstimations) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Active Projects</span>
                        <span className="font-semibold">{stats.activeEstimations}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/cost-estimation')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Estimation
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/projects')}
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      View All Projects
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
