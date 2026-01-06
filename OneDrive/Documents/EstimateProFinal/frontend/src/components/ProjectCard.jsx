import { Calendar, Briefcase, Edit, Trash2, Eye, Star, Users, IndianRupee, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export const ProjectCard = ({
  id,
  name,
  startDate,
  endDate,
  status,
  priority,
  budget,
  imageUrl,
  location,
  rating,
  team,
  onEdit,
  onDelete,
}) => {
  // Debug data being passed
  console.log('ProjectCard data:', { id, name, status, priority, budget, team });

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="card-travel group cursor-pointer">
      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        
        {/* Status and Priority Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(status)}`}>
            {status?.replace('_', ' ').toUpperCase()}
          </div>
          <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${getPriorityColor(priority)}`}>
            {priority?.toUpperCase()}
          </div>
        </div>
        
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-primary-foreground line-clamp-1">{name}</h3>
          {location && (
            <div className="flex items-center gap-1 text-primary-foreground/80">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm">{location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            {startDate} - {endDate}
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Clock className="w-4 h-4" />
          <span className="text-sm capitalize">{status?.replace('_', ' ')}</span>
        </div>

        {/* Additional Details */}
        <div className={`${team && budget ? 'grid grid-cols-2' : 'grid grid-cols-1'} gap-3 mb-5`}>
          {team && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">{team} members</span>
            </div>
          )}
          {budget && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="w-4 h-4" />
              <span className="text-sm">{typeof budget === 'number' ? budget.toLocaleString() : budget}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link to={`/project/${id}`} className="flex-1">
            <Button variant="default" size="sm" className="w-full gap-2">
              <Eye className="w-4 h-4" />
              View
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="gap-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
