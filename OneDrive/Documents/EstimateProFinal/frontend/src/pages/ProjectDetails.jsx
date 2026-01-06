import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, MapPin, Clock, DollarSign, Plus, Edit, Trash2, Users, Target, TrendingUp, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { projectApi, taskApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    taskName: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    status: 'todo'
  });

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      console.log('Loading project with ID:', id);
      
      // Get specific project by ID
      const foundProject = await projectApi.getProjectById(id);
      
      if (!foundProject) {
        toast({
          title: 'Project not found',
          description: 'The requested project could not be found',
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Found project:', foundProject);
      setProject(foundProject);
      
      // Load tasks for this project from database
      loadTasks();
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      console.log('Loading tasks for project:', id);
      const projectTasks = await taskApi.getTasksByProject(id);
      console.log('Loaded tasks:', projectTasks);
      setTasks(projectTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    }
  };

  const addTask = async () => {
    if (!newTask.taskName.trim()) {
      toast({
        title: 'Error',
        description: 'Task title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const taskData = {
        projectId: id,
        taskName: newTask.taskName,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        estimatedHours: 0,
        estimatedCost: 0
      };

      console.log('Creating task:', taskData);
      const response = await taskApi.createTask(taskData);
      
      if (response.success) {
        setTasks([...tasks, response.data]);
        setNewTask({
          taskName: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          status: 'todo'
        });
        setShowAddTask(false);
        
        toast({
          title: 'Success',
          description: 'Task added successfully',
        });
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add task',
        variant: 'destructive',
      });
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await taskApi.updateTask(taskId, { status: newStatus });
      
      if (response.data.success) {
        setTasks(tasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        ));
        
        toast({
          title: 'Success',
          description: 'Task status updated',
        });
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await taskApi.deleteTask(taskId);
      
      if (response.data.success) {
        setTasks(tasks.filter(task => task._id !== taskId));
        
        toast({
          title: 'Success',
          description: 'Task deleted',
        });
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Project not found</h1>
            <Link to="/trips">
              <Button>Back to Projects</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <Link to="/projects" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-5 h-5" />
              Back to Projects
            </Link>
            
            <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
              <img
                src={project.coverImage ? `data:${project.coverImage.contentType};base64,${project.coverImage.data.toString('base64')}` : 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop'}
                alt={project.projectName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">{project.projectName}</h1>
                <p className="text-primary-foreground/80">{project.description || 'No description available'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5 text-primary" />
                <span>{new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 text-sage" />
                <span>Multiple destinations</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to={`/project/${project._id}/edit`}>
                <Button variant="accent" className="gap-2">
                  <Edit className="w-5 h-5" />
                  Edit Project
                </Button>
              </Link>
            </div>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <div className="mt-1">
                    <Badge variant={project.priority === 'high' ? 'destructive' : project.priority === 'medium' ? 'default' : 'secondary'}>
                      {project.priority}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Client</label>
                  <div className="mt-1">
                    {project.client?.name || project.client || 'No client specified'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <div className="mt-1">
                    {project.description || 'No description available'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estimated Budget</label>
                  <div className="mt-1 text-2xl font-bold">
                    ${project.estimatedBudget?.toLocaleString() || '0'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actual Cost</label>
                  <div className="mt-1 text-2xl font-bold">
                    ${project.actualCost?.toLocaleString() || '0'}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Budget Variance</label>
                  <div className="mt-1">
                    {project.estimatedBudget && project.actualCost ? (
                      <span className={project.actualCost <= project.estimatedBudget ? 'text-green-600' : 'text-red-600'}>
                        ${((project.estimatedBudget - project.actualCost) || 0).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not available</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Actions */}
          <div className="mt-8 flex gap-3">
            <Link to={`/project/${project._id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Edit className="w-4 h-4" />
                Edit Project
              </Button>
            </Link>
            
            <Link to="/resource-management">
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                Manage Team
              </Button>
            </Link>
            
            <Link to="/reports">
              <Button variant="outline" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                View Reports
              </Button>
            </Link>
          </div>

          {/* Tasks Section */}
          <Card className="mt-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Project Tasks
                </CardTitle>
                <Button onClick={() => setShowAddTask(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddTask && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-4">Add New Task</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Task Title *</label>
                      <Input
                        value={newTask.taskName}
                        onChange={(e) => setNewTask({...newTask, taskName: e.target.value})}
                        placeholder="Enter task title"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                        className="mt-1 w-full p-2 border rounded-md"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={newTask.dueDate}
                        onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        placeholder="Enter task description"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={addTask} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Task
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddTask(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <Circle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first task to get started with project management
                  </p>
                  <Button onClick={() => setShowAddTask(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => updateTaskStatus(task._id, task.status === 'completed' ? 'todo' : 'completed')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {task.taskName}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-sm text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTask(task._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
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

export default ProjectDetails;
