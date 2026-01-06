import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MapPin, Calendar, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { projectApi } from '@/services/api';
import TimelineComponent from './Timeline';

const ItineraryBuilder = ({ projectId, project }) => {
  const [stops, setStops] = useState([]);
  const [activities, setActivities] = useState({});
  const [totalCost, setTotalCost] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);
  const [viewMode, setViewMode] = useState('timeline');
  const { toast } = useToast();

  // Form states
  const [stopForm, setStopForm] = useState({
    taskName: '',
    startDate: '',
    endDate: ''
  });

  const [activityForm, setActivityForm] = useState({
    name: '',
    cost: ''
  });

  useEffect(() => {
    if (projectId) {
      loadItinerary();
    }
  }, [projectId]);

  // Calculate total cost whenever activities change
  useEffect(() => {
    const calculateTotalCost = () => {
      console.log('Calculating total cost with activities:', activities);
      let total = 0;
      Object.values(activities).forEach(stopActivities => {
        console.log('Processing stop activities:', stopActivities);
        stopActivities.forEach(activity => {
          console.log('Processing activity:', activity);
          if (activity.cost && !isNaN(activity.cost)) {
            total += parseFloat(activity.cost);
            console.log('Added cost:', activity.cost, 'Total now:', total);
          }
        });
      });
      console.log('Final total cost:', total);
      setTotalCost(total);
    };
    calculateTotalCost();
  }, [activities]);

  // Helper function to safely format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  // Helper function to calculate total days safely
  const calculateTotalDays = () => {
    if (stops.length === 0) return 0;
    
    const validDates = stops
      .map(stop => ({
        start: new Date(stop.startDate),
        end: new Date(stop.endDate)
      }))
      .filter(({ start, end }) => !isNaN(start.getTime()) && !isNaN(end.getTime()));
    
    if (validDates.length === 0) return 0;
    
    const minDate = new Date(Math.min(...validDates.map(d => d.start)));
    const maxDate = new Date(Math.max(...validDates.map(d => d.end)));
    
    return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;
  };

  const loadItinerary = async () => {
    try {
      setIsLoading(true);
      const stopsData = await projectApi.getTasksByProject(projectId);
      setStops(stopsData);

      // Load activities for each stop
      const activitiesData = {};
      for (const stop of stopsData) {
        const stopActivities = await projectApi.getActivitiesByTask(stop._id);
        activitiesData[stop._id] = stopActivities;
      }
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading itinerary:', error);
      toast({
        title: 'Error',
        description: 'Failed to load itinerary',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStop = async () => {
    try {
      const stopData = {
        ...stopForm,
        tripId: projectId,
        startDate: new Date(stopForm.startDate),
        endDate: new Date(stopForm.endDate)
      };

      const newStop = await projectApi.createTask(stopData);
      setStops([...stops, newStop.data.data]);
      
      // Reset form
      setStopForm({ taskName: '', startDate: '', endDate: '' });
      setIsAddStopOpen(false);
      
      toast({
        title: 'Task added',
        description: `${stopForm.taskName} has been added to your project`,
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error',
        description: 'Failed to add task',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStop = async (stopId) => {
    try {
      await projectApi.deleteTask(stopId);
      
      // Update stops state
      const updatedStops = stops.filter(stop => stop._id !== stopId);
      setStops(updatedStops);
      
      // Remove activities associated with the deleted stop
      const updatedActivities = { ...activities };
      delete updatedActivities[stopId];
      setActivities(updatedActivities);
      
      toast({
        title: 'Task deleted',
        description: 'Task and its activities have been removed from your project',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const handleAddActivity = (stopId) => {
    console.log('handleAddActivity called with stopId:', stopId);
    setSelectedStop(stopId);
    setIsAddActivityOpen(true);
    setActivityForm({ name: '', cost: '' });
    console.log('isAddActivityOpen set to true');
  };

  const handleCreateActivity = async () => {
    if (!selectedStop) return;

    try {
      const activityData = {
        stopId: selectedStop,
        activityName: activityForm.name,
        cost: activityForm.cost ? parseFloat(activityForm.cost) : 0,
        day: new Date() // Use current date as default
      };

      const newActivity = await projectApi.createActivity(activityData);
      
      // Update activities state
      const updatedActivities = { ...activities };
      if (!updatedActivities[selectedStop]) {
        updatedActivities[selectedStop] = [];
      }
      updatedActivities[selectedStop].push(newActivity.data.data);
      setActivities(updatedActivities);
      
      // Reset form
      setActivityForm({ name: '', cost: '' });
      setIsAddActivityOpen(false);
      setSelectedStop(null);
      
      toast({
        title: 'Activity added',
        description: `${activityForm.name} has been added to your project`,
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to add activity',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      await projectApi.deleteActivity(activityId);
      
      // Update activities state
      const updatedActivities = { ...activities };
      Object.keys(updatedActivities).forEach(stopId => {
        updatedActivities[stopId] = updatedActivities[stopId].filter(
          activity => activity._id !== activityId
        );
      });
      setActivities(updatedActivities);
      
      toast({
        title: 'Activity deleted',
        description: 'Activity has been removed from your project',
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete activity',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Project Timeline</h2>
          <p className="text-muted-foreground">Plan your tasks and activities</p>
        </div>
        <Button variant="accent" className="gap-2" onClick={() => setIsAddStopOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

      {/* Project Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasks</p>
              <p className="text-2xl font-bold">{stops.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Days</p>
              <p className="text-2xl font-bold">{calculateTotalDays()}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">₹{totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <TimelineComponent 
        stops={stops} 
        activities={activities} 
        onAddActivity={handleAddActivity}
        onDeleteActivity={handleDeleteActivity}
        onDeleteStop={handleDeleteStop}
      />

      {isAddStopOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add New Task</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                  id="taskName"
                  value={stopForm.taskName}
                  onChange={(e) => setStopForm({ ...stopForm, taskName: e.target.value })}
                  placeholder="Enter task name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={stopForm.startDate}
                    onChange={(e) => setStopForm({ ...stopForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={stopForm.endDate}
                    onChange={(e) => setStopForm({ ...stopForm, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddStopOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStop}>Add Task</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {console.log('Modal state - isAddActivityOpen:', isAddActivityOpen)}
      {isAddActivityOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {console.log('Modal is rendering!')}
          <div className="bg-background p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add New Activity</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="activityName">Activity Name</Label>
                <Input
                  id="activityName"
                  value={activityForm.name}
                  onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })}
                  placeholder="Enter activity name"
                />
              </div>
              <div>
                <Label htmlFor="activityCost">Cost (optional)</Label>
                <Input
                  id="activityCost"
                  value={activityForm.cost}
                  onChange={(e) => setActivityForm({ ...activityForm, cost: e.target.value })}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddActivityOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateActivity}>Add Activity</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItineraryBuilder;
