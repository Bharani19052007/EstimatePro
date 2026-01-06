import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { 
  Calculator, 
  Plus, 
  Trash2, 
  Save, 
  DollarSign, 
  Clock, 
  Users, 
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { estimationApi, resourceApi } from "@/services/api";
import CostBreakdown from "@/components/estimation/CostBreakdown";
import ResourceAllocation from "@/components/estimation/ResourceAllocation";
import TimelineEstimation from "@/components/estimation/TimelineEstimation";

const CostEstimation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  console.log('CostEstimation - Current URL:', window.location.href);
  console.log('CostEstimation - ID from params:', id);
  console.log('CostEstimation - Full params object:', useParams());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [projectData, setProjectData] = useState({
    projectName: '',
    client: '',
    description: '',
    category: '',
    priority: 'medium',
    estimatedDuration: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    teamSize: 1,
    notes: ''
  });

  const [costBreakdown, setCostBreakdown] = useState([]);

  const [resources, setResources] = useState([]);
  const [timeline, setTimeline] = useState({
    phases: []
  });

  const [totalCost, setTotalCost] = useState(0);
  const [contingency, setContingency] = useState(15);
  const [finalCost, setFinalCost] = useState(0);
  const [riskLevel, setRiskLevel] = useState('medium');

  const loadEstimation = async (id) => {
    if (!id || id === 'undefined' || id === 'null') {
      console.log('Invalid ID provided, skipping estimation load');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Loading estimation with ID:', id);
      const estimation = await estimationApi.getEstimationById(id);
      
      console.log('Raw estimation data from backend:', estimation);
      
      // Transform backend data to frontend format
      const transformedProjectData = {
        projectName: estimation.projectName || '',
        client: estimation.projectId?.client?.name || '',
        description: estimation.notes || '',
        category: 'software', // Default category since it's not stored in estimation
        priority: 'medium', // Default priority since it's not stored in estimation
        estimatedDuration: estimation.timeline?.totalDuration || estimation.teamSize || 1,
        startDate: estimation.timeline?.startDate ? new Date(estimation.timeline.startDate).toISOString().split('T')[0] : '',
        endDate: estimation.timeline?.endDate ? new Date(estimation.timeline.endDate).toISOString().split('T')[0] : '',
        status: estimation.status || 'draft',
        teamSize: estimation.teamSize || 1,
        notes: estimation.notes || ''
      };
      
      console.log('Backend costBreakdown:', estimation.costBreakdown);
      
      // Transform cost breakdown from backend to frontend format
      const transformedCostBreakdown = [];
      if (estimation.costBreakdown && Array.isArray(estimation.costBreakdown)) {
        const groupedByCategory = {};
        
        estimation.costBreakdown.forEach(item => {
          if (!groupedByCategory[item.category]) {
            groupedByCategory[item.category] = {
              id: Object.keys(groupedByCategory).length + 1,
              category: item.category,
              items: []
            };
          }
          
          groupedByCategory[item.category].items.push({
            name: item.description || item.category,
            hours: item.hours || 0,
            rate: item.rate || 0,
            total: item.estimatedCost || 0,
            quantity: item.quantity || 0,
            unitCost: item.unitCost || 0,
            months: item.months || 0,
            monthlyCost: item.monthlyCost || 0
          });
        });
        
        transformedCostBreakdown.push(...Object.values(groupedByCategory));
      }
      
      console.log('Transformed costBreakdown:', transformedCostBreakdown);
      
      setProjectData(transformedProjectData);
      setCostBreakdown(transformedCostBreakdown);
      setResources(estimation.resources || []);
      setTimeline(estimation.timeline || { phases: [] });
      setContingency(estimation.contingency || 15);
      setRiskLevel(estimation.riskLevel || 'medium');
      
      // Set the actual cost values from backend
      setTotalCost(estimation.totalCost || 0);
      setFinalCost(estimation.finalCost || 0);
      
      console.log('Loaded estimation data:', {
        totalCost: estimation.totalCost,
        finalCost: estimation.finalCost,
        costBreakdownItems: transformedCostBreakdown.length,
        contingency: estimation.contingency
      });
    } catch (error) {
      console.error('Error loading estimation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load estimation data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadResources = async () => {
    try {
      const resourcesData = await resourceApi.getAllResources();
      
      // If no resources exist, seed default resources
      if (!resourcesData || resourcesData.length === 0) {
        console.log('No resources found, seeding default resources...');
        await resourceApi.seedResources();
        // Load the newly created resources
        const seededResources = await resourceApi.getAllResources();
        setResources(seededResources || []);
      } else {
        setResources(resourcesData);
      }
    } catch (error) {
      console.error('Error loading resources:', error);
      // Set empty array to prevent errors
      setResources([]);
    }
  };

  const calculateTotals = () => {
    let total = 0;
    costBreakdown.forEach(category => {
      category.items.forEach(item => {
        total += item.total || 0;
      });
    });
    const contingencyAmount = (total * contingency) / 100;
    const final = total + contingencyAmount;
    
    setTotalCost(total);
    setFinalCost(final);
  };

  useEffect(() => {
    loadResources();
    
    if (id && id !== 'undefined' && id !== 'null') {
      console.log('ID exists, loading estimation:', id);
      loadEstimation(id);
    } else {
      console.log('No ID provided, creating new estimation');
    }
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [costBreakdown, contingency]);

  const handleProjectDataChange = (field, value) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEstimation = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to save estimations",
        variant: "destructive",
      });
      return;
    }

    if (!projectData.projectName) {
      toast({
        title: "Validation Error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const estimationData = {
        projectName: projectData.projectName,
        client: projectData.client,
        description: projectData.description,
        costBreakdown,
        resources,
        timeline,
        contingency,
        totalCost,
        finalCost,
        status: projectData.status || 'draft',
        duration: projectData.estimatedDuration || 1,
        teamSize: projectData.teamSize || 1,
        riskLevel,
        createdBy: user._id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectId: id || null
      };

      if (id) {
        console.log('Updating estimation with data:', estimationData);
        await estimationApi.updateEstimation(id, estimationData);
        toast({
          title: "Success",
          description: "Estimation updated successfully",
        });
      } else {
        await estimationApi.createEstimation(estimationData);
        toast({
          title: "Success", 
          description: "Estimation saved successfully",
        });
      }

      navigate('/dashboard?tab=estimations');
    } catch (error) {
      console.error('Error saving estimation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save estimation",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {id ? 'Edit Estimation' : 'Create Cost Estimation'}
            </h1>
            <p className="text-muted-foreground mt-2">
              Calculate detailed project costs and resource requirements
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/estimation-dashboard')}>
              Cancel
            </Button>
            <Button onClick={handleSaveEstimation} disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Estimation
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Project Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
            <CardDescription>
              Basic details about the project being estimated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectData.projectName}
                  onChange={(e) => handleProjectDataChange('projectName', e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={projectData.client}
                  onChange={(e) => handleProjectDataChange('client', e.target.value)}
                  placeholder="Enter client name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={projectData.category} onValueChange={(value) => handleProjectDataChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="software">Software Development</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={projectData.priority} onValueChange={(value) => handleProjectDataChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="riskLevel">Risk Level</Label>
                <Select value={riskLevel} onValueChange={setRiskLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select risk level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimatedDuration">Estimated Duration (weeks)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={projectData.estimatedDuration}
                  onChange={(e) => handleProjectDataChange('estimatedDuration', e.target.value)}
                  placeholder="Enter duration in weeks"
                />
              </div>
              <div>
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  value={projectData.teamSize || 1}
                  onChange={(e) => handleProjectDataChange('teamSize', parseInt(e.target.value) || 1)}
                  placeholder="Enter team size"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={projectData.status} onValueChange={(value) => handleProjectDataChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={projectData.startDate}
                  onChange={(e) => handleProjectDataChange('startDate', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={projectData.description}
                  onChange={(e) => handleProjectDataChange('description', e.target.value)}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={projectData.notes}
                  onChange={(e) => handleProjectDataChange('notes', e.target.value)}
                  placeholder="Enter additional notes (max 1000 characters)"
                  rows={2}
                  maxLength={1000}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Estimation Tabs */}
        <Tabs defaultValue="cost-breakdown" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cost-breakdown">Cost Breakdown</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="cost-breakdown">
            <CostBreakdown 
              costBreakdown={costBreakdown}
              setCostBreakdown={setCostBreakdown}
              totalCost={totalCost}
              contingency={contingency}
              setContingency={setContingency}
              finalCost={finalCost}
            />
          </TabsContent>

          <TabsContent value="resources">
            <ResourceAllocation 
              resources={resources}
              setResources={setResources}
              costBreakdown={costBreakdown}
            />
          </TabsContent>

          <TabsContent value="timeline">
            <TimelineEstimation 
              timeline={timeline}
              setTimeline={setTimeline}
              projectData={projectData}
            />
          </TabsContent>
        </Tabs>

        {/* Summary Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Estimation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Base Cost</Label>
                <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Contingency ({contingency}%)</Label>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(totalCost * contingency / 100)}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Final Estimated Cost</Label>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(finalCost)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CostEstimation;
