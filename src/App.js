// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import ModalForm from './components/ModalForm';
import DataTable from './components/DataTable';
import SavedDrafts from './components/SavedDrafts';
import './App.css';

function App() {
  const [submissions, setSubmissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [draftToLoad, setDraftToLoad] = useState(null);
  
  // Create a ref for the SavedDrafts component
  const savedDraftsRef = useRef(null);
  
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
  
  // Handle loading a draft
  const handleLoadDraft = (formData) => {
    setDraftToLoad(formData);
    setShowModal(true);
  };
  
  // Handle drafts being saved
  const handleDraftSaved = () => {
    // Refresh the saved drafts display
    if (savedDraftsRef.current) {
      savedDraftsRef.current.refreshDrafts();
    }
  };
  
  // Handle opening the modal with a new form
  const handleOpenModal = () => {
    setDraftToLoad(null); // Reset any loaded draft
    setShowModal(true);
  };
  
  // Handle closing the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setDraftToLoad(null); // Reset the loaded draft when closing
  };
  
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
            onClick={handleOpenModal}
            style={{ width: 'auto' }}
          >
            Create Metadata
          </button>
        </div>
        <DataTable submissions={submissions} />
        
        {/* Add SavedDrafts component below DataTable */}
        <div className="saved-drafts-section">
          <SavedDrafts 
            ref={savedDraftsRef}
            onLoadDraft={handleLoadDraft} 
          />
        </div>
        
        {showModal && (
          <ModalForm 
            onSubmit={handleSubmission} 
            onClose={handleCloseModal}
            initialFormData={draftToLoad}
            onDraftSaved={handleDraftSaved}
          />
        )}
      </main>
    </div>
  );
}

export default App;