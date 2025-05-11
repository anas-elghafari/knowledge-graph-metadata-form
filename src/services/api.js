// src/services/api.js - update the paths
import axios from 'axios';

// Change from /api/kg-metadata to just /api
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with timeout and headers
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  config => {
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  response => {
    console.log(`Received response with status: ${response.status}`);
    return response;
  },
  error => {
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something else happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

const api = {
  // Test connection to the server
  testConnection: async () => {
    try {
      const response = await apiClient.get('/test');
      return response.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  },
  
  // Get all submissions
  getSubmissions: async () => {
    try {
      const response = await apiClient.get('/submissions');
      return response.data;
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },
  
  // Create a new submission
  createSubmission: async (formData) => {
    try {
      console.log('Submitting form data:', formData);
      const response = await apiClient.post('/submissions', formData);
      return response.data;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  }
};

export default api;