// src/App.js with server connection test
import React, { useState, useEffect } from 'react';
import Form from './components/Form';
import DataTable from './components/DataTable';
import api from './services/api';
import './App.css';

function App() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  
  // Test server connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        await api.testConnection();
        setServerStatus('connected');
        console.log('Successfully connected to server');
        fetchSubmissions();
      } catch (error) {
        console.error('Server connection test failed:', error);
        setServerStatus('disconnected');
        setLoading(false);
        setError('Cannot connect to the server. The application will run in offline mode.');
      }
    };
    
    const fetchSubmissions = async () => {
      try {
        const data = await api.getSubmissions();
        setSubmissions(data);
        setError(null);
      } catch (error) {
        setError('Failed to load submissions. Please try again later.');
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    testConnection();
  }, []);
  
  const handleSubmission = async (formData) => {
    try {
      if (serverStatus === 'disconnected') {
        // Offline mode - just add to local state
        const mockSubmission = {
          ...formData,
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1 (offline mode)',
          browser: navigator.userAgent
        };
        setSubmissions([...submissions, mockSubmission]);
        return { success: true, message: 'Form submitted in offline mode (not saved to server)' };
      } else {
        // Online mode - send to server
        const result = await api.createSubmission(formData);
        setSubmissions([...submissions, result.submission]);
        return { success: true, message: 'Form submitted successfully!' };
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Error submitting form. Please try again.' 
      };
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>KG-Metadata-Form</h1>
        {serverStatus === 'disconnected' && (
          <p className="server-status offline">
            Running in offline mode - data will not be saved to server
          </p>
        )}
        {serverStatus === 'connected' && (
          <p className="server-status online">
            Connected to server - submissions will be saved
          </p>
        )}
      </header>
      <main>
        <Form onSubmit={handleSubmission} />
        {loading ? (
          <div className="loading">Loading submissions...</div>
        ) : error ? (
          <div className="error-container">{error}</div>
        ) : (
          <DataTable submissions={submissions} />
        )}
      </main>
    </div>
  );
}

export default App;