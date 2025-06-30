import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { InterviewExperience } from '../../types/database';
import { User, Mail, Calendar, Building, Edit, Eye, MessageCircle, ThumbsUp, Award, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import ExperienceCard from '../Experience/ExperienceCard';
import ExperienceModal from '../Experience/ExperienceModal';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  year_of_passing?: number;
  branch?: string;
  current_company?: string;
  verified: boolean;
  created_at: string;
  experience_count: number;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [experiences, setExperiences] = useState<InterviewExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<InterviewExperience | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    year_of_passing: '',
    branch: '',
    current_company: '',
  });

  // First: load the profile
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Only after profile is set, then load experiences
  useEffect(() => {
    if (profile) {
      fetchUserExperiences();
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const response = await api.get<UserProfile>('/users/profile');
      setProfile(response.data);
      setEditForm({
        full_name: response.data.full_name || '',
        year_of_passing: response.data.year_of_passing?.toString() || '',
        branch: response.data.branch || '',
        current_company: response.data.current_company || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchUserExperiences = async () => {
    try {
      setLoading(true);
      // Fetch experiences created by the current user
      const response = await api.get('/experiences/mine');
      // handle either { experiences: [...] } or bare array
      const rawList: any[] = Array.isArray(response.data.experiences)
        ? response.data.experiences
        : response.data;
        console.log('RAW EXPERIENCES FROM API:', rawList);
      
      // map into the shape your UI expects:
      const allExperiences = rawList.map(exp => ({
        ...exp,
        // Inject the logged-in user’s name so <ExperienceCard> can read experience.user.full_name
        user: {
          full_name: profile!.full_name
        },
        company: { name: exp.company_name },
        _count: {
          views:    Number(exp.view_count)   || 0,
          comments: Number(exp.comment_count) || 0,
          votes:    Number(exp.upvote_count)  || 0,
        }
      }));     
      setExperiences(allExperiences);

    } catch (error) {
      console.error('Error fetching user experiences:', error);
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Mock update - replace with actual API call
      await api.put('/users/profile', editForm);
      setEditing(false);
      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!user || !profile) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate statistics from user's experiences
  const stats = {
    totalExperiences: experiences.length,
    totalViews: experiences.reduce((sum, exp) => sum + (exp._count?.views || 0), 0),
    totalUpvotes: experiences.reduce((sum, exp) => sum + (exp._count?.votes || 0), 0),
    selectionRate: experiences.length > 0 
      ? Math.round((experiences.filter(exp => exp.result === 'selected').length / experiences.length) * 100)
      : 0,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {profile.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.full_name}</h1>
              <div className="space-y-1 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                  {profile.verified && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Verified
                    </span>
                  )}
                </div>
                {profile.year_of_passing && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Class of {profile.year_of_passing}</span>
                  </div>
                )}
                {profile.branch && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{profile.branch}</span>
                  </div>
                )}
                {profile.current_company && (
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>Currently at {profile.current_company}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Edit Form */}
        {editing && (
          <form onSubmit={handleEditSubmit} className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={editForm.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year of Passing
                </label>
                <input
                  type="number"
                  name="year_of_passing"
                  value={editForm.year_of_passing}
                  onChange={handleInputChange}
                  min="2000"
                  max="2030"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  name="branch"
                  value={editForm.branch}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Branch</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Company
                </label>
                <input
                  type="text"
                  name="current_company"
                  value={editForm.current_company}
                  onChange={handleInputChange}
                  placeholder="e.g., Google, Microsoft"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Experiences Shared</p>
              <p className="text-3xl font-bold">{stats.totalExperiences}</p>
            </div>
            <Award className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Views</p>
              <p className="text-3xl font-bold">{stats.totalViews}</p>
            </div>
            <Eye className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Upvotes</p>
              <p className="text-3xl font-bold">{stats.totalUpvotes}</p>
            </div>
            <ThumbsUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Selection Rate</p>
              <p className="text-3xl font-bold">{stats.selectionRate}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
      </div>

      {/* My Experiences */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Interview Experiences</h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : experiences.length > 0 ? (
          <div className="space-y-4">
            {experiences.map(exp => (
              
            
              <ExperienceCard
                key={exp.id}
                experience={exp}
                onClick={async () => {
                  try {
                    const res = await api.get<InterviewExperience>(`/experiences/${exp.id}`);
                    setSelectedExperience(res.data);
                    setIsModalOpen(true);
                  } catch (err) {
                    console.error('Failed to load details:', err);
                  }
                }}
              />           
            ))}
         </div>
        ) : (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You haven't shared any interview experiences yet.</p>
            <Link
              to="/share"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Share Your First Experience
            </Link>
          </div>
        )}        
      </div>
    {/* Experience detail modal */}
    {selectedExperience && (
      <ExperienceModal
        experience={selectedExperience}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    )}
    </div>
  );
};

export default Profile;
