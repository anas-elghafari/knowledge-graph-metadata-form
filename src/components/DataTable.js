// src/components/DataTable.js - Updated for offline usage
import React from 'react';
import Papa from 'papaparse';

function DataTable({ submissions }) {
  const downloadCSV = () => {
    if (submissions.length === 0) {
      alert('No data to export');
      return;
    }
    
    const csv = Papa.unparse(submissions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `kg-metadata-submissions-${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearSubmissions = () => {
    if (window.confirm('Are you sure you want to clear all submissions? This cannot be undone.')) {
      localStorage.removeItem('kg-metadata-submissions');
      window.location.reload(); // Reload to update the UI
    }
  };

  return (
    <div className="data-table-container">
      <div className="table-header">
        <h2>Submissions ({submissions.length})</h2>
        <div className="table-actions">
          <button 
            onClick={downloadCSV}
            disabled={submissions.length === 0}
            className="download-button"
          >
            Download CSV
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
                <th>Name</th>
                <th>Title</th>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Browser</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.title}</td>
                  <td>{item.id}</td>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                  <td className="browser-info">{item.browser}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data">No submissions yet</p>
      )}
    </div>
  );
}

export default DataTable;