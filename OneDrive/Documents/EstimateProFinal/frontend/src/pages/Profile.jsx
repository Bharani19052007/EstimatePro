import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, MapPin, Calendar, Globe, Settings, LogOut, Camera, Edit, Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { authApi, projectApi } from "@/services/api";

// Activity type mapping
const getActivityInfo = (action, details) => {
  switch (action) {
    case 'created_project':
      return {
        icon: Plus,
        text: `Created new project: ${details.projectName}`,
        color: 'text-green-600'
      };
    case 'updated_project':
      return {
        icon: Edit,
        text: `Updated project: ${details.projectName}`,
        color: 'text-blue-600'
      };
    case 'deleted_project':
      return {
        icon: Trash2,
        text: `Deleted project: ${details.projectName}`,
        color: 'text-red-600'
      };
    case 'created_estimation':
      return {
        icon: Plus,
        text: `Created estimation: ${details.estimationName}`,
        color: 'text-green-600'
      };
    case 'updated_estimation':
      return {
        icon: Edit,
        text: `Updated estimation: ${details.estimationName}`,
        color: 'text-blue-600'
      };
    default:
      return {
        icon: Calendar,
        text: 'Activity recorded',
        color: 'text-primary'
      };
  }
};

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInMs = now - activityTime;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return activityTime.toLocaleDateString();
  }
};

const Profile = () => {
  const { user, logout, login, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.avatar || null);
  const [projectCount, setProjectCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    location: user?.location || "San Francisco, CA",
    bio: user?.bio || "Project manager passionate about delivering successful projects and innovative solutions.",
  });

  // Load fresh profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await authApi.getProfile();
        console.log('Profile data loaded:', profileData);
        
        setFormData({
          name: profileData.name || '',
          email: profileData.email || '',
          location: profileData.location || "San Francisco, CA",
          bio: profileData.bio || "Project manager passionate about delivering successful projects and innovative solutions.",
        });
        
        // Set avatar if exists - handle multiple formats
        if (profileData.avatar) {
          console.log('Avatar data found:', profileData.avatar);
          if (typeof profileData.avatar === 'string') {
            // If avatar is already a full data URL
            setProfileImage(profileData.avatar);
          } else if (profileData.avatar.data && profileData.avatar.contentType) {
            // If avatar is an object with data and contentType
            const imageUrl = `data:${profileData.avatar.contentType};base64,${profileData.avatar.data}`;
            console.log('Setting avatar image URL:', imageUrl);
            setProfileImage(imageUrl);
          } else if (profileData.avatar.data) {
            // If avatar is just base64 data
            setProfileImage(`data:image/jpeg;base64,${profileData.avatar.data}`);
          }
        } else {
          console.log('No avatar data found');
        }

        // Fetch real trip count
        await fetchProjectCount();
        // Fetch recent activities
        await fetchRecentActivities();
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  // Fetch real project count from database
  const fetchProjectCount = async () => {
    try {
      console.log('Fetching projects for user ID:', user?._id);
      const projects = await projectApi.getProjectsByUser(user._id);
      const realProjectCount = projects ? projects.length : 0;
      console.log('Real project count:', realProjectCount);
      console.log('Projects data:', projects);
      setProjectCount(realProjectCount);
    } catch (error) {
      console.error('Error fetching project count:', error);
      setProjectCount(0);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    if (!user?._id) return;
    
    try {
      setIsLoadingActivities(true);
      const activities = await projectApi.getActivitiesByUser(user._id, 10);
      console.log('Recent activities:', activities);
      setRecentActivities(activities || []);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      setRecentActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Update project count when user changes
  useEffect(() => {
    if (user) {
      fetchProjectCount();
      fetchRecentActivities();
    }
  }, [user]);

  // Refresh activities when component mounts or when user navigates to profile
  useEffect(() => {
    if (user) {
      fetchRecentActivities();
    }
  }, []);

  // Refresh project count when component mounts or when user navigates to profile
  useEffect(() => {
    if (user) {
      fetchProjectCount();
    }
  }, []);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        location: user.location || "San Francisco, CA",
        bio: user.bio || "Project manager passionate about delivering successful projects and innovative solutions.",
      });
      
      // Handle avatar data - check multiple possible formats
      if (user.avatar) {
        if (typeof user.avatar === 'string') {
          // If avatar is already a full data URL
          setProfileImage(user.avatar);
        } else if (user.avatar.data && user.avatar.contentType) {
          // If avatar is an object with data and contentType
          setProfileImage(`data:${user.avatar.contentType};base64,${user.avatar.data}`);
        } else if (user.avatar.data) {
          // If avatar is just base64 data
          setProfileImage(`data:image/jpeg;base64,${user.avatar.data}`);
        }
      }
    }
  }, [user]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "Image size should be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload to server
      console.log('Uploading avatar file...');
      const updatedUser = await authApi.updateAvatar(file);
      console.log('Avatar upload response:', updatedUser);
      
      // Refresh user data to get latest avatar
      await refreshUserData();
      console.log('User data refreshed after avatar upload');
      
      toast({
        title: "Success",
        description: "Profile photo updated successfully!",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      console.log('Saving profile data:', formData);
      
      // Update profile in database
      const updatedUser = await authApi.updateProfile({
        name: formData.name,
        location: formData.location,
        bio: formData.bio
      });
      
      console.log('Profile updated response:', updatedUser);
      
      // Refresh user data from database to ensure we have the latest
      await refreshUserData();
      
      // Refresh project count after profile update
      await fetchProjectCount();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      location: user?.location || "San Francisco, CA",
      bio: user?.bio || "Project manager passionate about delivering successful projects and innovative solutions.",
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">My Profile</h1>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="relative inline-block mb-6">
                    <Avatar className="w-32 h-32">
                      <AvatarImage src={profileImage} alt={user?.name} />
                      <AvatarFallback className="text-2xl font-semibold">
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Debug info */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="absolute -bottom-8 left-0 right-0 text-xs text-muted-foreground">
                        Avatar: {profileImage ? 'Set' : 'Not set'}
                      </div>
                    )}
                    
                    {/* Upload overlay */}
                    <div 
                      className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={triggerFileInput}
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Upload className="w-8 h-8 text-white" />
                      )}
                    </div>
                    
                    {/* Camera button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0 bg-background"
                      onClick={triggerFileInput}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </Button>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-2">{user?.name || 'Project Manager'}</h2>
                  <p className="text-muted-foreground mb-6">{user?.email}</p>
                  
                  {/* Stats */}
                  <div className="flex justify-center mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{projectCount}</p>
                      <p className="text-sm text-muted-foreground">Projects</p>
                    </div>
                  </div>

                  <Badge variant="secondary" className="mb-2">
                    <Globe className="w-3 h-3 mr-1" />
                    Project Manager
                  </Badge>
                </div>
              </Card>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-foreground">About Me</h3>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="mt-1 bg-muted/50 cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="mt-1 w-full h-24 p-3 border rounded-md resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSave} className="gap-2">
                        <User className="w-4 h-4" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{user?.location || "San Francisco, CA"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground mt-1" />
                      <p className="text-muted-foreground">
                        {user?.bio || "Project manager passionate about delivering successful projects and innovative solutions."}
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h3>
                {isLoadingActivities ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity, index) => {
                      const activityInfo = getActivityInfo(activity.action, activity.details);
                      const IconComponent = activityInfo.icon;
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <IconComponent className={`w-4 h-4 ${activityInfo.color}`} />
                          <div className="flex-1">
                            <p className="text-sm text-foreground">{activityInfo.text}</p>
                            <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.timestamp)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground mt-1">Start creating projects to see your activity here</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
