import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  FileText,
  Plus,
  FolderOpen,
  Trash2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { estimationApi } from "@/services/api";

const EstimationDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [estimations, setEstimations] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalValue: 0,
    activeEstimations: 0,
    completedEstimations: 0,
    avgEstimationTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEstimationData();
  }, []);

  const fetchEstimationData = async () => {
    try {
      setIsLoading(true);
      const estimationsData = await estimationApi.getAllEstimations();
      
      setEstimations(estimationsData || []);
      
      // Calculate stats locally to ensure accuracy
      const stats = {
        totalProjects: estimationsData?.length || 0,
        totalValue: estimationsData?.reduce((sum, e) => sum + (e.finalCost || e.totalCost || 0), 0) || 0,
        activeEstimations: estimationsData?.filter(e => e.status === 'draft' || e.status === 'in_progress').length || 0,
        completedEstimations: estimationsData?.filter(e => e.status === 'completed').length || 0,
        avgEstimationTime: 0
      };
      
      setStats(stats);
      console.log('Calculated stats:', stats);
      console.log('Estimations data:', estimationsData);
    } catch (error) {
      console.error('Error fetching estimation data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
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

  const handleDeleteEstimation = async (estimationId) => {
    if (window.confirm('Are you sure you want to delete this estimation? This action cannot be undone.')) {
      try {
        await estimationApi.deleteEstimation(estimationId);
        // Refresh the estimations list
        fetchEstimationData();
      } catch (error) {
        console.error('Error deleting estimation:', error);
        // You could add a toast notification here
      }
    }
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Estimation Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track all your project estimations
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Back to Project Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/cost-estimation')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Estimation
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
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
                            <span>Client: {estimation.client}</span>
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
                        <div className="text-right ml-4">
                          <div className="text-lg font-semibold">
                            {formatCurrency(estimation.finalCost || estimation.totalCost || 0)}
                          </div>
                          <div className="flex items-center gap-2">
                          <Link to={`/cost-estimation/${estimation._id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteEstimation(estimation._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/projects')}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  My Projects
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/cost-estimation')}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  New Cost Estimation
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/resource-management')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Resources
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/reports')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Reports
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estimation Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Review Historical Data</p>
                      <p className="text-xs text-muted-foreground">
                        Use past project data for accurate estimates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Include Contingency</p>
                      <p className="text-xs text-muted-foreground">
                        Add 10-15% buffer for unexpected costs
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimationDashboard;
