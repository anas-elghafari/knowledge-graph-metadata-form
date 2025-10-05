// src/components/DataTable.js
import React from 'react';
import fieldSemanticMapping from '../fieldSemanticMapping.json';

function DataTable({ submissions }) {
  
  // Function to convert field names to semantic names
  const convertToSemanticNames = (obj, parentKey = '') => {
    if (Array.isArray(obj)) {
      return obj.map(item => convertToSemanticNames(item, parentKey));
    } else if (obj !== null && typeof obj === 'object') {
      const converted = {};
      
      for (const [key, value] of Object.entries(obj)) {
        let semanticKey;
        
        if (parentKey) {
          // For subsection fields, use parentKey-fieldName format
          const lookupKey = `${parentKey}-${key}`;
          semanticKey = fieldSemanticMapping[lookupKey] || key;
        } else {
          // For main fields, use direct lookup
          semanticKey = fieldSemanticMapping[key] || key;
        }
        
        // If semantic mapping is "???" use original field name
        if (semanticKey === '???') {
          semanticKey = key;
        }
        
        // Handle subsections (arrays of objects)
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          converted[semanticKey] = convertToSemanticNames(value, key);
        } else {
          converted[semanticKey] = convertToSemanticNames(value, parentKey);
        }
      }
      
      return converted;
    }
    
    return obj;
  };

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

  const downloadSemanticJSON = () => {
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
    
    // Convert to semantic field names
    const semanticData = enrichedData.map(submission => convertToSemanticNames(submission));
    
    // Convert to JSON string with proper formatting
    const jsonData = JSON.stringify(semanticData, null, 2);
    
    // Create download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `kg-metadata-semantic-${new Date().toISOString().slice(0,10)}.json`);
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
            onClick={downloadSemanticJSON}
            disabled={submissions.length === 0}
            className="download-button semantic-export"
          >
            Semantic Export
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
                <th>Acronym</th>
                <th>Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.acronym && item.acronym.length > 0 ? item.acronym.join(', ') : '-'}</td>
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