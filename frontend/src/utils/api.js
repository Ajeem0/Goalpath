import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('goalpath_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('goalpath_token');
      localStorage.removeItem('goalpath_user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const getNotifications = () => API.get('/auth/notifications');
export const markNotificationRead = (id) => API.put(`/auth/notifications/${id}/read`);

// DSA
export const getDSAProblems = (params) => API.get('/dsa', { params });
export const addDSAProblem = (data) => API.post('/dsa', data);
export const getDSAStats = () => API.get('/dsa/stats');
export const updateDSAProblem = (id, data) => API.put(`/dsa/${id}`, data);
export const deleteDSAProblem = (id) => API.delete(`/dsa/${id}`);

// DBMS
export const getDBMSAnalyses = (params) => API.get('/dbms', { params });
export const addDBMSAnalysis = (data) => API.post('/dbms', data);
export const getDBMSStats = () => API.get('/dbms/stats');
export const updateDBMSAnalysis = (id, data) => API.put(`/dbms/${id}`, data);
export const deleteDBMSAnalysis = (id) => API.delete(`/dbms/${id}`);

// Projects
export const getProjects = (params) => API.get('/projects', { params });
export const addProject = (data) => API.post('/projects', data);
export const getProject = (id) => API.get(`/projects/${id}`);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id) => API.delete(`/projects/${id}`);
export const updateFeature = (projectId, featureId, data) =>
  API.put(`/projects/${projectId}/feature/${featureId}`, data);

// Daily Goals
export const getTodayGoals = () => API.get('/goals/today');
export const addGoal = (data) => API.post('/goals/today/add', data);
export const completeGoal = (goalId) => API.put(`/goals/today/${goalId}/complete`);
export const deleteGoal = (goalId) => API.delete(`/goals/today/${goalId}`);
export const getGoalHistory = (days) => API.get('/goals/history', { params: { days } });

// Analytics
export const getAnalyticsOverview = () => API.get('/analytics/overview');

export const authAPI = {
  getNotifications,
  updateProfile,
  markNotificationRead,
};

export default API;
