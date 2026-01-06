import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { resourceApi } from "@/services/api";
import { toast } from "sonner";

const EditResource = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Debug: Check user authentication
  console.log('EditResource - Current user:', user);
  console.log('EditResource - User ID:', user?._id);
  console.log('EditResource - Is user authenticated:', !!user);
  
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  // Debug: Log the ID to see what we're getting
  console.log('EditResource - ID from params:', id);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    availability: 'available',
    hourlyRate: '',
    experience: '',
    skills: '',
    currentProject: '',
    notes: ''
  });

  useEffect(() => {
    fetchResource();
  }, [id]);

  const fetchResource = async () => {
    try {
      console.log('fetchResource called with ID:', id);
      
      // Check if ID is valid
      if (!id) {
        console.error('No ID provided for resource');
        toast.error('Invalid resource ID');
        navigate('/resource-management');
        return;
      }
      
      setFetchLoading(true);
      console.log('Calling API with ID:', id);
      const resourceData = await resourceApi.getResourceById(id);
      console.log('Resource data received:', resourceData);
      if (resourceData) {
        setFormData({
          name: resourceData.name || '',
          email: resourceData.email || '',
          phone: resourceData.phone || '',
          role: resourceData.role || '',
          availability: resourceData.availability || 'available',
          hourlyRate: resourceData.hourlyRate?.toString() || '',
          experience: resourceData.experience?.toString() || '',
          skills: resourceData.skills ? resourceData.skills.join(', ') : '',
          currentProject: resourceData.currentProject || '',
          notes: resourceData.notes || ''
        });
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Don't redirect immediately, show error message first
      if (error.response?.status === 404) {
        toast.error('Resource not found');
      } else if (error.response?.status === 401) {
        toast.error('You are not authorized to edit this resource');
      } else {
        toast.error('Failed to load resource data: ' + (error.message || 'Unknown error'));
      }
      
      // Only redirect if it's a critical error
      if (error.response?.status === 404 || !id) {
        setTimeout(() => {
          navigate('/resource-management');
        }, 2000);
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.role || !formData.hourlyRate) {
        toast.error('Please fill in all required fields');
        return;
      }

      setIsLoading(true);

      // Prepare data for API
      const resourceData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        availability: formData.availability,
        hourlyRate: parseFloat(formData.hourlyRate),
        experience: parseInt(formData.experience) || 0,
        skills: formData.skills ? formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill) : [],
        currentProject: formData.currentProject || null,
        notes: formData.notes || ''
      };

      await resourceApi.updateResource(id, resourceData);
      toast.success('Resource updated successfully!');
      navigate('/resource-management');
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error(error.message || 'Failed to update resource');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/resource-management');
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <div className="ml-4">
            <div className="text-lg font-semibold">Loading resource...</div>
            <div className="text-sm text-muted-foreground">Please wait while we fetch the resource data</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Resources
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Edit Resource</h1>
              <p className="text-muted-foreground mt-2">
                Update team member information
              </p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Information</CardTitle>
              <CardDescription>
                Edit the details of this team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                      <SelectTrigger>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="availability">Availability</Label>
                    <Select value={formData.availability} onValueChange={(value) => handleInputChange('availability', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select availability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="busy">Busy</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate ($) *</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="experience">Experience (years)</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="skills">Skills</Label>
                  <Input
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => handleInputChange('skills', e.target.value)}
                    placeholder="e.g., JavaScript, React, Node.js (comma separated)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter skills separated by commas
                  </p>
                </div>

                <div>
                  <Label htmlFor="currentProject">Current Project</Label>
                  <Input
                    id="currentProject"
                    value={formData.currentProject}
                    onChange={(e) => handleInputChange('currentProject', e.target.value)}
                    placeholder="Enter current project name (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add any additional notes about this resource"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleCancel}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditResource;
