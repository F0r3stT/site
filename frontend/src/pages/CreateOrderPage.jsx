// src/pages/CreateOrderPage.jsx
import React, { useMemo, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { AuthContext } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import '../styles/CreateOrderPage.css';

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXT = ['.zip', '.rar', '.7z', '.gbr', '.ger', '.xlsx', '.csv', '.txt'];

// Компонент для шага "Order Details"
const StepOrderDetails = React.memo(({ 
  formData, 
  files, 
  getRootProps, 
  getInputProps, 
  isDragActive, 
  isHoveringDropzone,
  handleInputChange, 
  removeFile,
  onMouseEnterDropzone,
  onMouseLeaveDropzone
}) => {
  const handleBrowseClick = useCallback((e) => {
    e.stopPropagation();
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.click();
  }, []);

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-header-main">
          <div className="step-icon-circle">
            <i className="fas fa-file-alt"></i>
          </div>
          <div>
            <h3>Upload Files & Basic Info</h3>
            <p className="step-subtitle">Start by uploading your Gerber & BOM files and providing a title.</p>
          </div>
        </div>
      </div>

      <div className="file-upload-container">
        <div 
          {...getRootProps()}
          className={`file-upload-area ${isDragActive ? 'dragover' : ''} ${isHoveringDropzone ? 'hovering' : ''}`}
          onMouseEnter={onMouseEnterDropzone}
          onMouseLeave={onMouseLeaveDropzone}
          onClick={(e) => e.stopPropagation()}
        >
          <input {...getInputProps()} />
          <div className="upload-icon-container">
            <i className="fas fa-cloud-upload-alt"></i>
            <div className="upload-ripple"></div>
          </div>
          <h3>Drag & Drop Your Files Here</h3>
          <p className="upload-subtext">Click anywhere or browse to select files</p>
          <div className="file-types">
            <span className="file-type-tag">.zip</span>
            <span className="file-type-tag">.rar</span>
            <span className="file-type-tag">.gbr</span>
            <span className="file-type-tag">.xlsx</span>
            <span className="file-type-tag">.csv</span>
          </div>
          <p className="file-size-limit">
            <i className="fas fa-info-circle"></i> Max 50MB per file
          </p>
          <button 
            type="button" 
            className="btn btn-outline browse-btn"
            onClick={handleBrowseClick}
          >
            <i className="fas fa-folder-open"></i> Browse Files
          </button>
        </div>

        {files.length > 0 && (
          <div className="selected-files-section">
            <div className="section-header">
              <h4>Selected Files ({files.length})</h4>
            </div>
            <div className="files-grid">
              {files.map((file, index) => (
                <div key={`${file.name}-${file.size}-${index}`} className="file-card">
                  <div className="file-card-header">
                    <i className="fas fa-file-alt file-card-icon"></i>
                    <button
                      type="button"
                      className="file-remove-btn"
                      onClick={() => removeFile(file.name, file.size)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="file-card-body">
                    <div className="file-name" title={file.name}>{file.name}</div>
                    <div className="file-details">
                      <span className="file-size">
                        <i className="fas fa-database"></i> {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <span className="file-type">
                        <i className="fas fa-file"></i> {file.name.split('.').pop()?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="form-group premium-input">
          <label className="form-label required">
            <i className="fas fa-heading"></i> Order Title *
          </label>
          <input
            type="text"
            name="title"
            className="form-input"
            required
            placeholder="e.g., Arduino-Compatible Development Board"
            value={formData.title}
            onChange={handleInputChange}
          />
          <div className="input-focus-line"></div>
        </div>

        <div className="form-group premium-input">
          <label className="form-label required">
            <i className="fas fa-align-left"></i> Description *
          </label>
          <textarea
            name="description"
            className="form-textarea"
            required
            rows="4"
            placeholder="Describe your PCB requirements, components, special instructions..."
            value={formData.description}
            onChange={handleInputChange}
          />
          <div className="textarea-focus-border"></div>
        </div>
      </div>
    </div>
  );
});

// Компонент для шага "PCB Specs"
const StepPcbSpecs = React.memo(({ formData, updateFormData, handleInputChange }) => {
  const handleDimensionChange = useCallback((field, delta) => {
    const currentValue = formData[field];
    const newValue = Math.max(1, currentValue + delta);
    updateFormData(field, newValue);
  }, [formData, updateFormData]);

  const handleQuantityChange = useCallback((delta) => {
    const currentValue = formData.pcb_quantity;
    const newValue = Math.max(1, Math.min(1000, currentValue + delta));
    updateFormData('pcb_quantity', newValue);
  }, [formData.pcb_quantity, updateFormData]);

  const handleLayersChange = useCallback((layers) => {
    updateFormData('layer_count', layers);
  }, [updateFormData]);

  const handleMaterialChange = useCallback((material) => {
    updateFormData('material', material);
  }, [updateFormData]);

  const handleSmtToggle = useCallback(() => {
    updateFormData('smt_required', !formData.smt_required);
  }, [formData.smt_required, updateFormData]);

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-header-main">
          <div className="step-icon-circle">
            <i className="fas fa-microchip"></i>
          </div>
          <div>
            <h3>PCB Specifications</h3>
            <p className="step-subtitle">Define the technical parameters of your board.</p>
          </div>
        </div>
      </div>

      <div className="specs-grid">
        <div className="spec-card">
          <div className="spec-card-header">
            <i className="fas fa-cubes"></i>
            <h4>Quantity</h4>
          </div>
          <div className="spec-card-body">
            <div className="quantity-input">
              <div className="input-with-buttons quantity-controls">
                <input
                  type="number"
                  name="pcb_quantity"
                  min="1"
                  max="1000"
                  value={formData.pcb_quantity}
                  onChange={handleInputChange}
                  className="quantity-input-field"
                />
              </div>
              <div className="quantity-range">
                <span>1</span>
                <span>1000</span>
              </div>
            </div>
          </div>
        </div>

        <div className="spec-card dimensions-card">
          <div className="spec-card-header">
            <i className="fas fa-expand-arrows-alt"></i>
            <h4>Dimensions</h4>
          </div>
          <div className="spec-card-body">
            <div className="dimensions-grid">
              <div className="dimension-input">
                <label className="dimension-label">Width (mm)</label>
                <div className="input-with-buttons dimension-controls">
                  <input
                    type="number"
                    name="pcb_width"
                    min="1"
                    max="500"
                    value={formData.pcb_width}
                    onChange={handleInputChange}
                    className="dimension-input-field"/>
                </div>
              </div>
              <div className="dimension-input">
                <label className="dimension-label">Height (mm)</label>
                <div className="input-with-buttons dimension-controls">
                  <input
                    type="number"
                    name="pcb_height"
                    min="1"
                    max="500"
                    value={formData.pcb_height}
                    onChange={handleInputChange}
                    className="dimension-input-field"
                  />
                </div>
              </div>
            </div>
            <div className="dimensions-range">
              <span>1mm</span>
              <span>500mm</span>
            </div>
          </div>
        </div>

        <div className="spec-card">
          <div className="spec-card-header">
            <i className="fas fa-layer-group"></i>
            <h4>Layers</h4>
          </div>
          <div className="spec-card-body layers-selector">
            {[1, 2, 4, 6, 8, 12].map(layers => (
              <button
                key={layers}
                type="button"
                className={`layer-option ${formData.layer_count === layers ? 'selected' : ''}`}
                onClick={() => handleLayersChange(layers)}
              >
                <span className="layer-count">{layers}</span>
                <span className="layer-text">{layers === 1 ? 'Layer' : 'Layers'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="spec-card">
          <div className="spec-card-header">
            <i className="fas fa-shield-alt"></i>
            <h4>Material</h4>
          </div>
          <div className="spec-card-body materials-grid">
            {[
              { value: 'FR-4', label: 'FR-4 Standard' },
              { value: 'FR-4-High-Tg', label: 'FR-4 High Tg' },
              { value: 'Rogers', label: 'Rogers' },
              { value: 'Aluminum', label: 'Aluminum'},
              { value: 'Polyimide', label: 'Polyimide'},
              { value: 'Ceramic', label: 'Ceramic' }
            ].map(material => (
              <button
                type="button"
                key={material.value}
                className={`material-option ${formData.material === material.value ? 'selected' : ''}`}
                onClick={() => handleMaterialChange(material.value)}
              >
                <span>{material.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="additional-specs">
        <div className="toggle-card">
          <label className="toggle-label">
            <div className="toggle-header">
              <div className="toggle-icon">
                <i className="fas fa-industry"></i>
              </div>
              <div>
                <div className="toggle-title">SMT Assembly Required</div>
                <div className="toggle-description">Surface Mount Technology component placement</div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="smt_required"
                checked={formData.smt_required}
                onChange={handleSmtToggle}
              />
              <span className="toggle-slider"></span>
            </label>
          </label>
          {formData.smt_required && (
            <div className="toggle-content">
              <div className="form-group components-qty">
                <label>
                  <i className="fas fa-cogs"></i> Components Quantity
                </label>
                <input
                  type="number"
                  name="components_qty"
                  min="0"
                  value={formData.components_qty}
                  onChange={handleInputChange}
                  placeholder="Number of components"
                  className='quantity-input-field'
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Компонент для шага "Shipping & Payment"
const StepShippingPayment = React.memo(({ formData, user, handleInputChange, updateFormData }) => {
  const handlePaymentMethodChange = useCallback((method) => {
    updateFormData('payment_method', method);
  }, [updateFormData]);

  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-header-main">
          <div className="step-icon-circle">
            <i className="fas fa-shipping-fast"></i>
          </div>
          <div>
            <h3>Shipping & Payment Details</h3>
            <p className="step-subtitle">Provide your contact and shipping information.</p>
          </div>
        </div>
      </div>

      <div className="user-info-card">
        <div className="user-info-header">
          <div className="user-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="user-info-details">
            <h5>{user?.company_name || user?.name || 'User'}</h5>
            <p>{user?.email}</p>
          </div>
        </div>
        <p className="user-info-note">
          <i className="fas fa-info-circle"></i>
          We've pre-filled your account information. You can update it below.
        </p>
      </div>

      <div className="form-section premium-form">
        <div className="form-row">
          <div className="form-group floating-label">
            <input
              type="text"
              name="contact_name"
              required
              value={formData.contact_name}
              onChange={handleInputChange}
            />
            <label className='contactname'>
              <i className="fas fa-user"></i> Contact Name *
            </label>
          </div>

          <div className="form-group floating-label">
            <input
              type="email"
              name="contact_email"
              required
              value={formData.contact_email}
              onChange={handleInputChange}
            />
            <label>
              <i className="fas fa-envelope"></i> Email Address *
            </label>
          </div>
        </div>

        <div className="form-group floating-label">
          <textarea
            name="shipping_address"
            required
            rows="3"
            value={formData.shipping_address}
            onChange={handleInputChange}
          />
          <label>
            <i className="fas fa-map-marker-alt"></i> Shipping Address *
          </label>
        </div>

        <div className="form-row">
          <div className="form-group floating-label">
            <input
              type="tel"
              name="shipping_phone"
              required
              value={formData.shipping_phone}
              onChange={handleInputChange}
            />
            <label>
              <i className="fas fa-phone"></i> Phone Number *
            </label>
          </div>

          <div className="payment-methods-section">
            <label className="section-label">
              <i className="fas fa-wallet"></i> Payment Method *
            </label>
            <div className="payment-methods">
              {[
                { value: 'bank_transfer', label: 'Bank Transfer', icon: 'fas fa-university' },
                { value: 'credit_card', label: 'Credit Card', icon: 'fas fa-credit-card' },
                { value: 'paypal', label: 'PayPal', icon: 'fab fa-paypal' },
                { value: 'cryptocurrency', label: 'Crypto', icon: 'fas fa-coins' }
              ].map(method => (
                <div
                  key={method.value}
                  className={`payment-method ${formData.payment_method === method.value ? 'selected' : ''}`}
                  onClick={() => handlePaymentMethodChange(method.value)}
                >
                  <i className={method.icon}></i>
                  <span>{method.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group floating-label">
          <textarea
            name="shipping_notes"
            rows="2"
            value={formData.shipping_notes}
            onChange={handleInputChange}
          />
          <label>
            <i className="fas fa-sticky-note"></i> Additional Notes (Optional)
          </label>
        </div>
      </div>
    </div>
  );
});

// Компонент для шага "Review & Submit"
const StepReviewSubmit = React.memo(({ formData, files, user }) => {
  return (
    <div className="step-content">
      <div className="step-header">
        <div className="step-header-main">
          <div className="step-icon-circle">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <h3>Review Your Order</h3>
            <p className="step-subtitle">Please verify all information before submitting.</p>
          </div>
        </div>
      </div>

      <div className="review-summary">
        <div className="review-section">
          <div className="review-section-header">
            <div className="review-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <h4>Order Details</h4>
          </div>
          <div className="review-grid">
            <div className="review-item">
              <span className="review-label">Title:</span>
              <span className="review-value">{formData.title}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Description:</span>
              <span className="review-value">{formData.description}</span>
            </div>
            <div className="review-item">
              <span className="review-label">Files:</span>
              <span className="review-value">
                {files.length} file(s) selected
                {files.length > 0 && (
                  <span className="file-count-badge">{files.length}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="review-section">
          <div className="review-section-header">
            <div className="review-icon">
              <i className="fas fa-microchip"></i>
            </div>
            <h4>PCB Specifications</h4>
          </div>
          <div className="specs-review-grid">
            <div className="spec-review-card">
              <i className="fas fa-cubes"></i>
              <div className="spec-review-details">
                <span className="spec-label">Quantity</span>
                <span className="spec-value">{formData.pcb_quantity} pcs</span>
              </div>
            </div>
            <div className="spec-review-card">
              <i className="fas fa-expand-arrows-alt"></i>
              <div className="spec-review-details">
                <span className="spec-label">Dimensions</span>
                <span className="spec-value">{formData.pcb_width} × {formData.pcb_height} mm</span>
              </div>
            </div>
            <div className="spec-review-card">
              <i className="fas fa-layer-group"></i>
              <div className="spec-review-details">
                <span className="spec-label">Layers</span>
                <span className="spec-value">{formData.layer_count}</span>
              </div>
            </div>
            <div className="spec-review-card">
              <i className="fas fa-shield-alt"></i>
              <div className="spec-review-details">
                <span className="spec-label">Material</span>
                <span className="spec-value">{formData.material}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="review-section">
          <div className="review-section-header">
            <div className="review-icon">
              <i className="fas fa-shipping-fast"></i>
            </div>
            <h4>Shipping & Payment</h4>
          </div>
          <div className="shipping-review">
            <div className="shipping-info-card">
              <i className="fas fa-user-circle"></i>
              <div className="shipping-info-details">
                <h5>{formData.contact_name}</h5>
                <p>{formData.contact_email}</p>
                <p className="shipping-address">{formData.shipping_address}</p>
                <p className="shipping-phone">
                  <i className="fas fa-phone"></i> {formData.shipping_phone}
                </p>
              </div>
            </div>
            <div className="payment-info-card">
              <div className="payment-method-display">
                <i className="fas fa-wallet"></i>
                <div>
                  <div className="payment-method-name">
                    {formData.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                     formData.payment_method === 'credit_card' ? 'Credit Card' :
                     formData.payment_method === 'paypal' ? 'PayPal' : 'Cryptocurrency'}
                  </div>
                  <div className="payment-note">
                    {formData.shipping_notes || 'No additional notes'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// Основной компонент страницы
const CreateOrderPage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const steps = [
    { key: 'order-details', title: 'Order Details', icon: 'fas fa-file-alt' },
    { key: 'pcb-specs', title: 'PCB Specs', icon: 'fas fa-microchip' },
    { key: 'shipping', title: 'Shipping & Payment', icon: 'fas fa-shipping-fast' },
    { key: 'review', title: 'Review & Submit', icon: 'fas fa-check-circle' }
  ];

  const [currentStep, setCurrentStep] = useState(steps[0].key);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pcb_quantity: 10,
    pcb_width: 100,
    pcb_height: 80,
    layer_count: 2,
    material: 'FR-4',
    thickness: '1.6',
    copper_weight: '1',
    surface_finish: 'HASL',
    solder_mask: 'Green',
    silkscreen: 'White',
    smt_required: false,
    components_qty: 0,
    shipping_address: '',
    shipping_phone: '',
    shipping_notes: '',
    payment_method: 'bank_transfer',
    contact_email: '',
    contact_name: ''
  });

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uiMessage, setUiMessage] = useState('');
  const [isHoveringDropzone, setIsHoveringDropzone] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  
  const formRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contact_email: user.email || '',
        contact_name: user.company_name || user.name || '',
        shipping_address: user.address || '',
        shipping_phone: user.phone || ''
      }));
    }
  }, [user]);

  const handleFileProcessing = useCallback((acceptedFiles) => {
    const valid = [];
    for (const f of acceptedFiles) {
      const i = f.name.lastIndexOf('.');
      const ext = i >= 0 ? f.name.slice(i).toLowerCase() : '';
      if (!ALLOWED_EXT.includes(ext)) {
        setUiMessage(`❌ File type not allowed: ${f.name}`);
        continue;
      }
      valid.push(f);
    }
    
    setFiles(prev => {
      const next = [...prev];
      for (const f of valid) {
        const exists = next.some(x => x.name === f.name && x.size === f.size);
        if (!exists) next.push(f);
      }
      return next;
    });
  }, []);

  const accept = useMemo(() => ({
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z'],
    'application/octet-stream': ['.gbr', '.ger', '.txt'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/csv': ['.csv'],
  }), []);

  const onDropRejected = useCallback((rejections) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const first = rejections?.[0];
      if (!first) return;
      const reason = first.errors?.[0]?.message || 'File rejected';
      setUiMessage(`❌ ${first.file.name}: ${reason}`);
    }, 100);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: true,
    maxSize: MAX_SIZE,
    onDrop: handleFileProcessing,
    onDropRejected,
    noClick: false,
    noKeyboard: false
  });

  const removeFile = useCallback((fileName, fileSize) => {
    setFiles(prev => prev.filter(f => !(f.name === fileName && f.size === fileSize)));
  }, []);

  const updateFormData = useCallback((field, value) => {

    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      updateFormData(
        name, 
        type === 'checkbox' ? checked : 
        ['pcb_quantity', 'pcb_width', 'pcb_height', 'layer_count', 'components_qty'].includes(name) 
          ? Number(value) : value
      );
    }, 10);
  }, [updateFormData]);

  const handleMouseEnterDropzone = useCallback(() => {
    setIsHoveringDropzone(true);
  }, []);

  const handleMouseLeaveDropzone = useCallback(() => {
    setIsHoveringDropzone(false);
  }, []);

  const goToStep = useCallback((stepKey) => {
    setCurrentStep(stepKey);
    setTimeout(() => {
      const formElement = formRef.current;
      if (formElement) {
        const formTop = formElement.getBoundingClientRect().top;
        const scrollTop = window.pageYOffset + formTop - 100; // Отступ 100px
        window.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, []);

  const nextStep = useCallback(() => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex < steps.length - 1) {
      goToStep(steps[currentIndex + 1].key);
    }
  }, [currentStep, steps, goToStep]);

  const prevStep = useCallback(() => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1].key);
    }
  }, [currentStep, steps, goToStep]);

  const handleSubmitOrder = async (e) => {
    if (e) e.preventDefault();
    
    // Защита от двойного сабмита
    if (isFormSubmitted) {
      console.log('Form already submitted, ignoring duplicate submission');
      return;
    }
    
    setIsFormSubmitted(true);
    
    if (uploading) return;
    
    // Валидация обязательных полей
    if (!formData.title || !formData.description) {
      setUiMessage('❌ Please fill in all required fields');
      goToStep('order-details');
      setIsFormSubmitted(false);
      return;
    }
    
    setUploading(true);
    setUiMessage('');
    setProgress(0);

    try {
      const orderPayload = {
        ...formData,
        files: files.map(f => f.name)
      };

      console.log('Submitting order with data:', orderPayload);
      
      const created = await orderService.createOrder(orderPayload);
      const orderId = created?.id || created?.order_id || created?.order?.id;

      if (!orderId) {
        throw new Error('Order created but no orderId returned from API');
      }

      if (files.length > 0) {
        await orderService.uploadFilesSequential(orderId, files, (percent) => {
          setProgress(percent);
        });
      }

      setUiMessage(`✅ Order created successfully! Order ID: ${orderId}`);
      
      setTimeout(() => {
        navigate(`/dashboard`);
      }, 2000);
    } catch (error) {
      console.error('Order submission error:', error);
      setUiMessage(`❌ ${error.message || 'Failed to create order'}`);
      setIsFormSubmitted(false); // Разрешаем повторную попытку при ошибке
    } finally {
      setUploading(false);
    }
  };

  // Убираем useEffect, который мог вызывать submit при переходе на шаг review
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Добавляем console.log для отслеживания изменений payment_method
  useEffect(() => {
    console.log('Current payment method:', formData.payment_method);
  }, [formData.payment_method]);

  return (
    <div className="create-order-page premium-order-page">
      <div className="page-header">
        <div className="header-content">
          <h1><i className="fas fa-plus-circle"></i> Create New PCB Order</h1>
          <p>Follow the steps below to submit your manufacturing order</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn btn-outline btn-back">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="progress-steps-container">
        <div className="steps-track">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
            
            return (
              <div
                key={step.key}
                className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => goToStep(step.key)}
              >
                <div className="step-icon-wrapper">
                  <div className="step-icon-backdrop"></div>
                  <div className="step-icon">
                    {isCompleted ? (
                      <i className="fas fa-check"></i>
                    ) : (
                      <i className={step.icon}></i>
                    )}
                  </div>
                </div>
                <div className="step-info">
                  <div className="step-title">Step {index + 1}: {step.title}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className="step-connector">
                    <div className="step-connector-line"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="order-form-container" ref={formRef}>
        <form onSubmit={handleSubmitOrder} className="order-form">
          {currentStep === 'order-details' && (
            <StepOrderDetails
              formData={formData}
              files={files}
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              isHoveringDropzone={isHoveringDropzone}
              handleInputChange={handleInputChange}
              removeFile={removeFile}
              onMouseEnterDropzone={handleMouseEnterDropzone}
              onMouseLeaveDropzone={handleMouseLeaveDropzone}
            />
          )}
          
          {currentStep === 'pcb-specs' && (
            <StepPcbSpecs
              formData={formData}
              updateFormData={updateFormData}
              handleInputChange={handleInputChange}
            />
          )}
          
          {currentStep === 'shipping' && (
            <StepShippingPayment
              formData={formData}
              user={user}
              handleInputChange={handleInputChange}
              updateFormData={updateFormData}
            />
          )}
          
          {currentStep === 'review' && (
            <StepReviewSubmit
              formData={formData}
              files={files}
              user={user}
            />
          )}

          {uploading && (
            <div className="upload-progress-section">
              <div className="progress-header">
                <i className="fas fa-cloud-upload-alt"></i>
                <span>Uploading files...</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-background"></div>
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">{progress}% complete</div>
            </div>
          )}

          {uiMessage && (
            <div className={`message ${uiMessage.startsWith('✅') ? 'success' : 'error'}`}>
              <i className={`fas ${uiMessage.startsWith('✅') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {uiMessage}
            </div>
          )}

          <div className="step-navigation">
            <div className="navigation-left">
              {currentStep !== steps[0].key && (
                <button 
                  type="button" 
                  className="btn btn-outline btn-prev"
                  onClick={prevStep}
                  disabled={uploading || isFormSubmitted}
                >
                  <i className="fas fa-arrow-left"></i>
                  <span>Previous Step</span>
                </button>
              )}
            </div>
            
            <div className="navigation-right">
              {currentStep !== steps[steps.length - 1].key ? (
                <button 
                  type="button" 
                  className="btn btn-primary btn-next"
                  onClick={nextStep}
                  disabled={!formData.title || !formData.description || uploading || isFormSubmitted}
                >
                  <span>Continue to Next Step</span>
                  <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-success btn-submit"
                  disabled={uploading || isFormSubmitted}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmitOrder(e);
                  }}
                >
                  {uploading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Processing Your Order...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane"></i>
                      <span>Submit Order</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(CreateOrderPage);