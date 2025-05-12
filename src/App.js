// src/App.js - Updated for enhanced form
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
      // Create simplified submission object (with just essential fields for the table)
      const submission = {
        name: formData.title, // Using title as the name for display
        description: formData.description,
        type: formData.distributions && formData.distributions.length > 0 
          ? formData.distributions[0].mediaType 
          : 'Unknown',
        date: new Date().toISOString(),
        // Store the complete formData for future reference
        formData: formData
      };
      
      // Add to submissions
      const newSubmissions = [...submissions, submission];
      setSubmissions(newSubmissions);
      
      return { success: true, message: 'Mapping created successfully!' };
    } catch (error) {
      console.error('Error submitting form:', error);
      return { 
        success: false, 
        message: 'Error creating mapping. Please try again.' 
      };
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Knowledge Graph Metadata Mappings</h1>
      </header>
      <main>
        <div className="form-container">
          <button 
            className="submit-button" 
            onClick={() => setShowModal(true)}
            style={{ width: 'auto' }}
          >
            Add Mapping
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