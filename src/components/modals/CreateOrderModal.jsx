import React, { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { orderService } from '../../services/orderService';

const MAX_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXT = ['.zip', '.rar', '.7z', '.gbr', '.ger', '.xlsx', '.csv', '.txt'];

function getExt(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function formatSize(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

const CreateOrderModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pcb_quantity: 10,
    pcb_width: 100,
    pcb_height: 80,
    layer_count: 2,
    material: 'FR-4',
    smt_required: false,
    components_qty: 0
  });

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uiMessage, setUiMessage] = useState('');

  const accept = useMemo(() => ({
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z'],
    'application/octet-stream': ['.gbr', '.ger', '.txt'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/csv': ['.csv'],
  }), []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: true,
    maxSize: MAX_SIZE,
    onDrop: (acceptedFiles) => {
      // фильтр по расширениям (dropzone иногда пропускает по mime)
      const valid = [];
      for (const f of acceptedFiles) {
        const ext = getExt(f.name);
        if (!ALLOWED_EXT.includes(ext)) {
          setUiMessage(`❌ File type not allowed: ${f.name}`);
          continue;
        }
        valid.push(f);
      }
      // не дублируем
      setFiles(prev => {
        const next = [...prev];
        for (const f of valid) {
          const exists = next.some(x => x.name === f.name && x.size === f.size);
          if (!exists) next.push(f);
        }
        return next;
      });
    },
    onDropRejected: (rejections) => {
      const first = rejections?.[0];
      if (!first) return;
      const reason = first.errors?.[0]?.message || 'File rejected';
      setUiMessage(`❌ ${first.file.name}: ${reason}`);
    }
  });

  const removeFile = (fileName, fileSize) => {
    setFiles(prev => prev.filter(f => !(f.name === fileName && f.size === fileSize)));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setUiMessage('');
    setProgress(0);

    try {
      // 1) создаём заказ
      const created = await onSubmit(formData); // ВАЖНО: пусть onSubmit вернёт объект заказа
      const orderId = created?.id || created?.order_id || created?.order?.id;

      if (!orderId) {
        throw new Error('Order created but no orderId returned from API');
      }

      // 2) загружаем файлы (как в HTML: по одному)
      if (files.length > 0) {
        await orderService.uploadFilesSequential(orderId, files, (percent, meta) => {
          setProgress(percent);
        });
      }

      setUiMessage(`✅ Order created${files.length ? ' and files uploaded' : ''}`);
      onClose();
    } catch (error) {
      setUiMessage(`❌ ${error.message || 'Failed'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal wide">
        <div className="modal-header">
          <h3><i className="fas fa-microchip"></i> Create New Order</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* ✅ Upload block (как в HTML/скрине) */}
          <div
            {...getRootProps()}
            className={`file-upload-area ${isDragActive ? 'dragover' : ''}`}
          >
            <input {...getInputProps()} />
            <i className="fas fa-cloud-upload-alt fa-3x"></i>
            <h3>Upload Gerber &amp; BOM Files</h3>
            <p>Drag &amp; drop or click to browse</p>
            <p className="file-types">
              <small>Supported: .zip, .rar, .7z, .gbr, .ger, .xlsx, .csv, .txt</small><br/>
              <small>Max 50MB per file</small>
            </p>

            <button type="button" className="btn btn-outline">
              <i className="fas fa-folder-open"></i> Browse Files
            </button>
          </div>

          {files.length > 0 && (
            <div className="selected-files">
              <h4>Selected Files ({files.length}):</h4>
              {files.map((file) => (
                <div key={`${file.name}-${file.size}`} className="file-item">
                  <div className="file-info">
                    <i className="fas fa-file"></i>
                    <div>
                      <div className="file-name">{file.name}</div>
                      <div className="file-size">{formatSize(file.size)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="file-remove"
                    onClick={() => removeFile(file.name, file.size)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Прогресс (процент от количества файлов) */}
          {uploading && files.length > 0 && (
            <div style={{ margin: '0.75rem 0' }}>
              <div style={{
                height: 10,
                borderRadius: 999,
                background: 'var(--border-soft)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'var(--primary)',
                  transition: 'width 200ms ease'
                }} />
              </div>
              <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 14 }}>
                Uploading… {progress}%
              </div>
            </div>
          )}

          {uiMessage && (
            <div className={`message ${uiMessage.startsWith('✅') ? 'success' : 'error'}`}>
              {uiMessage}
            </div>
          )}

          {/* Твоя форма (оставил как была) */}
          <div className="form-group">
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
          </div>

          <div className="form-group">
            <label className="form-label required">
              <i className="fas fa-align-left"></i> Description *
            </label>
            <textarea
              name="description"
              className="form-textarea"
              required
              placeholder="Describe your PCB requirements, components, special instructions..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div className="section-title">
            <i className="fas fa-cogs"></i> PCB Specifications
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">
                <i className="fas fa-cubes"></i> Quantity *
              </label>
              <input
                type="number"
                name="pcb_quantity"
                className="form-input"
                required
                min="1"
                value={formData.pcb_quantity}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">
                <i className="fas fa-layer-group"></i> Layers *
              </label>
              <select
                name="layer_count"
                className="form-select"
                required
                value={formData.layer_count}
                onChange={handleInputChange}
              >
                <option value="1">1 Layer</option>
                <option value="2">2 Layers</option>
                <option value="4">4 Layers</option>
                <option value="6">6 Layers</option>
                <option value="8">8 Layers</option>
                <option value="12">12 Layers</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label required">
                <i className="fas fa-arrows-alt-h"></i> Width (mm) *
              </label>
              <input
                type="number"
                name="pcb_width"
                className="form-input"
                required
                min="1"
                value={formData.pcb_width}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label required">
                <i className="fas fa-arrows-alt-v"></i> Height (mm) *
              </label>
              <input
                type="number"
                name="pcb_height"
                className="form-input"
                required
                min="1"
                value={formData.pcb_height}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">
              <i className="fas fa-shield-alt"></i> Material *
            </label>
            <select
              name="material"
              className="form-select"
              required
              value={formData.material}
              onChange={handleInputChange}
            >
              <option value="FR-4">FR-4 Standard</option>
              <option value="FR-4-High-Tg">FR-4 High Tg</option>
              <option value="Rogers">Rogers (RF/Microwave)</option>
              <option value="Aluminum">Aluminum Base</option>
              <option value="Polyimide">Polyimide (Flex)</option>
              <option value="Ceramic">Ceramic</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Submit Order
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
