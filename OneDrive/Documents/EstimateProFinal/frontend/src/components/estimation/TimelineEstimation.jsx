import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Edit, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Timer
} from "lucide-react";

const TimelineEstimation = ({ timeline, setTimeline, projectData }) => {
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [criticalPath, setCriticalPath] = useState([]);

  useEffect(() => {
    calculateCriticalPath();
  }, [timeline]);

  const calculateCriticalPath = () => {
    // Simple critical path calculation
    const path = [];
    let currentPhase = timeline.phases.find(phase => phase.dependencies.length === 0);
    
    while (currentPhase) {
      path.push(currentPhase.name);
      const nextPhaseName = currentPhase.name;
      currentPhase = timeline.phases.find(phase => 
        phase.dependencies.includes(nextPhaseName)
      );
    }
    
    setCriticalPath(path);
  };

  const formatDuration = (weeks) => {
    if (weeks < 1) {
      return `${Math.round(weeks * 7)} days`;
    }
    return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  };

  const calculatePhaseDates = (phase, index) => {
    let startDate = projectData.startDate;
    
    if (index > 0) {
      const previousPhases = timeline.phases.slice(0, index);
      const totalDuration = previousPhases.reduce((sum, prevPhase) => sum + prevPhase.duration, 0);
      startDate = addWeeksToDate(projectData.startDate, totalDuration);
    }
    
    const endDate = addWeeksToDate(startDate, phase.duration);
    
    return { startDate, endDate };
  };

  const addWeeksToDate = (dateString, weeks) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setDate(date.getDate() + (weeks * 7));
    return date.toISOString().split('T')[0];
  };

  const getTotalDuration = () => {
    return timeline.phases.reduce((sum, phase) => sum + phase.duration, 0);
  };

  const addPhase = () => {
    const newPhase = {
      name: 'New Phase',
      duration: 1,
      startDate: '',
      endDate: '',
      dependencies: []
    };
    
    setTimeline({
      ...timeline,
      phases: [...timeline.phases, newPhase]
    });
  };

  const updatePhase = (index, field, value) => {
    const updatedPhases = [...timeline.phases];
    updatedPhases[index] = { ...updatedPhases[index], [field]: value };
    
    // Recalculate dates if duration changed
    if (field === 'duration') {
      updatedPhases.forEach((phase, i) => {
        const dates = calculatePhaseDates(phase, i);
        phase.startDate = dates.startDate;
        phase.endDate = dates.endDate;
      });
    }
    
    setTimeline({ ...timeline, phases: updatedPhases });
  };

  const deletePhase = (index) => {
    if (timeline.phases.length > 1) {
      const updatedPhases = timeline.phases.filter((_, i) => i !== index);
      
      // Remove dependencies on deleted phase
      updatedPhases.forEach(phase => {
        phase.dependencies = phase.dependencies.filter(dep => 
          dep !== timeline.phases[index].name
        );
      });
      
      setTimeline({ ...timeline, phases: updatedPhases });
    }
  };

  const updatePhaseDependencies = (index, dependencies) => {
    const updatedPhases = [...timeline.phases];
    updatedPhases[index].dependencies = dependencies;
    setTimeline({ ...timeline, phases: updatedPhases });
  };

  const getPhaseStatus = (phase) => {
    const now = new Date();
    const startDate = phase.startDate ? new Date(phase.startDate) : null;
    const endDate = phase.endDate ? new Date(phase.endDate) : null;
    
    if (!startDate || !endDate) return 'planned';
    if (now < startDate) return 'planned';
    if (now >= startDate && now <= endDate) return 'in_progress';
    if (now > endDate) return 'completed';
    return 'planned';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgress = (phase) => {
    const status = getPhaseStatus(phase);
    switch (status) {
      case 'completed': return 100;
      case 'in_progress': return 50;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(getTotalDuration())}</div>
            <p className="text-xs text-muted-foreground">
              Project timeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Phases</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeline.phases.length}</div>
            <p className="text-xs text-muted-foreground">
              Project phases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Path</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalPath.length}</div>
            <p className="text-xs text-muted-foreground">
              Critical phases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Est. End Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {projectData.startDate ? addWeeksToDate(projectData.startDate, getTotalDuration()) : 'TBD'}
            </div>
            <p className="text-xs text-muted-foreground">
              Project completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>
                Visual representation of project phases and dependencies
              </CardDescription>
            </div>
            <Button onClick={addPhase}>
              <Plus className="w-4 h-4 mr-2" />
              Add Phase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.phases.map((phase, index) => {
              const dates = calculatePhaseDates(phase, index);
              const status = getPhaseStatus(phase);
              const progress = getProgress(phase);
              const isCritical = criticalPath.includes(phase.name);
              
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{phase.name}</h4>
                      <Badge className={getStatusColor(status)}>
                        {status.replace('_', ' ')}
                      </Badge>
                      {isCritical && (
                        <Badge variant="outline" className="border-red-500 text-red-500">
                          Critical Path
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePhase(index)}
                        disabled={timeline.phases.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <Label>Phase Name</Label>
                      <Input
                        value={phase.name}
                        onChange={(e) => updatePhase(index, 'name', e.target.value)}
                        placeholder="Enter phase name"
                      />
                    </div>
                    
                    <div>
                      <Label>Duration (weeks)</Label>
                      <Input
                        type="number"
                        value={phase.duration}
                        onChange={(e) => updatePhase(index, 'duration', parseFloat(e.target.value) || 1)}
                        placeholder="1"
                        min="0.5"
                        step="0.5"
                      />
                    </div>
                    
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={dates.startDate}
                        onChange={(e) => updatePhase(index, 'startDate', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={dates.endDate}
                        onChange={(e) => updatePhase(index, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Dependencies */}
                  <div className="mb-4">
                    <Label>Dependencies</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {timeline.phases.map((depPhase, depIndex) => (
                        depIndex !== index && (
                          <Badge
                            key={depIndex}
                            variant={phase.dependencies.includes(depPhase.name) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const currentDeps = phase.dependencies || [];
                              const newDeps = currentDeps.includes(depPhase.name)
                                ? currentDeps.filter(dep => dep !== depPhase.name)
                                : [...currentDeps, depPhase.name];
                              updatePhaseDependencies(index, newDeps);
                            }}
                          >
                            {depPhase.name}
                          </Badge>
                        )
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click phases to add/remove dependencies
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Visual Timeline */}
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="w-4 h-4" />
                      <span>{formatDuration(phase.duration)}</span>
                      {dates.startDate && dates.endDate && (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>{dates.startDate} to {dates.endDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Critical Path Visualization */}
      {criticalPath.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Critical Path</CardTitle>
            <CardDescription>
              The sequence of dependent phases that determines the project's minimum duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {criticalPath.map((phaseName, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="outline" className="border-red-500 text-red-500">
                    {phaseName}
                  </Badge>
                  {index < criticalPath.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-red-500" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Total critical path duration: {formatDuration(
                criticalPath.reduce((sum, phaseName) => {
                  const phase = timeline.phases.find(p => p.name === phaseName);
                  return sum + (phase?.duration || 0);
                }, 0)
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimelineEstimation;
