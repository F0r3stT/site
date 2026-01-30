import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import '../styles/modals.css';

const OrderUpload = () => {
  const [orderId, setOrderId] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/zip': ['.zip', '.rar', '.7z'],
      'application/octet-stream': ['.gbr', '.ger'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId || files.length === 0) {
      setMessage('Please enter Order ID and select files');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/v1/orders/${orderId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setMessage('Files uploaded successfully!');
        setFiles([]);
        setOrderId('');
      } else {
        const error = await response.json();
        setMessage(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };

  return (
    <div className="container upload-page">
      <h1 className="page-title">
        <i className="fas fa-file-upload"></i> Upload Files
      </h1>

      <div className="auth-info">
        <strong>Authentication Status:</strong>
        <span>✅ Logged in</span>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="orderId">Order ID:</label>
          <input
            type="text"
            id="orderId"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter order ID"
            required
          />
          <small>Get order ID from created orders</small>
        </div>

        <div
          {...getRootProps()}
          className={`file-upload-area ${isDragActive ? 'dragover' : ''}`}
        >
          <input {...getInputProps()} />
          <i className="fas fa-cloud-upload-alt fa-3x"></i>
          <h3>Drag & Drop Files Here</h3>
          <p>or click to browse</p>
          <p className="file-types">
            <small>Max file size: 50MB per file</small><br />
            <small>Supported: .zip .rar .7z .gbr .ger .xlsx .csv .txt</small>
          </p>
          <button type="button" className="btn btn-outline">
            <i className="fas fa-folder-open"></i> Select Files
          </button>
        </div>

        {files.length > 0 && (
          <div className="selected-files">
            <h4>Selected Files ({files.length}):</h4>
            {files.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-info">
                  <i className="fas fa-file"></i>
                  <div>
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">
                      {(file.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="file-remove"
                  onClick={() => removeFile(file.name)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!orderId || files.length === 0 || uploading}
        >
          {uploading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Uploading...
            </>
          ) : (
            <>
              <i className="fas fa-upload"></i> Upload Files
            </>
          )}
        </button>
      </form>

      <div className="back-links">
        <a href="/dashboard" className="back-link">
          <i className="fas fa-arrow-left"></i> Back to Dashboard
        </a>
      </div>
    </div>
  );
};

export default OrderUpload;