// src/services/openai.js - Simple OpenAI API integration
import axios from 'axios';

// Create axios instance for OpenAI API
const openaiClient = axios.create({
  baseURL: 'https://api.openai.com/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include API key
openaiClient.interceptors.request.use(
  config => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }
    config.headers.Authorization = `Bearer ${apiKey}`;
    return config;
  },
  error => Promise.reject(error)
);

// Basic error handling
openaiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('OpenAI API error:', error);
    return Promise.reject(error);
  }
);

/**
 * Get AI suggestions for a form field
 * @param {string} fieldName - The field name
 * @param {string} context - Context about the dataset
 * @returns {Promise<string>} - AI response
 */
export const getFieldSuggestions = async (fieldName, context) => {
  try {
    const prompt = `Help me fill out the "${fieldName}" field for a dataset. Context: ${context}. Provide a brief suggestion.`;
    
    const response = await openaiClient.post('/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return response.data.choices[0]?.message?.content?.trim() || 'No suggestion available';
  } catch (error) {
    console.error('Error getting field suggestions:', error);
    throw error;
  }
};

export default { getFieldSuggestions };
