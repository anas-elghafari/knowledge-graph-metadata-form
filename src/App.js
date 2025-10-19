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
  const [aiEnabledByDefault, setAiEnabledByDefault] = useState(false);
  const [turtleModeEnabled, setTurtleModeEnabled] = useState(false);
  
  // Get the current view mode from URL parameters
  const getViewMode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    return mode; // 'llm', 'regular', 'turtle', or null (all)
  };
  
  const [viewMode, setViewMode] = useState(getViewMode());
  
  // Create a ref for the SavedDrafts component
  const savedDraftsRef = useRef(null);
  
  // Listen for URL changes (for back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setViewMode(getViewMode());
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
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
  
  // Handle loading a draft (now receives both formData and aiSuggestions)
  const handleLoadDraft = (draftData) => {
    setDraftToLoad(draftData);
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
    setAiEnabledByDefault(false); // Ensure AI mode is off for normal form
    setTurtleModeEnabled(false); // Ensure Turtle mode is off
    setShowModal(true);
  };

  // Handle opening the modal with AI enabled by default
  const handleOpenModalWithAI = () => {
    setDraftToLoad(null); // Reset any loaded draft
    setAiEnabledByDefault(true);
    setTurtleModeEnabled(false); // Ensure Turtle mode is off
    setShowModal(true);
  };

  // Handle opening the modal with Turtle mode enabled
  const handleOpenModalWithTurtle = () => {
    setDraftToLoad(null); // Reset any loaded draft
    setAiEnabledByDefault(false); // Ensure AI mode is off
    setTurtleModeEnabled(true);
    setShowModal(true);
  };
  
  // Handle closing the modal
  const handleCloseModal = () => {
    setShowModal(false);
    setDraftToLoad(null); // Reset the loaded draft when closing
    setAiEnabledByDefault(false); // Reset AI default state when closing
    setTurtleModeEnabled(false); // Reset Turtle mode when closing
  };
  
  // Handle form submission
  const handleSubmission = async (submissionData) => {
    try {
      // Extract form data and validation errors from the new structure
      const { formData, validationErrors, metadata } = submissionData;
      
      // Create submission with complete data and metadata
      const timestamp = new Date().toISOString();
      
      const submission = {
        // Display data for the table
        name: formData.title,
        acronym: formData.acronym,
        date: timestamp,
        
        // Complete form data (clean, without validation errors)
        formData: {
          ...formData,
          timestamp: timestamp,
          browserType: navigator.userAgent,
          submissionId: `kg-meta-${Date.now()}`
        },
        
        // Validation errors outside form data
        validationErrors: validationErrors,
        
        // Submission metadata
        metadata: {
          ...metadata,
          timestamp: timestamp
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

  // Render different buttons based on view mode
  const renderButtons = () => {
    if (viewMode === 'regular') {
      // Only show manual form button
      return (
        <button 
          className="submit-button" 
          onClick={handleOpenModal}
          style={{ width: 'auto' }}
        >
          Create Metadata - Form/Manual
        </button>
      );
    } else if (viewMode === 'llm') {
      // Only show AI assisted button
      return (
        <button 
          className="submit-button" 
          onClick={handleOpenModalWithAI}
          style={{ width: 'auto' }}
        >
          Create Metadata - AI Assisted
        </button>
      );
    } else if (viewMode === 'turtle') {
      // Only show Turtle entry button
      return (
        <button 
          className="submit-button" 
          onClick={handleOpenModalWithTurtle}
          style={{ width: 'auto' }}
        >
          Create Metadata - Turtle Entry
        </button>
      );
    } else {
      // Show all three buttons (default homepage)
      return (
        <>
          <button 
            className="submit-button" 
            onClick={handleOpenModal}
            style={{ width: 'auto' }}
          >
            Create Metadata - Form/Manual
          </button>
          <button 
            className="submit-button" 
            onClick={handleOpenModalWithAI}
            style={{ width: 'auto', marginTop: '10px' }}
          >
            Create Metadata - AI Assisted
          </button>
          <button 
            className="submit-button" 
            onClick={handleOpenModalWithTurtle}
            style={{ width: 'auto', marginTop: '10px' }}
          >
            Create Metadata - Turtle Entry
          </button>
        </>
      );
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Knowledge Graph Metadata</h1>
        {/* Add navigation links */}
        <div className="view-mode-links">
          <a 
            href="?" 
            className={!viewMode ? 'active' : ''}
          >
            All Tools
          </a>
          <a 
            href="?mode=regular" 
            className={viewMode === 'regular' ? 'active' : ''}
          >
            Manual Only
          </a>
          <a 
            href="?mode=llm" 
            className={viewMode === 'llm' ? 'active' : ''}
          >
            AI Only
          </a>
          <a 
            href="?mode=turtle" 
            className={viewMode === 'turtle' ? 'active' : ''}
          >
            Turtle Only
          </a>
        </div>
      </header>
      <main>
        <div className="form-container">
          {renderButtons()}
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
            aiEnabledByDefault={aiEnabledByDefault}
            turtleModeEnabled={turtleModeEnabled}
          />
        )}
      </main>
    </div>
  );
}

export default App;