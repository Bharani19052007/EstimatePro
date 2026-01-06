import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Plus, Trash2, IndianRupee } from 'lucide-react';

const TimelineComponent = ({ 
  stops, 
  activities, 
  onAddActivity, 
  onDeleteActivity, 
  onDeleteStop 
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateStopCost = (stopIndex) => {
    const stopActivities = activities[stopIndex] || [];
    return stopActivities.reduce((total, activity) => {
      return total + (parseFloat(activity.cost) || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Trip Timeline
          </CardTitle>
          <CardDescription>
            Visual overview of your trip stops and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stops.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No stops added yet. Add your first stop to get started!</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
              
              {/* Timeline items */}
              <div className="space-y-8">
                {stops.map((stop, index) => (
                  <div key={index} className="relative flex items-start gap-6">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0 w-16 h-16 bg-background border-4 border-primary rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    
                    {/* Stop content */}
                    <div className="flex-1 min-w-0">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-xl">{stop.city}</CardTitle>
                              <CardDescription className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(stop.startDate)} - {formatDate(stop.endDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="w-4 h-4" />
                                  {calculateStopCost(index).toFixed(2)}
                                </span>
                              </CardDescription>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteStop(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {/* Activities for this stop */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm text-muted-foreground">Activities</h4>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onAddActivity(index)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Activity
                              </Button>
                            </div>
                            
                            {activities[index] && activities[index].length > 0 ? (
                              <div className="space-y-2">
                                {activities[index].map((activity, actIndex) => (
                                  <div
                                    key={actIndex}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Badge variant="secondary">
                                        {activity.name}
                                      </Badge>
                                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <IndianRupee className="w-3 h-3" />
                                        {activity.cost}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onDeleteActivity(index, actIndex)}
                                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No activities added yet
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelineComponent;
