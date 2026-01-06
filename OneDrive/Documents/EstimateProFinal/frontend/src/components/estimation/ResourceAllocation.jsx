import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Clock, 
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Settings,
  TrendingUp,
  ListTodo,
  Target
} from "lucide-react";
import { resourceApi, taskApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const ResourceAllocation = ({ resources, setResources, costBreakdown }) => {
  const { toast } = useToast();
  const [allocations, setAllocations] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [allocationForm, setAllocationForm] = useState({
    resourceId: '',
    projectId: '',
    allocationPercentage: 100,
    startDate: '',
    endDate: '',
    role: ''
  });
  const [resourceForm, setResourceForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'developer',
    availability: 'available',
    hourlyRate: 0,
    experience: 0,
    skills: [],
    currentProject: '',
    notes: ''
  });
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    estimatedHours: 0,
    dueDate: '',
    projectId: '',
    assignedResources: []
  });

  useEffect(() => {
    // Initialize allocations from cost breakdown labor items
    const laborCategory = costBreakdown.find(cat => cat.category.toLowerCase() === 'labor');
    if (laborCategory) {
      const initialAllocations = laborCategory.items.map(item => ({
        id: Date.now() + Math.random(),
        resourceName: item.name,
        role: item.name,
        hours: item.hours,
        rate: item.rate,
        totalCost: item.total,
        allocationPercentage: 100,
        status: 'planned'
      }));
      setAllocations(initialAllocations);
    }
  }, [costBreakdown]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'allocated': return 'bg-green-100 text-green-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'overallocated': return 'bg-red-100 text-red-800';
      case 'underutilized': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const addAllocation = () => {
    if (!allocationForm.resourceId || !allocationForm.projectId) return;

    const resource = resources.find(r => r._id === allocationForm.resourceId);
    if (!resource) return;

    const newAllocation = {
      id: Date.now(),
      resourceId: allocationForm.resourceId,
      resourceName: resource.name,
      projectId: allocationForm.projectId,
      role: allocationForm.role,
      allocationPercentage: allocationForm.allocationPercentage,
      startDate: allocationForm.startDate,
      endDate: allocationForm.endDate,
      unitCost: resource.hourlyRate || resource.unitCost,
      status: 'planned'
    };

    setAllocations([...allocations, newAllocation]);
    setAllocationForm({
      resourceId: '',
      projectId: '',
      allocationPercentage: 100,
      startDate: '',
      endDate: '',
      role: ''
    });
  };

  const createResource = async () => {
    try {
      const newResource = await resourceApi.createResource(resourceForm);
      setResources([...resources, newResource]);
      setIsCreateDialogOpen(false);
      setResourceForm({
        name: '',
        email: '',
        phone: '',
        role: 'developer',
        availability: 'available',
        hourlyRate: 0,
        experience: 0,
        skills: [],
        currentProject: '',
        notes: ''
      });
      toast({
        title: "Success",
        description: "Resource created successfully",
      });
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: "Error",
        description: "Failed to create resource: " + error.message,
        variant: "destructive",
      });
    }
  };

  const updateResource = async () => {
    if (!editingResource) return;
    
    try {
      const updatedResource = await resourceApi.updateResource(editingResource._id, resourceForm);
      setResources(resources.map(r => r._id === editingResource._id ? updatedResource : r));
      setEditingResource(null);
      setResourceForm({
        name: '',
        email: '',
        phone: '',
        role: 'developer',
        availability: 'available',
        hourlyRate: 0,
        experience: 0,
        skills: [],
        currentProject: '',
        notes: ''
      });
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: "Failed to update resource: " + error.message,
        variant: "destructive",
      });
    }
  };

  const deleteResource = async (resourceId) => {
    try {
      await resourceApi.deleteResource(resourceId);
      setResources(resources.filter(r => r._id !== resourceId));
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const startEditResource = (resource) => {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name,
      email: resource.email || '',
      phone: resource.phone || '',
      role: resource.role || 'developer',
      availability: resource.availability || 'available',
      hourlyRate: resource.hourlyRate || 0,
      experience: resource.experience || 0,
      skills: resource.skills || [],
      currentProject: resource.currentProject || '',
      notes: resource.notes || ''
    });
  };

  const updateAllocation = (allocationId, field, value) => {
    setAllocations(allocations.map(alloc => 
      alloc.id === allocationId ? { ...alloc, [field]: value } : alloc
    ));
  };

  const deleteAllocation = (allocationId) => {
    setAllocations(allocations.filter(alloc => alloc.id !== allocationId));
  };

  // Task management functions
  const createTask = async () => {
    if (!taskForm.title || !taskForm.projectId) {
      toast({
        title: "Error",
        description: "Task title and project are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const taskData = {
        ...taskForm,
        taskName: taskForm.title, // Backend expects taskName, not title
        status: 'pending',
        estimatedHours: taskForm.estimatedHours || 0,
      };

      const createdTask = await taskApi.createTask(taskData);
      
      setTasks([...tasks, createdTask]);
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        estimatedHours: 0,
        dueDate: '',
        projectId: '',
        assignedResources: []
      });
      setIsTaskDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Task created successfully",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task: " + error.message,
        variant: "destructive",
      });
    }
  };

  const updateTask = (taskId, field, value) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    toast({
      title: "Success",
      description: "Task deleted successfully",
    });
  };

  const assignResourceToTask = (taskId, resourceId) => {
    const task = tasks.find(t => t.id === taskId);
    const resource = resources.find(r => r._id === resourceId);
    
    if (!task || !resource) return;

    const updatedAssignedResources = task.assignedResources.includes(resourceId)
      ? task.assignedResources.filter(id => id !== resourceId)
      : [...task.assignedResources, resourceId];

    updateTask(taskId, 'assignedResources', updatedAssignedResources);
    
    toast({
      title: "Success", 
      description: `${resource.name} ${task.assignedResources.includes(resourceId) ? 'unassigned from' : 'assigned to'} task`,
    });
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailableResources = () => {
    return resources.filter(resource => 
      calculateResourceUtilization(resource._id) < 100 && 
      (resource.availability === 'available' || resource.availability === true)
    );
  };

  const calculateResourceUtilization = (resourceId) => {
    const resourceAllocations = allocations.filter(alloc => alloc.resourceId === resourceId);
    return resourceAllocations.reduce((sum, alloc) => sum + (alloc.allocationPercentage || 0), 0);
  };

  const getTotalAllocatedCost = () => {
    return allocations.reduce((sum, alloc) => {
      const resource = resources.find(r => r._id === alloc.resourceId);
      if (!resource) return sum;
      
      // Calculate duration in weeks (simplified)
      const weeks = 4; // Default to 4 weeks if no dates specified
      const hoursPerWeek = 40;
      const totalHours = weeks * hoursPerWeek * (alloc.allocationPercentage / 100);
      // Use hourlyRate for team members, unitCost for other resources
      const rate = resource.hourlyRate || resource.unitCost || 0;
      return sum + (totalHours * rate);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {/* Allocation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allocations.length}</div>
            <p className="text-xs text-muted-foreground">
              Active resource assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalAllocatedCost())}</div>
            <p className="text-xs text-muted-foreground">
              Total resource cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resources.length > 0 
                ? Math.round(
                    resources.reduce((sum, resource) => {
                      const utilization = calculateResourceUtilization(resource.id);
                      return sum + Math.min(utilization, 100);
                    }, 0) / resources.length
                  )
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Average team utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Allocation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Resource Allocation</CardTitle>
          <CardDescription>
            Assign team members to projects and tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Resource</Label>
              <Select 
                value={allocationForm.resourceId} 
                onValueChange={(value) => setAllocationForm({...allocationForm, resourceId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableResources().map((resource) => (
                    <SelectItem key={resource._id} value={resource._id}>
                      {resource.name} - {resource.role || resource.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Project/Task</Label>
              <Input
                value={allocationForm.projectId}
                onChange={(e) => setAllocationForm({...allocationForm, projectId: e.target.value})}
                placeholder="Enter project or task name"
              />
            </div>
            
            <div>
              <Label>Allocation %</Label>
              <Input
                type="number"
                value={allocationForm.allocationPercentage}
                onChange={(e) => setAllocationForm({...allocationForm, allocationPercentage: parseInt(e.target.value) || 0})}
                placeholder="100"
                min="1"
                max="100"
              />
            </div>
            
            <div>
              <Label>Role</Label>
              <Input
                value={allocationForm.role}
                onChange={(e) => setAllocationForm({...allocationForm, role: e.target.value})}
                placeholder="e.g., Lead Developer"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={allocationForm.startDate}
                onChange={(e) => setAllocationForm({...allocationForm, startDate: e.target.value})}
              />
            </div>
            
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={allocationForm.endDate}
                onChange={(e) => setAllocationForm({...allocationForm, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <Button onClick={addAllocation} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Allocation
          </Button>
        </CardContent>
      </Card>

      {/* Resource Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resource Management</CardTitle>
              <CardDescription>
                Manage your team resources and equipment
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Resource</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={resourceForm.name}
                      onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={resourceForm.email}
                      onChange={(e) => setResourceForm({...resourceForm, email: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={resourceForm.phone}
                      onChange={(e) => setResourceForm({...resourceForm, phone: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">
                      Role
                    </Label>
                    <Select value={resourceForm.role} onValueChange={(value) => setResourceForm({...resourceForm, role: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="consultant">Consultant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="hourlyRate" className="text-right">
                      Hourly Rate
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={resourceForm.hourlyRate}
                      onChange={(e) => setResourceForm({...resourceForm, hourlyRate: parseFloat(e.target.value) || 0})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="experience" className="text-right">
                      Experience (years)
                    </Label>
                    <Input
                      id="experience"
                      type="number"
                      value={resourceForm.experience}
                      onChange={(e) => setResourceForm({...resourceForm, experience: parseInt(e.target.value) || 0})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="availability" className="text-right">
                      Availability
                    </Label>
                    <Select value={resourceForm.availability} onValueChange={(value) => setResourceForm({...resourceForm, availability: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={resourceForm.notes}
                      onChange={(e) => setResourceForm({...resourceForm, notes: e.target.value})}
                      className="col-span-3"
                      placeholder="Additional notes about this resource"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createResource}>Create Resource</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resources.map((resource) => {
              const utilization = calculateResourceUtilization(resource._id);
              
              return (
                <div key={resource._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{resource.name}</h4>
                      <Badge variant="outline">{resource.role || resource.type}</Badge>
                      <Badge className={
                        utilization >= 90 ? 'bg-red-100 text-red-800' :
                        utilization >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {utilization}% allocated
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>Cost: {formatCurrency(resource.hourlyRate || resource.unitCost)}</span>
                      <span>•</span>
                      <span>Available: {resource.availability === 'available' || resource.availability === true ? 'Yes' : 'No'}</span>
                      {resource.notes && (
                        <>
                          <span>•</span>
                          <span>{resource.notes}</span>
                        </>
                      )}
                    </div>
                    <div className="w-full">
                      <Progress value={Math.min(utilization, 100)} className="h-2" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditResource(resource)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteResource(resource._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Allocations */}
      <Card>
        <CardHeader>
          <CardTitle>Current Allocations</CardTitle>
          <CardDescription>
            All active and planned resource assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No allocations yet</h3>
              <p className="text-muted-foreground mb-4">
                Assign team members to projects to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allocations.map((allocation) => {
                const resource = resources.find(r => r._id === allocation.resourceId);
                
                return (
                  <div key={allocation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{allocation.resourceName}</h4>
                        <Badge className={getStatusColor(allocation.status)}>
                          {allocation.status}
                        </Badge>
                        <Badge variant="outline">{allocation.role}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Project: {allocation.projectId}</span>
                        <span>•</span>
                        <span>Allocation: {allocation.allocationPercentage}%</span>
                        <span>•</span>
                        <span>Cost: {formatCurrency(resource?.hourlyRate || resource?.unitCost || 0)}</span>
                        {allocation.startDate && allocation.endDate && (
                          <>
                            <span>•</span>
                            <span>{allocation.startDate} to {allocation.endDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={allocation.status} 
                        onValueChange={(value) => updateAllocation(allocation.id, 'status', value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planned">Planned</SelectItem>
                          <SelectItem value="allocated">Allocated</SelectItem>
                          <SelectItem value="overallocated">Overallocated</SelectItem>
                          <SelectItem value="underutilized">Underutilized</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAllocation(allocation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Create and assign tasks to available resources
              </CardDescription>
            </div>
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Task Title
                    </Label>
                    <Input
                      id="title"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                      className="col-span-3"
                      placeholder="Enter task title"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                      className="col-span-3"
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priority" className="text-right">
                      Priority
                    </Label>
                    <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({...taskForm, priority: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="estimatedHours" className="text-right">
                      Est. Hours
                    </Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      value={taskForm.estimatedHours}
                      onChange={(e) => setTaskForm({...taskForm, estimatedHours: parseFloat(e.target.value) || 0})}
                      className="col-span-3"
                      placeholder="0"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dueDate" className="text-right">
                      Due Date
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="projectId" className="text-right">
                      Project
                    </Label>
                    <Input
                      id="projectId"
                      value={taskForm.projectId}
                      onChange={(e) => setTaskForm({...taskForm, projectId: e.target.value})}
                      className="col-span-3"
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="assignedResources" className="text-right">
                      Assign Resources
                    </Label>
                    <div className="col-span-3 space-y-2">
                      {getAvailableResources().map((resource) => (
                        <div key={resource._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={resource._id}
                            checked={taskForm.assignedResources.includes(resource._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setTaskForm({...taskForm, assignedResources: [...taskForm.assignedResources, resource._id]});
                              } else {
                                setTaskForm({...taskForm, assignedResources: taskForm.assignedResources.filter(id => id !== resource._id)});
                              }
                            }}
                          />
                          <Label htmlFor={resource._id} className="text-sm font-normal">
                            {resource.name} - {resource.role || resource.type} ({formatCurrency(resource.hourlyRate || resource.unitCost)}/hr)
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTask}>Create Task</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tasks created</h3>
              <p className="text-muted-foreground mb-4">
                Create tasks and assign them to available resources
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{task.title}</h4>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getTaskStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Project: {task.projectId}</span>
                        <span>•</span>
                        <span>Est. Hours: {task.estimatedHours}</span>
                        <span>•</span>
                        <span>Due: {task.dueDate || 'No due date'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Assigned Resources */}
                  <div className="mt-3 pt-3 border-t">
                    <h5 className="text-sm font-medium mb-2">Assigned Resources</h5>
                    {task.assignedResources.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No resources assigned yet</p>
                    ) : (
                      <div className="space-y-2">
                        {task.assignedResources.map((resourceId) => {
                          const resource = resources.find(r => r._id === resourceId);
                          if (!resource) return null;
                          
                          return (
                            <div key={resourceId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{resource.name}</span>
                                <Badge variant="outline">{resource.type}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {formatCurrency(resource.unitCost)}/hr
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => assignResourceToTask(task.id, resourceId)}
                              >
                                <Target className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceAllocation;
