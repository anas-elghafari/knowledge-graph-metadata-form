<div className="modal-overlay">
<div className="modal-content" onClick={e => e.stopPropagation()}>

{message && (
  <div className="floating-message">
    <div className={message.includes('success') ? 'success-message' : 'error-message'}>
      <div className="message-content">{message}</div>
      <button 
        type="button" 
        className="message-close-button" 
        onClick={() => setMessage(null)} 
        aria-label="Dismiss message"
      >
        Dismiss
      </button>
    </div>
  </div>
)}
  <div className="modal-header">
    <h2>Knowledge Graph Metadata</h2>
    <button className="modal-close-button" onClick={onClose}>×</button>
  </div>
  
  <div className="modal-body" onClick={(e) => e.stopPropagation()}>
    
    <form onSubmit={handleSubmit}>
      
      {/* Identifier (now optional, multiple values) */}
      <div className="form-group">
        <label htmlFor="identifier">
          Identifier <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
        </label>
        <div className="tag-input-container">
          <div className="tag-input-row">
            <input
              type="text"
              id="identifier"
              value={identifierInput}
              onChange={(e) => {
                setIdentifierInput(e.target.value);
                setIdentifierInputValid(false);
              }}
              onBlur={() => {
                if (identifierInput.trim()) setIdentifierInputValid(true);
              }}
              onKeyPress={(e) => handleKeyPress(e, 'identifier', identifierInput, setIdentifierInput)}
              className={identifierInputValid ? 'tag-input-valid' : ''}
            />
            <button 
              type="button" 
              className="tag-add-button"
              onClick={() => {
                handleAddTag('identifier', identifierInput, setIdentifierInput);
                setIdentifierInputValid(false);
              }}
            >
              +
            </button>
          </div>
          <div className="tag-list">
            {formData.identifier.map((id, index) => (
              <div key={`identifier-${index}`} className="tag-item tag-item-valid">
                <span className="tag-text">{id}</span>
                <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('identifier', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="type">
          Type <span className="field-indicator required-indicator">required</span>
        </label>
        <div className={`radio-group ${typeValid ? 'form-input-valid' : ''}`}>
          <label className="radio-label">
            <input
              type="radio"
              name="type"
              value="dcat:Dataset"
              checked={formData.type === 'dcat:Dataset'}
              onChange={handleChange}
              className="radio-input"
            />
            dcat:Dataset
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="type"
              value="void:Dataset"
              checked={formData.type === 'void:Dataset'}
              onChange={handleChange}
              className="radio-input"
            />
            void:Dataset
          </label>
        </div>
      </div>
      
      {/* Title */}
      <div className="form-group">
        <label htmlFor="title">
          Title <span className="field-indicator required-indicator">required, 1 value only</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="alternativeTitle">
          Alternative Title <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
        </label>
        <div className="tag-input-container">
          <div className="tag-input-row">
            <input
              type="text"
              id="alternativeTitle"
              value={alternativeTitleInput}
              onChange={(e) => {
                setAlternativeTitleInput(e.target.value);
                setAlternativeTitleInputValid(false);
              }}
              onBlur={() => {
                if (alternativeTitleInput.trim()) setAlternativeTitleInputValid(true);
              }}
              onKeyPress={(e) => handleKeyPress(e, 'alternativeTitle', alternativeTitleInput, setAlternativeTitleInput)}
              className={alternativeTitleInputValid ? 'tag-input-valid' : ''}
            />
            <button 
              type="button" 
              className="tag-add-button"
              onClick={() => {
                handleAddTag('alternativeTitle', alternativeTitleInput, setAlternativeTitleInput);
                setAlternativeTitleInputValid(false);
              }}
            >
              +
            </button>
          </div>
          <div className="tag-list">
            {formData.alternativeTitle.map((title, index) => (
              <div key={`alt-title-${index}`} className="tag-item tag-item-valid">
                <span className="tag-text">{title}</span>
                <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('alternativeTitle', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div className="form-group">
        <label htmlFor="description">
          Description <span className="field-indicator required-indicator">required, 1 value only</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows="3"
        ></textarea>
      </div>
      
      {/* Date fields */}
      <div className="form-group">
        <label htmlFor="createdDate">
          Created Date <span className="field-indicator optional-indicator">optional, 1 value only</span>
        </label>
        <div className="date-input-container">
          <input
            type="text"
            id="createdDate"
            name="createdDate"
            value={formData.createdDate}
            onChange={handleChange}
            onBlur={validateDateInput}
            placeholder="YYYY/MM/DD"
            className={`date-input ${createdDateError ? 'date-input-error' : ''} ${createdDateValid ? 'date-input-valid' : ''}`}
          />
          <input
            type="date"
            className="date-picker-control"
            onChange={(e) => handleDatePickerChange(e, 'createdDate')}
            aria-label="Date picker for Created Date"
          />
        </div>
        {createdDateError && <div className="date-error-message">{createdDateError}</div>}
      </div>
      

      <div className="form-group">
        <label htmlFor="modifiedDate">
          Modified Date <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
        </label>
        <div className="tag-input-container">
          <div className="tag-input-row">
            <input
              type="text"
              id="modifiedDate"
              name="modifiedDate"
              value={modifiedDateInput}
              onChange={(e) => setModifiedDateInput(e.target.value)}
              onBlur={validateDateInput}
              placeholder="YYYY/MM/DD"
              className={`date-input ${modifiedDateError ? 'date-input-error' : ''} ${modifiedDateValid ? 'date-input-valid' : ''}`}
            />
            <input
              type="date"
              className="date-picker-control"
              onChange={(e) => handleDatePickerChange(e, 'modifiedDate')}
              aria-label="Date picker for Modified Date"
            />
            <button 
              type="button" 
              className="tag-add-button"
              onClick={handleAddDate}
              disabled={!modifiedDateInput || modifiedDateError}
            >
              +
            </button>
          </div>
          {modifiedDateError && <div className="date-error-message">{modifiedDateError}</div>}
          <div className="tag-list">
            {formData.modifiedDate.map((date, index) => (
              <div key={`modified-date-${index}`} className="tag-item">
                <span className="tag-text date-tag">{date}</span>
                <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('modifiedDate', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

                  
      <div className="form-group">
        <label htmlFor="publishedDate">
          Published Date <span className="field-indicator required-indicator">required, 1 value only</span>
        </label>
        <div className="date-input-container">
        <input
          type="text"
          id="publishedDate"
          name="publishedDate"
          value={formData.publishedDate}
          onChange={handleChange}
          onBlur={validateDateInput}
          placeholder="YYYY/MM/DD"
          required
          className={`date-input ${publishedDateError ? 'date-input-error' : ''} ${publishedDateValid ? 'date-input-valid' : ''}`}
        />
          <input
            type="date"
            className="date-picker-control"
            onChange={(e) => handleDatePickerChange(e, 'publishedDate')}
            aria-label="Date picker for Published Date"
          />
        </div>
        {publishedDateError && <div className="date-error-message">{publishedDateError}</div>}
      </div>


      <div className="form-group">
      <label htmlFor="vocabulariesUsed">
          Vocabularies Used <span className="field-indicator required-indicator">required, multiple values allowed</span>
      </label>
      <div className="tag-input-container">
          <div className="tag-input-row">
          <input
              type="text"
              id="vocabulariesUsed"
              value={vocabulariesUsedInput}
              onChange={(e) => setVocabulariesUsedInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'vocabulariesUsed', vocabulariesUsedInput, setVocabulariesUsedInput)}
              
          />
          <button 
              type="button" 
              className="tag-add-button"
              onClick={() => handleAddTag('vocabulariesUsed', vocabulariesUsedInput, setVocabulariesUsedInput)}
          >
              +
          </button>
          </div>
          <div className="tag-list">
          {formData.vocabulariesUsed.map((item, index) => (
              <div key={`vocabulary-${index}`} className="tag-item">
              <span className="tag-text">{item}</span>
              <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('vocabulariesUsed', index)}
              >
                  ×
              </button>
              </div>
          ))}
          </div>
          <div className="field-hint"> </div>
      </div>
      </div>

      {/* Metadata Schema [1,∞] - Required, multiple values */}
      <div className="form-group">
      <label htmlFor="metadataSchema">
          Metadata Schema <span className="field-indicator required-indicator">required, multiple values allowed</span>
      </label>
      <div className="tag-input-container">
          <div className="tag-input-row">
          <input
              type="text"
              id="metadataSchema"
              value={metadataSchemaInput}
              onChange={(e) => setMetadataSchemaInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'metadataSchema', metadataSchemaInput, setMetadataSchemaInput)}
              
          />
          <button 
              type="button" 
              className="tag-add-button"
              onClick={() => handleAddTag('metadataSchema', metadataSchemaInput, setMetadataSchemaInput)}
          >
              +
          </button>
          </div>
          <div className="tag-list">
          {formData.metadataSchema.map((item, index) => (
              <div key={`metadata-schema-${index}`} className="tag-item">
              <span className="tag-text">{item}</span>
              <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('metadataSchema', index)}
              >
                  ×
              </button>
              </div>
          ))}
          </div>
          <div className="field-hint"> </div>
      </div>
      </div>

      {/* Primary Reference Document */}
      <div className="form-group">
        <label htmlFor="primaryReferenceDocument">
          Primary Reference Document <span className="field-indicator required-indicator">required, multiple values allowed</span>
        </label>
        <div className="tag-input-container">
          <div className="tag-input-row">
            <input
              type="text"
              id="primaryReferenceDocument"
              value={primaryReferenceDocInput}
              onChange={(e) => setPrimaryReferenceDocInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'primaryReferenceDocument', primaryReferenceDocInput, setPrimaryReferenceDocInput)}
              
            />
            <button 
              type="button" 
              className="tag-add-button"
              onClick={() => handleAddTag('primaryReferenceDocument', primaryReferenceDocInput, setPrimaryReferenceDocInput)}
            >
              +
            </button>
          </div>
          <div className="tag-list">
            {formData.primaryReferenceDocument.map((doc, index) => (
              <div key={`ref-doc-${index}`} className="tag-item">
                <span className="tag-text">{doc}</span>
                <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('primaryReferenceDocument', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="field-hint"> </div>
        </div>
      </div>
      
      {/* Meta Graph */}
      <div className="form-group">
        <label htmlFor="metaGraph">
          Meta Graph <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
        </label>
        <div className="file-upload-section">
          <div className="file-upload-label">
            <span className="file-name">{imageFileName || "No file selected"}</span>
            <button 
              type="button" 
              className="browse-button"
              onClick={() => fileInputRef.current.click()}
            >
              Browse
            </button>
            <input
              type="file"
              id="metaGraph"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="file-upload-input"
              style={{ display: "none" }}
            />
          </div>
          <div className="tag-list">
            {formData.metaGraph.map((graph, index) => (
              <div key={`meta-graph-${index}`} className="tag-item">
                <span className="tag-text">{graph}</span>
                <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('metaGraph', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="field-hint">Upload image files to add to meta graph</div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="form-group">
        <label htmlFor="statistics">
          Statistics <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
        </label>
        <div className="tag-input-container">
          <div className="tag-input-row">
            <input
              type="text"
              id="statistics"
              value={statisticsInput}
              onChange={(e) => setStatisticsInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'statistics', statisticsInput, setStatisticsInput)}
              
            />
            <button 
              type="button" 
              className="tag-add-button"
              onClick={() => handleAddTag('statistics', statisticsInput, setStatisticsInput)}
            >
              +
            </button>
          </div>
          <div className="tag-list">
            {formData.statistics.map((stat, index) => (
              <div key={`stat-${index}`} className="tag-item">
                <span className="tag-text">{stat}</span>
                <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('statistics', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="field-hint"> </div>
        </div>
      </div>

      {/* Acronym */}
      <div className="form-group">
        <label htmlFor="acronym">
          Acronym <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
        </label>
        <div className="tag-input-container">
          <div className="tag-input-row">
            <input
              type="text"
              id="acronym"
              value={acronymInput}
              onChange={(e) => setAcronymInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'acronym', acronymInput, setAcronymInput)}
              
            />
            <button 
              type="button" 
              className="tag-add-button"
              onClick={() => handleAddTag('acronym', acronymInput, setAcronymInput)}
            >
              +
            </button>
          </div>
          <div className="tag-list">
            {formData.acronym.map((acr, index) => (
              <div key={`acronym-${index}`} className="tag-item">
                <span className="tag-text">{acr}</span>
                <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('acronym', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="field-hint"> </div>
        </div>
      </div>
      
      {/* Homepage URL (optional, multiple values allowed, IRIs) */}
      <div className="form-group">
        <label htmlFor="homepageURL">
          Homepage URL <span className="field-indicator optional-indicator">optional, multiple values allowed, IRIs</span>
        </label>
        <div className="tag-input-container">
          <div className="tag-input-row">
          <input
            type="text"
            id="homepageURL"
            name="homepageURLInput"
            value={homepageURLInput}
            onChange={(e) => {
              setHomepageURLInput(e.target.value);
              setHomepageURLInputError('');
              setHomepageURLInputValid(false); // Clear valid state when typing
            }}
            onBlur={validateIriInput}
            onKeyPress={(e) => handleKeyPress(e, 'homepageURL', homepageURLInput, setHomepageURLInput, setHomepageURLInputError)}
            placeholder="Enter IRI and press Enter or +"
            className={`${homepageURLInputError ? 'tag-input-error' : ''} ${homepageURLInputValid ? 'tag-input-valid' : ''}`}
          />
            <button
              type="button"
              className="tag-add-button"
              onClick={() => handleAddTag('homepageURL', homepageURLInput, setHomepageURLInput, setHomepageURLInputError)}
            >
              +
            </button>
          </div>
          {homepageURLInputError && <div className="iri-error-message">{homepageURLInputError}</div>}
          <div className="tag-list">
            {formData.homepageURL.map((url, index) => (
              <div key={`homepage-url-${index}`} className="tag-item">
                <span className="tag-text">{url}</span>
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('homepageURL', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="field-hint">Press Enter or click + to add IRI</div>
        </div>
      </div>
      
     {/* Other Pages (optional, multiple values allowed, IRIs) */}
      <div className="form-group">
        <label htmlFor="otherPages">
          Other Pages <span className="field-indicator optional-indicator">optional, multiple values allowed, IRIs</span>
        </label>
        <div className="tag-input-container">
          <div className="tag-input-row">
            <input
              type="text"
              id="otherPages"
              value={otherPagesInput}
              onChange={(e) => {
                setOtherPagesInput(e.target.value);
                setOtherPagesInputError(''); // Clear error on change
              }}
              onKeyPress={(e) => handleKeyPress(e, 'otherPages', otherPagesInput, setOtherPagesInput, setOtherPagesInputError)}
              placeholder="Enter IRI and press Enter or +"
            />
            <button
              type="button"
              className="tag-add-button"
              onClick={() => handleAddTag('otherPages', otherPagesInput, setOtherPagesInput, setOtherPagesInputError)}
            >
              +
            </button>
          </div>
          {otherPagesInputError && <div className="field-error-message">{otherPagesInputError}</div>}
          <div className="tag-list">
            {formData.otherPages.map((page, index) => (
              <div key={`other-page-${index}`} className="tag-item">
                <span className="tag-text">{page}</span>
                <button
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('otherPages', index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="field-hint">Press Enter or click + to add IRI</div>
        </div>
      </div>
      
      {/* Role fields */}
      <div className="role-section">
          {/* Role: Creator */}
       <div className="form-group">
         <label className="role-label">
           Role: Creator <span className="field-indicator optional-indicator">optional, 1 set of values</span>
         </label>
         <div className="role-fields">
           <div className="role-field">
             <label htmlFor="roleCreatorAgent" className="subfield-label">Agent</label>
             <input
               type="text"
               id="roleCreatorAgent"
               value={formData.roleCreator.agent}
               onChange={(e) => handleRoleChange('roleCreator', 'agent', e.target.value)}
               className="subfield-input"
             />
           </div>
           <div className="role-field">
             <label htmlFor="roleCreatorGivenName" className="subfield-label">Given Name</label>
             <input
               type="text"
               id="roleCreatorGivenName"
               value={formData.roleCreator.givenName}
               onChange={(e) => handleRoleChange('roleCreator', 'givenName', e.target.value)}
               className="subfield-input"
             />
           </div>
           <div className="role-field">
             <label htmlFor="roleCreatorMbox" className="subfield-label">Mbox</label>
             <input
               type="email"
               id="roleCreatorMbox"
               value={formData.roleCreator.mbox}
               onChange={(e) => handleRoleChange('roleCreator', 'mbox', e.target.value)}
               className="subfield-input"
             />
           </div>
         </div>
       </div>
       
       {/* Role: Publisher */}
       <div className="form-group">
         <label className="role-label">
           Role: Publisher <span className="field-indicator optional-indicator">optional, 1 set of values</span>
         </label>
         <div className="role-fields">
           <div className="role-field">
             <label htmlFor="rolePublisherAgent" className="subfield-label">Agent</label>
             <input
               type="text"
               id="rolePublisherAgent"
               value={formData.rolePublisher.agent}
               onChange={(e) => handleRoleChange('rolePublisher', 'agent', e.target.value)}
               className="subfield-input"
             />
           </div>
           <div className="role-field">
             <label htmlFor="rolePublisherGivenName" className="subfield-label">Given Name</label>
             <input
               type="text"
               id="rolePublisherGivenName"
               value={formData.rolePublisher.givenName}
               onChange={(e) => handleRoleChange('rolePublisher', 'givenName', e.target.value)}
               className="subfield-input"
             />
           </div>
           <div className="role-field">
             <label htmlFor="rolePublisherMbox" className="subfield-label">Mbox</label>
             <input
               type="email"
               id="rolePublisherMbox"
               value={formData.rolePublisher.mbox}
               onChange={(e) => handleRoleChange('rolePublisher', 'mbox', e.target.value)}
               className="subfield-input"
             />
           </div>
         </div>
       </div>
       
       {/* Role: Funder */}
       <div className="form-group">
         <label className="role-label">
           Role: Funder <span className="field-indicator optional-indicator">optional, 1 set of values</span>
         </label>
         <div className="role-fields">
           <div className="role-field">
             <label htmlFor="roleFunderAgent" className="subfield-label">Agent</label>
             <input
               type="text"
               id="roleFunderAgent"
               value={formData.roleFunder.agent}
               onChange={(e) => handleRoleChange('roleFunder', 'agent', e.target.value)}
               className="subfield-input"
             />
           </div>
           <div className="role-field">
             <label htmlFor="roleFunderGivenName" className="subfield-label">Given Name</label>
             <input
               type="text"
               id="roleFunderGivenName"
               value={formData.roleFunder.givenName}
               onChange={(e) => handleRoleChange('roleFunder', 'givenName', e.target.value)}
               className="subfield-input"
             />
           </div>
           <div className="role-field">
             <label htmlFor="roleFunderMbox" className="subfield-label">Mbox</label>
             <input
               type="email"
               id="roleFunderMbox"
               value={formData.roleFunder.mbox}
               onChange={(e) => handleRoleChange('roleFunder', 'mbox', e.target.value)}
               className="subfield-input"
             />
           </div>
         </div>
       </div>
     </div>
     
     {/* License */}
     <div className="form-group">
       <label htmlFor="license">
         License <span className="field-indicator required-indicator">required, 1 value only</span>
       </label>
       <input
         type="text"
         id="license"
         name="license"
         value={formData.license}
         onChange={handleChange}
         required
       />
     </div>
     
     {/* Version */}
     <div className="form-group">
       <label htmlFor="version">
         Version <span className="field-indicator required-indicator">required, 1 value only</span>
       </label>
       <input
         type="text"
         id="version"
         name="version"
         value={formData.version}
         onChange={handleChange}
         required
       />
     </div>

     {/* Distributions Section */}
     <div className="form-section">
       <h3 className="section-title">Distributions</h3>
       <div className="field-indicator required-indicator">required, multiple submissions allowed</div>
     </div>

     {/* Display existing distributions */}
     <div className="distributions-list">
       {formData.distributions.map((dist, index) => (
         <div key={`distribution-${index}`} className="distribution-item">
           <div className="distribution-header">
             <div className="distribution-title">{dist.title}</div>
             <div className="distribution-actions">
                  <button 
                    type="button"
                    className="edit-button"
                    onClick={() => {
                      setCurrentDistribution({...dist});
                      handleRemoveDistribution(index);
                      document.querySelector('.distribution-form').scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    type="button"
                    className="tag-remove"
                    onClick={() => handleRemoveDistribution(index)}
                  >
                    ×
                  </button>
                </div>
              </div>
           <div className="distribution-preview">
             <div className="distribution-field">
               <span className="field-label">Description:</span>
               <span className="field-value">{dist.description}</span>
             </div>
             <div className="distribution-field">
               <span className="field-label">Media Type:</span>
               <span className="field-value">{dist.mediaType}</span>
             </div>
             <div className="distribution-field">
               <span className="field-label">Download URL:</span>
               <span className="field-value">{dist.downloadURL}</span>
             </div>
             <div className="distribution-field">
               <span className="field-label">Access URL:</span>
               <span className="field-value">{dist.accessURL}</span>
             </div>
             {dist.accessService && (
               <div className="distribution-field">
                 <span className="field-label">Access Service:</span>
                 <span className="field-value">{dist.accessService}</span>
               </div>
             )}
             {dist.byteSize && (
               <div className="distribution-field">
                 <span className="field-label">Byte Size:</span>
                 <span className="field-value">{dist.byteSize}</span>
               </div>
             )}
             {dist.compressionFormat && (
               <div className="distribution-field">
                 <span className="field-label">Compression Format:</span>
                 <span className="field-value">{dist.compressionFormat}</span>
               </div>
             )}
             {dist.packagingFormat && (
               <div className="distribution-field">
                 <span className="field-label">Packaging Format:</span>
                 <span className="field-value">{dist.packagingFormat}</span>
               </div>
             )}


             {dist.hasPolicy && (
               <div className="distribution-field">
                 <span className="field-label">Has Policy:</span>
                 <span className="field-value">{dist.hasPolicy}</span>
               </div>
             )}
             {dist.license && (
               <div className="distribution-field">
                 <span className="field-label">license:</span>
                 <span className="field-value">{dist.license}</span>
               </div>
             )}
             {dist.rights && (
               <div className="distribution-field">
                 <span className="field-label">Rights:</span>
                 <span className="field-value">{dist.rights}</span>
               </div>
             )}




             {dist.releaseDate && (
               <div className="distribution-field">
                 <span className="field-label">Release Date:</span>
                 <span className="field-value">{formatDate(dist.releaseDate)}</span>
               </div>
             )}
             {dist.modificationDate && (
               <div className="distribution-field">
                 <span className="field-label">Modification Date:</span>
                 <span className="field-value">{formatDate(dist.modificationDate)}</span>
               </div>
             )}
           </div>
         </div>
       ))}
     </div>

     {/* Distribution Form */}
     <div className="distribution-form">
       <div className="distribution-form-header">
         <h4>Add New Distribution</h4>
       </div>
       
       {/* Required distribution fields */}
       <div className="form-group">
         <label htmlFor="distTitle">
           Title <span className="field-indicator required-indicator">required</span>
         </label>
         <input
           type="text"
           id="distTitle"
           value={currentDistribution.title}
           onChange={(e) => handleDistributionChange('title', e.target.value)}
           className="subfield-input"
         />
       </div>
       
       <div className="form-group">
         <label htmlFor="distDescription">
           Description <span className="field-indicator required-indicator">required</span>
         </label>
         <textarea
           id="distDescription"
           value={currentDistribution.description}
           onChange={(e) => handleDistributionChange('description', e.target.value)}
           rows="2"
           className="subfield-input"
         ></textarea>
       </div>
       
       <div className="form-group">
         <label htmlFor="distMediaType">
           Media Type <span className="field-indicator required-indicator">required</span>
         </label>
         <input
           type="text"
           id="distMediaType"
           value={currentDistribution.mediaType}
           onChange={(e) => handleDistributionChange('mediaType', e.target.value)}
           className="subfield-input"
         />
       </div>
       
       <div className="form-group">
         <label htmlFor="distDownloadURL">
           Download URL (dcat:downloadURL) <span className="field-indicator required-indicator">required</span>
         </label>
         <input
           type="url"
           id="distDownloadURL"
           value={currentDistribution.downloadURL}
           onChange={(e) => handleDistributionChange('downloadURL', e.target.value)}
           className="subfield-input"
         />
       </div>
       
       <div className="form-group">
         <label htmlFor="distAccessURL">
           Access URL <span className="field-indicator required-indicator">required</span>
         </label>
         <input
           type="url"
           id="distAccessURL"
           value={currentDistribution.accessURL}
           onChange={(e) => handleDistributionChange('accessURL', e.target.value)}
           className="subfield-input"
         />
       </div>
       
       {/* Optional distribution fields */}
       <div className="form-group">
         <label htmlFor="distAccessService">
           Access Service <span className="field-indicator optional-indicator">optional</span>
         </label>
         <input
           type="text"
           id="distAccessService"
           value={currentDistribution.accessService}
           onChange={(e) => handleDistributionChange('accessService', e.target.value)}
           className="subfield-input"
         />
       </div>
       
       <div className="form-group">
         <label htmlFor="distByteSize">
           Byte Size <span className="field-indicator optional-indicator">optional</span>
         </label>
         <input
           type="text"
           id="distByteSize"
           value={currentDistribution.byteSize}
           onChange={(e) => handleDistributionChange('byteSize', e.target.value)}
           className="subfield-input"
         />
       </div>
       
       <div className="form-group">
         <label htmlFor="distCompressionFormat">
           Compression Format <span className="field-indicator optional-indicator">optional</span>
         </label>
         <input
           type="text"
           id="distCompressionFormat"
           value={currentDistribution.compressionFormat}
           onChange={(e) => handleDistributionChange('compressionFormat', e.target.value)}
           className="subfield-input"
         />
       </div>
       
       <div className="form-group">
         <label htmlFor="distPackagingFormat">
           Packaging Format <span className="field-indicator optional-indicator">optional</span>
         </label>
         <input
           type="text"
           id="distPackagingFormat"
           value={currentDistribution.packagingFormat}
           onChange={(e) => handleDistributionChange('packagingFormat', e.target.value)}
           className="subfield-input"
         />
       </div>
       <div className="form-group">
         <label htmlFor="distHasPolicy">
           Has Policy <span className="field-indicator optional-indicator">optional</span>
         </label>
         <input
           type="text"
           id="distHasPolicy"
           value={currentDistribution.hasPolicy}
           onChange={(e) => handleDistributionChange('hasPolicy', e.target.value)}
           className="subfield-input"
         />
       </div>
       
       <div className="form-group">
         <label htmlFor="distLicense">
           License <span className="field-indicator optional-indicator">optional</span>
         </label>
         <input
           type="text"
           id="distLicense"
           value={currentDistribution.license}
           onChange={(e) => handleDistributionChange('license', e.target.value)}
           className="subfield-input"
         />
       </div>
       
       <div className="form-group">
         <label htmlFor="distRights">
           Rights <span className="field-indicator optional-indicator">optional</span>
         </label>
         <input
           type="text"
           id="distRights"
           value={currentDistribution.packagingFormat}
           onChange={(e) => handleDistributionChange('rights', e.target.value)}
           className="subfield-input"
         />
       </div>
      <div className="form-group">
        <label htmlFor="distReleaseDate">
          Release Date <span className="field-indicator optional-indicator">optional</span>
        </label>
        <div className="date-input-container">
          <input
            type="text"
            id="distReleaseDate"
            name="distReleaseDate"
            value={currentDistribution.releaseDate}
            onChange={(e) => handleDistributionChange('releaseDate', e.target.value)}
            onBlur={validateDateInput}
            placeholder="YYYY/MM/DD"
            className={`date-input subfield-input ${distReleaseDateError ? 'date-input-error' : ''}`}
          />
          <input
            type="date"
            className="date-picker-control"
            onChange={(e) => handleDatePickerChange(e, 'distReleaseDate')}
            aria-label="Date picker for Release Date"
            defaultValue=""
            tabIndex="-1"
          />
        </div>
        {distReleaseDateError && <div className="date-error-message">{distReleaseDateError}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="distModificationDate">
          Update/Modification Date <span className="field-indicator optional-indicator">optional</span>
        </label>
        <div className="date-input-container">
          <input
            type="text"
            id="distModificationDate"
            name="distModificationDate"
            value={currentDistribution.modificationDate}
            onChange={(e) => handleDistributionChange('modificationDate', e.target.value)}
            onBlur={validateDateInput}
            placeholder="YYYY/MM/DD"
            className={`date-input subfield-input ${distModificationDateError ? 'date-input-error' : ''}`}
          />
          <input
            type="date"
            className="date-picker-control"
            onChange={(e) => handleDatePickerChange(e, 'distModificationDate')}
            aria-label="Date picker for Modification Date"
            defaultValue=""
            tabIndex="-1"
          />
        </div>
        {distModificationDateError && <div className="date-error-message">{distModificationDateError}</div>}
      </div>

       
      
       <div className="distribution-actions">
         <button 
           type="button" 
           className="add-button"
           onClick={handleAddDistribution}
         >
           Add Distribution
         </button>
       </div>
     </div>
     
     <div className="form-group">
      <label htmlFor="restAPI">
          REST API <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
      </label>
      <div className="tag-input-container">
          <div className="tag-input-row">
          <input
              type="text"
              id="restAPI"
              value={restAPIInput}
              onChange={(e) => setRestAPIInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'restAPI', restAPIInput, setRestAPIInput)}
              
          />
          <button 
              type="button" 
              className="tag-add-button"
              onClick={() => handleAddTag('restAPI', restAPIInput, setRestAPIInput)}
          >
              +
          </button>
          </div>
          <div className="tag-list">
          {formData.restAPI.map((item, index) => (
              <div key={`rest-api-${index}`} className="tag-item">
              <span className="tag-text">{item}</span>
              <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('restAPI', index)}
              >
                  ×
              </button>
              </div>
          ))}
          </div>
          <div className="field-hint"> </div>
      </div>
      </div>

      {/* SPARQL Endpoint [0,∞] - Optional, multiple values */}
      <div className="form-group">
      <label htmlFor="sparqlEndpoint">
          SPARQL Endpoint <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
      </label>
      <div className="tag-input-container">
          <div className="tag-input-row">
          <input
              type="text"
              id="sparqlEndpoint"
              value={sparqlEndpointInput}
              onChange={(e) => setSparqlEndpointInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'sparqlEndpoint', sparqlEndpointInput, setSparqlEndpointInput)}
              
          />
          <button 
              type="button" 
              className="tag-add-button"
              onClick={() => handleAddTag('sparqlEndpoint', sparqlEndpointInput, setSparqlEndpointInput)}
          >
              +
          </button>
          </div>
          <div className="tag-list">
          {formData.sparqlEndpoint.map((item, index) => (
              <div key={`sparql-endpoint-${index}`} className="tag-item">
              <span className="tag-text">{item}</span>
              <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('sparqlEndpoint', index)}
              >
                  ×
              </button>
              </div>
          ))}
          </div>
          <div className="field-hint"> </div>
      </div>
      </div>

      {/* Example Queries [0,∞] - Optional, multiple values */}
      <div className="form-group">
      <label htmlFor="exampleQueries">
          Example Queries <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
      </label>
      <div className="tag-input-container">
          <div className="tag-input-row">
          <input
              type="text"
              id="exampleQueries"
              value={exampleQueriesInput}
              onChange={(e) => setExampleQueriesInput(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'exampleQueries', exampleQueriesInput, setExampleQueriesInput)}
              
          />
          <button 
              type="button" 
              className="tag-add-button"
              onClick={() => handleAddTag('exampleQueries', exampleQueriesInput, setExampleQueriesInput)}
          >
              +
          </button>
          </div>
          <div className="tag-list">
          {formData.exampleQueries.map((item, index) => (
              <div key={`example-query-${index}`} className="tag-item">
              <span className="tag-text">{item}</span>
              <button 
                  type="button"
                  className="tag-remove"
                  onClick={() => handleRemoveTag('exampleQueries', index)}
              >
                  ×
              </button>
              </div>
          ))}
          </div>
          <div className="field-hint"> </div>
      </div>
  </div>

     {/* Keywords [1,∞] - Required, multiple values */}
     <div className="form-group">
       <label htmlFor="keywords">
         Keywords <span className="field-indicator required-indicator">required, multiple values allowed</span>
       </label>
       <div className="tag-input-container">
         <div className="tag-input-row">
           <input
             type="text"
             id="keywords"
             value={keywordsInput}
             onChange={(e) => setKeywordsInput(e.target.value)}
             onKeyPress={(e) => handleKeyPress(e, 'keywords', keywordsInput, setKeywordsInput)}
             
           />
           <button 
             type="button" 
             className="tag-add-button"
             onClick={() => handleAddTag('keywords', keywordsInput, setKeywordsInput)}
           >
             +
           </button>
         </div>
         <div className="tag-list">
           {formData.keywords.map((keyword, index) => (
             <div key={`keyword-${index}`} className="tag-item">
               <span className="tag-text">{keyword}</span>
               <button 
                 type="button"
                 className="tag-remove"
                 onClick={() => handleRemoveTag('keywords', index)}
               >
                 ×
               </button>
             </div>
           ))}
         </div>
         <div className="field-hint"> </div>
       </div>
     </div>

     {/* Category [0,∞] - Optional, multiple values */}
     <div className="form-group">
       <label htmlFor="category">
         Category <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
       </label>
       <div className="tag-input-container">
         <div className="tag-input-row">
           <input
             type="text"
             id="category"
             value={categoryInput}
             onChange={(e) => setCategoryInput(e.target.value)}
             onKeyPress={(e) => handleKeyPress(e, 'category', categoryInput, setCategoryInput)}
             
           />
           <button 
             type="button" 
             className="tag-add-button"
             onClick={() => handleAddTag('category', categoryInput, setCategoryInput)}
           >
             +
           </button>
         </div>
         <div className="tag-list">
           {formData.category.map((cat, index) => (
             <div key={`category-${index}`} className="tag-item">
               <span className="tag-text">{cat}</span>
               <button 
                 type="button"
                 className="tag-remove"
                 onClick={() => handleRemoveTag('category', index)}
               >
                 ×
               </button>
             </div>
           ))}
         </div>
         <div className="field-hint"> </div>
       </div>
     </div>

     {/* Publication/References [0,∞] - Optional, multiple values */}
     <div className="form-group">
       <label htmlFor="publicationReferences">
         Publication/References <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
       </label>
       <div className="tag-input-container">
         <div className="tag-input-row">
           <input
             type="text"
             id="publicationReferences"
             value={publicationReferencesInput}
             onChange={(e) => setPublicationReferencesInput(e.target.value)}
             onKeyPress={(e) => handleKeyPress(e, 'publicationReferences', publicationReferencesInput, setPublicationReferencesInput)}
             
           />
           <button 
             type="button" 
             className="tag-add-button"
             onClick={() => handleAddTag('publicationReferences', publicationReferencesInput, setPublicationReferencesInput)}
           >
             +
           </button>
         </div>
         <div className="tag-list">
           {formData.publicationReferences.map((ref, index) => (
             <div key={`pub-ref-${index}`} className="tag-item">
               <span className="tag-text">{ref}</span>
               <button 
                 type="button"
                 className="tag-remove"
                 onClick={() => handleRemoveTag('publicationReferences', index)}
               >
                 ×
               </button>
             </div>
           ))}
         </div>
         <div className="field-hint"> </div>
       </div>
     </div>

     {/* Language [1,∞] - Required, multiple values */}
     <div className="form-group">
       <label htmlFor="language">
         Language <span className="field-indicator required-indicator">required, multiple values allowed</span>
       </label>
       <div className="tag-input-container">
         <div className="tag-input-row">
           <input
             type="text"
             id="language"
             value={languageInput}
             onChange={(e) => setLanguageInput(e.target.value)}
             onKeyPress={(e) => handleKeyPress(e, 'language', languageInput, setLanguageInput)}
             
           />
           <button 
             type="button" 
             className="tag-add-button"
             onClick={() => handleAddTag('language', languageInput, setLanguageInput)}
           >
             +
           </button>
         </div>
         <div className="tag-list">
           {formData.language.map((lang, index) => (
             <div key={`language-${index}`} className="tag-item">
               <span className="tag-text">{lang}</span>
               <button 
                 type="button"
                 className="tag-remove"
                 onClick={() => handleRemoveTag('language', index)}
               >
                 ×
               </button>
             </div>
           ))}
         </div>
         <div className="field-hint"> </div>
       </div>
     </div>

     {/* IRI Template [0,∞] - Optional, multiple values */}
     <div className="form-group">
       <label htmlFor="iriTemplate">
         IRI Template <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
       </label>
       <div className="tag-input-container">
         <div className="tag-input-row">
           <input
             type="text"
             id="iriTemplate"
             value={iriTemplateInput}
             onChange={(e) => setIriTemplateInput(e.target.value)}
             onKeyPress={(e) => handleKeyPress(e, 'iriTemplate', iriTemplateInput, setIriTemplateInput)}
             
           />
           <button 
             type="button" 
             className="tag-add-button"
             onClick={() => handleAddTag('iriTemplate', iriTemplateInput, setIriTemplateInput)}
           >
             +
           </button>
         </div>
         <div className="tag-list">
           {formData.iriTemplate.map((iri, index) => (
             <div key={`iri-${index}`} className="tag-item">
               <span className="tag-text">{iri}</span>
               <button 
                 type="button"
                 className="tag-remove"
                 onClick={() => handleRemoveTag('iriTemplate', index)}
               >
                 ×
               </button>
             </div>
           ))}
         </div>
         <div className="field-hint"> </div>
       </div>
     </div>

     {/* Linked Resources [0,∞] - Optional, multiple values */}
     <div className="form-group">
       <label htmlFor="linkedResources">
         Linked Resources <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
       </label>
       <div className="tag-input-container">
         <div className="tag-input-row">
           <input
             type="text"
             id="linkedResources"
             value={linkedResourcesInput}
             onChange={(e) => setLinkedResourcesInput(e.target.value)}
             onKeyPress={(e) => handleKeyPress(e, 'linkedResources', linkedResourcesInput, setLinkedResourcesInput)}
             
           />
           <button 
             type="button" 
             className="tag-add-button"
             onClick={() => handleAddTag('linkedResources', linkedResourcesInput, setLinkedResourcesInput)}
           >
             +
           </button>
         </div>
         <div className="tag-list">
           {formData.linkedResources.map((resource, index) => (
             <div key={`linked-resource-${index}`} className="tag-item">
               <span className="tag-text">{resource}</span>
               <button 
                 type="button"
                 className="tag-remove"
                 onClick={() => handleRemoveTag('linkedResources', index)}
               >
                 ×
               </button>
             </div>
           ))}
         </div>
         <div className="field-hint"> </div>
       </div>
     </div>

     {/* Example Resource [0,∞] - Optional, multiple values */}
     <div className="form-group">
       <label htmlFor="exampleResource">
         Example Resource <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
       </label>
       <div className="tag-input-container">
         <div className="tag-input-row">
           <input
             type="text"
             id="exampleResource"
             value={exampleResourceInput}
             onChange={(e) => setExampleResourceInput(e.target.value)}
             onKeyPress={(e) => handleKeyPress(e, 'exampleResource', exampleResourceInput, setExampleResourceInput)}
             
           />
           <button 
             type="button" 
             className="tag-add-button"
             onClick={() => handleAddTag('exampleResource', exampleResourceInput, setExampleResourceInput)}
           >
             +
           </button>
         </div>
         <div className="tag-list">
           {formData.exampleResource.map((example, index) => (
             <div key={`example-resource-${index}`} className="tag-item">
               <span className="tag-text">{example}</span>
               <button 
                 type="button"
                 className="tag-remove"
                 onClick={() => handleRemoveTag('exampleResource', index)}
               >
                 ×
               </button>
             </div>
           ))}
         </div>
         <div className="field-hint"> </div>
       </div>
     </div>

     {/* Access Statement [1] - Required, single value */}
     <div className="form-group">
       <label htmlFor="accessStatement">
         Access Statement <span className="field-indicator required-indicator">required, 1 value only</span>
       </label>
       <textarea
         id="accessStatement"
         name="accessStatement"
         value={formData.accessStatement}
         onChange={handleChange}
         required
         rows="3"
       ></textarea>
     </div>

     {/* Source [0,∞] - Optional, multiple values */}
     <div className="form-group">
       <label htmlFor="source">
         Source <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
       </label>
       <div className="tag-input-container">
         <div className="tag-input-row">
           <input
             type="text"
             id="source"
             value={sourceInput}
             onChange={(e) => setSourceInput(e.target.value)}
             onKeyPress={(e) => handleKeyPress(e, 'source', sourceInput, setSourceInput)}
             
           />
           <button 
             type="button" 
             className="tag-add-button"
             onClick={() => handleAddTag('source', sourceInput, setSourceInput)}
           >
             +
           </button>
         </div>
         <div className="tag-list">
           {formData.source.map((src, index) => (
             <div key={`source-${index}`} className="tag-item">
               <span className="tag-text">{src}</span>
               <button 
                 type="button"
                 className="tag-remove"
                 onClick={() => handleRemoveTag('source', index)}
               >
                 ×
               </button>
             </div>
           ))}
         </div>
         <div className="field-hint"> </div>
       </div>
     </div>

     {/* Name Space [0,∞] - Optional, multiple values */}
     <div className="form-group">
       <label htmlFor="nameSpace">
         Name Space <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
       </label>
       <div className="tag-input-container">
         <div className="tag-input-row">
           <input
             type="text"
             id="nameSpace"
             value={nameSpaceInput}
             onChange={(e) => setNameSpaceInput(e.target.value)}
             onKeyPress={(e) => handleKeyPress(e, 'nameSpace', nameSpaceInput, setNameSpaceInput)}
             
           />
           <button 
             type="button" 
             className="tag-add-button"
             onClick={() => handleAddTag('nameSpace', nameSpaceInput, setNameSpaceInput)}
           >
             +
           </button>
         </div>
         <div className="tag-list">
           {formData.nameSpace.map((ns, index) => (
             <div key={`namespace-${index}`} className="tag-item">
               <span className="tag-text">{ns}</span>
               <button 
                 type="button"
                 className="tag-remove"
                 onClick={() => handleRemoveTag('nameSpace', index)}
               >
                 ×
               </button>
             </div>
           ))}
         </div>
         <div className="field-hint"> </div>
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
    className="save-draft-button"
  onClick={handleSaveDraft}
  >
    Save Draft
  </button>

   <button 
     className="submit-button"
     onClick={handleSubmit}
     disabled={isSubmitting}
   >
     {isSubmitting ? 'Submitting...' : 'Submit'}
   </button>
 </div>
</div>
</div>
);
}