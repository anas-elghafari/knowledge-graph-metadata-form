// src/components/DataTable.js
import React from 'react';

function DataTable({ submissions }) {
  const downloadJSON = () => {
    if (submissions.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Add browser type and ensure timestamp for all submissions
    const enrichedData = submissions.map(submission => ({
      ...submission,
      browserType: navigator.userAgent,
      timestamp: submission.timestamp || submission.date || new Date().toISOString(),
      exportDate: new Date().toISOString()
    }));
    
    // Convert to JSON string with proper formatting
    const jsonData = JSON.stringify(enrichedData, null, 2);
    
    // Create download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `kg-metadata-${new Date().toISOString().slice(0,10)}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearSubmissions = () => {
    if (window.confirm('Are you sure you want to clear all metadata? This cannot be undone.')) {
      localStorage.removeItem('kg-metadata-submissions');
      window.location.reload(); // Reload to update the UI
    }
  };

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h2>Metadata Submissions ({submissions.length})</h2>
        <div className="table-actions">
          <button 
            onClick={downloadJSON}
            disabled={submissions.length === 0}
            className="download-button"
          >
            Export JSON
          </button>
          <button 
            onClick={clearSubmissions}
            disabled={submissions.length === 0}
            className="clear-button"
          >
            Clear All
          </button>
        </div>
      </div>
      
      {submissions.length > 0 ? (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Type</th>
                <th>Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.description}</td>
                  <td>{item.type}</td>
                  <td>{new Date(item.date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data">No metadata submissions yet</p>
      )}
    </div>
  );
}

export default DataTable;