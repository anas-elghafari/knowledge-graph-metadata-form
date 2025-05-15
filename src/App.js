// src/App.js
import React, { useState, useEffect } from 'react';
import ModalForm from './components/ModalForm';
import DataTable from './components/DataTable';
import './App.css';

function App() {
  const [submissions, setSubmissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Load any saved submissions from localStorage on component mount
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
  
  // Handle form submission
  const handleSubmission = async (formData) => {
    try {
      // Create submission with complete data and metadata
      const timestamp = new Date().toISOString();
      
      const submission = {
        // Display data for the table
        name: formData.title,
        description: formData.description,
        type: "KG-Metadata",
        date: timestamp,
        
        // Complete form data
        formData: {
          ...formData,
          timestamp: timestamp,
          browserType: navigator.userAgent,
          submissionId: `kg-meta-${Date.now()}`
        }
      };
      
      // Add to submissions
      const newSubmissions = [...submissions, submission];
      setSubmissions(newSubmissions);
      
      return { success: true, message: 'Metadata submitted successfully!' };
    } catch (error) {
      console.error('Error submitting form:', error);
      return { 
        success: false, 
        message: 'Error submitting metadata. Please try again.' 
      };
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Knowledge Graph Metadata</h1>
      </header>
      <main>
        <div className="form-container">
          <button 
            className="submit-button" 
            onClick={() => setShowModal(true)}
            style={{ width: 'auto' }}
          >
            Submit Metadata Form
          </button>
        </div>
        <DataTable submissions={submissions} />
        
        {showModal && (
          <ModalForm 
            onSubmit={handleSubmission} 
            onClose={() => setShowModal(false)} 
          />
        )}
      </main>
    </div>
  );
}

export default App;