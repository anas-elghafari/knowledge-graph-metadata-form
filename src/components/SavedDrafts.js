import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';


const SavedDrafts = forwardRef(({ onLoadDraft }, ref) => {
  const [drafts, setDrafts] = useState([]);
  
  const loadDrafts = () => {
    try {
      const draftsString = localStorage.getItem('kg-metadata-drafts');
      if (draftsString) {
        
        const parsedDrafts = JSON.parse(draftsString);
        
        
        parsedDrafts.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA; // Descending order (newest first)
        });
        
        setDrafts(parsedDrafts);
      } else {
        setDrafts([]);
      }
    } catch (error) {
      console.error('Error loading saved drafts:', error);
      setDrafts([]);
    }
  };
  
  useEffect(() => {
    loadDrafts();
  }, []);
  
  useImperativeHandle(ref, () => ({
    refreshDrafts: loadDrafts
  }));
  
  const handleDeleteDraft = (id, e) => {
    e.stopPropagation(); // Prevent triggering row click
    
    if (window.confirm('Are you sure you want to delete this draft?')) {
      // Filter out the draft to delete
      const updatedDrafts = drafts.filter(draft => draft.id !== id);
      
      // Save back to localStorage
      localStorage.setItem('kg-metadata-drafts', JSON.stringify(updatedDrafts));
      
      // Update state
      setDrafts(updatedDrafts);
    }
  };
  
  const handleLoadDraft = (draft) => {
    // Call the onLoadDraft callback directly without confirmation
    onLoadDraft(draft.formData);
  };
  
  const clearAllDrafts = () => {
    if (window.confirm('Are you sure you want to delete all drafts? This cannot be undone.')) {
      localStorage.removeItem('kg-metadata-drafts');
      setDrafts([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const dateFormatted = date.toISOString().split('T')[0];
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${dateFormatted} ${hours}:${minutes}`;
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h2>Saved Drafts ({drafts.length})</h2>
        <div className="table-actions">
          <button 
            onClick={clearAllDrafts}
            disabled={drafts.length === 0}
            className="clear-button"
          >
            Clear All
          </button>
        </div>
      </div>
      
      {drafts.length > 0 ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date Last Saved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((draft) => (
                <tr 
                  key={draft.id} 
                  onClick={() => handleLoadDraft(draft)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{draft.name}</td>
                  <td>{formatDate(draft.date)}</td>
                  <td>
                    <div className="draft-actions">
                      <button 
                        className="load-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLoadDraft(draft);
                        }}
                      >
                        Load
                      </button>
                      <button 
                        className="delete-button"
                        onClick={(e) => handleDeleteDraft(draft.id, e)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data">No saved drafts</p>
      )}
    </div>
  );
});

export default SavedDrafts;