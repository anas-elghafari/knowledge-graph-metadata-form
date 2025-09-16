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
  const [cheatSheetFile, setCheatSheetFile] = useState(null);
  const [cheatSheetContent, setCheatSheetContent] = useState('');
  
  // Create a ref for the SavedDrafts component
  const savedDraftsRef = useRef(null);
  const fileInputRef = useRef(null);
  
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
  
  // Handle file upload for cheat sheet
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCheatSheetFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCheatSheetContent(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
        <div className="header-controls">
          <button 
            className="upload-button"
            onClick={handleUploadClick}
            title="Upload cheat sheet to help AI generate better suggestions"
          >
            📄 Upload Cheat Sheet
          </button>
          {cheatSheetFile && (
            <span className="file-indicator">
              ✅ {cheatSheetFile.name}
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.doc,.docx,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </header>
      <main>
        <div className="form-container">
          <button 
            className="submit-button" 
            onClick={handleOpenModal}
            style={{ width: 'auto' }}
          >
            Create Metadata - Form/Manual
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
            cheatSheetContent={cheatSheetContent}
          />
        )}
      </main>
    </div>
  );
}

export default App;