// src/App.js - With modal form integration
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
      // Create submission with metadata (no IP address in this version)
      const submission = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        fileName: formData.file ? formData.file.name : 'Unknown',
        timestamp: new Date().toISOString()
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
