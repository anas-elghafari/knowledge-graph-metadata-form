// src/components/DataTable.js
import React from 'react';
import JSZip from 'jszip';
import fieldSemanticMapping from '../fieldSemanticMapping.json';

function DataTable({ submissions, isDevMode = true }) {
  
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

  const downloadJSON = async () => {
    if (submissions.length === 0) {
      alert('No data to export');
      return;
    }
    
    const zip = new JSZip();
    
    // Create individual JSON files for each submission
    submissions.forEach((submission, index) => {
      // Enrich submission data
      const enrichedSubmission = {
        ...submission,
        browserType: navigator.userAgent,
        timestamp: submission.timestamp || submission.date || new Date().toISOString(),
        exportDate: new Date().toISOString()
      };
      
      // Determine submission type from metadata
      const submissionType = submission.metadata?.submissionType || 
                            submission.formData?.submissionType || 
                            'regular';
      
      // Create timestamp for filename (remove colons and milliseconds for valid filename)
      const timestamp = (submission.timestamp || submission.date || new Date().toISOString())
        .replace(/:/g, '-')
        .replace(/\..+/, ''); // Remove milliseconds
      
      // Create filename: submissionType-timestamp.json
      const filename = `${submissionType}-${timestamp}.json`;
      
      // Add file to zip
      const jsonData = JSON.stringify(enrichedSubmission, null, 2);
      zip.file(filename, jsonData);
    });
    
    // Generate zip file and trigger download
    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `kg-metadata-export-${new Date().toISOString().slice(0,10)}.zip`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Error creating export file. Please try again.');
    }
  };

  const downloadSemanticJSON = async () => {
    if (submissions.length === 0) {
      alert('No data to export');
      return;
    }
    
    const zip = new JSZip();
    
    // Create individual JSON files for each submission with semantic field names
    submissions.forEach((submission, index) => {
      // Enrich submission data
      const enrichedSubmission = {
        ...submission,
        browserType: navigator.userAgent,
        timestamp: submission.timestamp || submission.date || new Date().toISOString(),
        exportDate: new Date().toISOString()
      };
      
      // Convert to semantic field names
      const semanticSubmission = convertToSemanticNames(enrichedSubmission);
      
      // Determine submission type from metadata
      const submissionType = submission.metadata?.submissionType || 
                            submission.formData?.submissionType || 
                            'regular';
      
      // Create timestamp for filename (remove colons and milliseconds for valid filename)
      const timestamp = (submission.timestamp || submission.date || new Date().toISOString())
        .replace(/:/g, '-')
        .replace(/\..+/, ''); // Remove milliseconds
      
      // Create filename: submissionType-timestamp-semantic.json
      const filename = `${submissionType}-${timestamp}-semantic.json`;
      
      // Add file to zip
      const jsonData = JSON.stringify(semanticSubmission, null, 2);
      zip.file(filename, jsonData);
    });
    
    // Generate zip file and trigger download
    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `kg-metadata-semantic-export-${new Date().toISOString().slice(0,10)}.zip`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating semantic zip file:', error);
      alert('Error creating semantic export file. Please try again.');
    }
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
          {isDevMode && (
            <button 
              onClick={downloadJSON}
              disabled={submissions.length === 0}
              className="download-button"
            >
              Export JSON
            </button>
          )}
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