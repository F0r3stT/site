// src/services/orderService.js
import api from './api';

const ALLOWED_EXT = ['.zip', '.rar', '.7z', '.gbr', '.ger', '.xlsx', '.csv', '.txt'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function getExt(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function validateFile(file) {
  const ext = getExt(file.name);

  if (!ALLOWED_EXT.includes(ext)) {
    return `File type not allowed: ${file.name}. Allowed: ${ALLOWED_EXT.join(', ')}`;
  }
  if (file.size > MAX_SIZE) {
    return `File too large: ${file.name}. Max size: 50MB`;
  }
  return null;
}

export const orderService = {
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  async getUserOrders() {
    const response = await api.get('/orders');
    return response.data;
  },
    async deleteOrder(orderId) {
      const res = await api.delete(`/orders/${orderId}`);
      return res.data;
    },
  // ✅ один файл на запрос — как в upload-file.html
  async uploadOrderFile(orderId, file, type) {
    const err = validateFile(file);
    if (err) throw new Error(err);

    const formData = new FormData();
    formData.append('file', file);         // ВАЖНО: 'file'
    if (type) formData.append('type', type); // опционально на будущее (gerber/bom)

    const response = await api.post(`/orders/${orderId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data;
  },

  // ✅ последовательная загрузка, прогресс как % файлов
  async uploadFilesSequential(orderId, files, onProgress) {
    const total = files.length;
    const results = [];

    for (let i = 0; i < total; i++) {
      const file = files[i];

      // type можно определить по расширению (если хочешь)
      const ext = getExt(file.name);
      const type =
        ['.zip', '.rar', '.7z', '.gbr', '.ger'].includes(ext) ? 'gerber' :
        ['.xlsx', '.csv', '.txt'].includes(ext) ? 'bom' :
        undefined;

      const res = await this.uploadOrderFile(orderId, file, type);
      results.push(res);

      if (onProgress) {
        const percent = Math.round(((i + 1) / total) * 100);
        onProgress(percent, { index: i, total, fileName: file.name });
      }
    }

    return results;
  },

  async getStats() {
    try {
      const response = await api.get('/stats');
      return response.data;
    } catch (error) {
      return { active_orders: 5, completed_projects: 24, pending_quotes: 3 };
    }
  }
};
