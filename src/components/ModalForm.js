import React, { useState } from 'react';

function ModalForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CSV',
    file: null
  });
  
  const [fileName, setFileName] = useState('Choose file...');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setFormData({
        ...formData,
        file: file
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    
    try {
      // Validate file selection
      if (!formData.file) {
        setMessage('Please select a file');
        setIsSubmitting(false);
        return;
      }
      
      // Submit form data to parent component
      const result = await onSubmit(formData);
      
      if (result.success) {
        // Close modal on success
        onClose();
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Mapping</h2>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {message && <div className={message.includes('success') ? 'success-message' : 'error-message'}>{message}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">
                Name <span className="required">(required)</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">
                Description <span className="required">(required)</span>
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="type">
                Type <span className="required">(required)</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="CSV">CSV</option>
                <option value="JSON">JSON</option>
                <option value="XML">XML</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="file">
                File <span className="required">(required)</span>
              </label>
              <div className="file-upload">
                <label className="file-upload-label">
                  <span className="file-name">{fileName}</span>
                  <span className="browse-button">Browse</span>
                  <input 
                    type="file" 
                    id="file" 
                    className="file-upload-input"
                    accept=".csv,.json,.xml"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button 
            className="cancel-button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="submit-button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalForm;
