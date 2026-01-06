import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Eye,
  FileSpreadsheet,
  FileDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { reportsApi } from "@/services/api";
import { toast } from "sonner";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart as ReLineChart,
  Line,
  Legend
} from "recharts";

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('30days');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [reportData, setReportData] = useState({});

  useEffect(() => {
    fetchReports();
    fetchReportData();
  }, [selectedReport, dateRange]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const reportsData = await reportsApi.getAllReports();
      setReports(reportsData || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReportData = async () => {
    try {
      console.log('📊 Fetching report data for user:', user);
      console.log('📊 User ID:', user?._id || user?.id);
      console.log('📊 Request params:', { selectedReport, dateRange });
      const data = await reportsApi.getReportData(selectedReport, dateRange);
      console.log('📊 Received report data:', data);
      
      // Extract actual data from response {success: true, data: {...}}
      const reportData = data.data || data;
      console.log('📊 Final report data for display:', reportData);
      setReportData(reportData || {});
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Set fallback empty data to prevent crashes
      setReportData({});
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const handleGenerateReport = async (reportType, format) => {
    try {
      setIsExporting(true);
      console.log(`Generating ${format} report for ${reportType}`);
      
      const report = await reportsApi.generateReport(reportType, dateRange, format);
      console.log('Report generated successfully:', report);
      
      let mimeType, fileExtension, fileName;
      
      switch (format) {
        case 'csv':
          mimeType = 'text/csv';
          fileExtension = 'csv';
          fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
          break;
        case 'excel':
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;
        case 'pdf':
          mimeType = 'application/pdf';
          fileExtension = 'pdf';
          fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
        default:
          mimeType = 'text/plain';
          fileExtension = 'txt';
          fileName = `${reportType}-report-${new Date().toISOString().split('T')[0]}.txt`;
      }
      
      // Create download link
      const blob = new Blob([report], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      toast.success(`${format.toUpperCase()} report downloaded successfully!`);
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(`Failed to generate ${format.toUpperCase()} report. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Get data from database or fallback to empty array
  const projectCostsData = reportData.projectCostsOverTime || [];

  const resourceUtilizationData = reportData.resourceAllocation || [
    { name: 'Development', value: 35, fill: '#3b82f6' },
    { name: 'Design', value: 20, fill: '#8b5cf6' },
    { name: 'Management', value: 25, fill: '#f59e0b' },
    { name: 'Testing', value: 20, fill: '#10b981' }
  ];

  const projectStatusData = reportData.projectStatus || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Generate insights and reports from your project estimations
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="txt">Text</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => handleGenerateReport(selectedReport, exportFormat)}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Report Type Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Report Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant={selectedReport === 'overview' ? 'default' : 'outline'}
                onClick={() => setSelectedReport('overview')}
                className="justify-start"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </Button>
              <Button
                variant={selectedReport === 'financial' ? 'default' : 'outline'}
                onClick={() => setSelectedReport('financial')}
                className="justify-start"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Financial
              </Button>
              <Button
                variant={selectedReport === 'resources' ? 'default' : 'outline'}
                onClick={() => setSelectedReport('resources')}
                className="justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                Resources
              </Button>
              <Button
                variant={selectedReport === 'projects' ? 'default' : 'outline'}
                onClick={() => setSelectedReport('projects')}
                className="justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Projects
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overview Report */}
        {selectedReport === 'overview' && (
          <div className="space-y-8">
            {/* Quick Export Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Export Actions</CardTitle>
                <CardDescription>
                  Export this report in different formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateReport('overview', 'pdf')}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Export as PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateReport('overview', 'excel')}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export as Excel
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateReport('overview', 'csv')}
                    disabled={isExporting}
                    className="flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Export as CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(reportData.totalRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.activeProjects || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.teamMembers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    2 new this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Project Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(reportData.avgProjectValue || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    +5% from last period
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Project Costs Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ReLineChart data={projectCostsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="costs" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Costs"
                      />
                    </ReLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={resourceUtilizationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {resourceUtilizationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Financial Report */}
        {selectedReport === 'financial' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={projectCostsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="costs" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Profitability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Website Redesign', revenue: 25000, cost: 18000, profit: 7000 },
                      { name: 'Mobile App', revenue: 45000, cost: 32000, profit: 13000 },
                      { name: 'E-commerce Platform', revenue: 35000, cost: 28000, profit: 7000 },
                      { name: 'API Integration', revenue: 15000, cost: 10000, profit: 5000 }
                    ].map((project, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Revenue: {formatCurrency(project.revenue)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(project.profit)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((project.profit / project.revenue) * 100)}% margin
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Resources Report */}
        {selectedReport === 'resources' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(reportData.teamPerformance || []).map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.projects} projects • {member.hours} hours
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{member.efficiency}%</div>
                          <div className="text-xs text-muted-foreground">Efficiency</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={resourceUtilizationData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {resourceUtilizationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Projects Report */}
        {selectedReport === 'projects' && (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {projectStatusData.map((status, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold mb-2">{status.count}</div>
                      <div className="text-sm font-medium mb-2">{status.status}</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${status.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {status.percentage}% of total
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'E-commerce Platform', status: 'completed', budget: 35000, actual: 32000 },
                    { name: 'Mobile Banking App', status: 'in_progress', budget: 45000, actual: 38000 },
                    { name: 'CRM System', status: 'planning', budget: 28000, actual: 0 },
                    { name: 'Website Redesign', status: 'completed', budget: 15000, actual: 16000 }
                  ].map((project, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Budget: {formatCurrency(project.budget)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          project.status === 'completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <div className="text-sm mt-1">
                          Actual: {formatCurrency(project.actual)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
