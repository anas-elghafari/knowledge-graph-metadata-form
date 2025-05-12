//Offline version for GitHub Pages
import React, { useState, useEffect } from 'react';
import Form from './components/Form';
import DataTable from './components/DataTable';
import './App.css';

function App() {
  const [submissions, setSubmissions] = useState([]);
  
  // Load saved submissions from localStorage on component mount
  useEffect(() => {
    const savedSubmissions = localStorage.getItem('kg-metadata-submissions');
    if (savedSubmissions) {
      try {
        setSubmissions(JSON.parse(savedSubmissions));
      } catch (error) {
        console.error('Error loading saved submissions:', error);
      }
    }
  }, []);
  
  // Save submissions to localStorage whenever they change
  useEffect(() => {
    if (submissions.length > 0) {
      localStorage.setItem('kg-metadata-submissions', JSON.stringify(submissions));
    }
  }, [submissions]);
  
  const handleSubmission = async (formData) => {
    try {
      // Create submission with metadata (no IP address)
      const submission = {
        ...formData,
        timestamp: new Date().toISOString(),
        browser: navigator.userAgent
      };
      
      // Add to submissions
      const newSubmissions = [...submissions, submission];
      setSubmissions(newSubmissions);
      
      return { success: true, message: 'Form submitted successfully!' };
    } catch (error) {
      console.error('Error submitting form:', error);
      return { 
        success: false, 
        message: 'Error submitting form. Please try again.' 
      };
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>KG-Metadata-Form</h1>
      </header>
      <main>
        <Form onSubmit={handleSubmission} />
        <DataTable submissions={submissions} />
      </main>
    </div>
  );
}

export default App;