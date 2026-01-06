import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Plus, Briefcase, Loader2, Grid, List, GitBranch, Calendar, Clock, Eye, Edit, Trash2, BarChart3, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { ProjectCard } from "@/components/ProjectCard";
import { projectApi } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', or 'timeline'

  // Fetch user projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?._id) return;
      
      try {
        setIsLoading(true);
        const userProjects = await projectApi.getProjectsByUser(user._id);
        setProjects(userProjects || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your projects',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const hasProjects = projects.length > 0;

  const handleDeleteProject = async (projectId) => {
    try {
      await projectApi.deleteProject(projectId);
      setProjects(projects.filter(project => project._id !== projectId));
      toast({
        title: 'Project deleted',
        description: 'Your project has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    }
  };

  const renderProjectCard = (project, index) => {
    const commonProps = {
      id: project._id,
      name: project.projectName,
      startDate: new Date(project.startDate).toLocaleDateString(),
      endDate: new Date(project.endDate).toLocaleDateString(),
      status: project.status,
      priority: project.priority,
      budget: project.estimatedBudget,
      imageUrl: project.coverImage ? `data:${project.coverImage.contentType};base64,${project.coverImage.data.toString('base64')}` : 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      onEdit: () => navigate(`/project/${project._id}/edit`),
      onDelete: () => handleDeleteProject(project._id),
    };

    return (
      <div
        key={project._id}
        className={viewMode === 'grid' ? 'animate-slide-up' : ''}
        style={viewMode === 'grid' ? { animationDelay: `${0.1 + index * 0.1}s` } : {}}
      >
        <ProjectCard {...commonProps} />
      </div>
    );
  };

  const renderListView = () => (
    <div className="space-y-4">
      {projects.map((project, index) => {
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);
        const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        return (
          <div key={project._id} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={project.coverImage ? `data:${project.coverImage.contentType};base64,${project.coverImage.data.toString('base64')}` : 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop'}
                    alt={project.projectName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{project.projectName}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{duration} days</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="capitalize">{project.status}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link to={`/project/${project._id}`} className="flex-1">
                  <Button variant="default" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => navigate(`/project/${project._id}/edit`)} className="gap-2">
                  <Edit className="w-4 h-4" />
                </Button>
                <Link to="/resource-management">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Users className="w-4 h-4" />
                    Manage Team
                  </Button>
                </Link>
                <Link to="/reports">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    View Reports
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project._id)} className="gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTimelineView = () => {
    const sortedProjects = [...projects].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    return (
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
        
        <div className="space-y-8">
          {sortedProjects.map((project, index) => {
            const startDate = new Date(project.startDate);
            const endDate = new Date(project.endDate);
            const isPast = endDate < new Date();
            const isCurrent = startDate <= new Date() && endDate >= new Date();
            const isFuture = startDate > new Date();
            
            return (
              <div key={project._id} className="relative flex items-start gap-6">
                {/* Timeline dot */}
                <div className="relative z-10">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    isPast ? 'bg-muted border-muted-foreground' :
                    isCurrent ? 'bg-primary border-primary' :
                    'bg-accent border-accent'
                  }`}></div>
                </div>
                
                {/* Project card */}
                <div className={`flex-1 bg-card border rounded-lg p-6 hover:shadow-md transition-shadow ${
                  isCurrent ? 'border-primary shadow-sm' : ''
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={project.coverImage ? `data:${project.coverImage.contentType};base64,${project.coverImage.data.toString('base64')}` : 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop'}
                          alt={project.projectName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{project.projectName}</h3>
                          {isCurrent && (
                            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">Active</span>
                          )}
                          {isPast && (
                            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">Completed</span>
                          )}
                          {isFuture && (
                            <span className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full">Planned</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link to={`/project/${project._id}`} className="flex-1">
                        <Button variant="default" size="sm" className="gap-2">
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/project/${project._id}/edit`)} className="gap-2">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Link to="/resource-management">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Users className="w-4 h-4" />
                          Manage Team
                        </Button>
                      </Link>
                      <Link to="/reports">
                        <Button variant="outline" size="sm" className="gap-2">
                          <FileText className="w-4 h-4" />
                          View Reports
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteProject(project._id)} className="gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <section className="mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  My Projects
                </h1>
                <p className="text-muted-foreground">
                  Manage and view all your project estimations
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="gap-2"
                  >
                    <Grid className="w-4 h-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="gap-2"
                  >
                    <List className="w-4 h-4" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                  <Button
                    variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('timeline')}
                    className="gap-2"
                  >
                    <GitBranch className="w-4 h-4" />
                    <span className="hidden sm:inline">Timeline</span>
                  </Button>
                </div>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/estimation-dashboard')}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Estimation Dashboard
                </Button>
                
                <Link to="/create-project">
                  <Button variant="accent" size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    Create New Project
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Projects Display */}
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : hasProjects ? (
            <>
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(renderProjectCard)}
                </div>
              )}
              {viewMode === 'list' && renderListView()}
              {viewMode === 'timeline' && renderTimelineView()}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
              <div className="w-24 h-24 rounded-full bg-sky-light flex items-center justify-center mb-6">
                <Briefcase className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                No projects yet
              </h2>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                Start planning your first project! Create a project to organize tasks, estimates, and budget.
              </p>
              <Link to="/create-project">
                <Button variant="accent" size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Projects;
