import { IColumnResponse } from "@/types/data";

const API_BASE_URL = "/api/v1";

export const DataService = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/data/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    return response.json();
  },

  getColumns: async (datasetId: string): Promise<IColumnResponse> => {
    const response = await fetch(`${API_BASE_URL}/analysis/columns/${datasetId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
};
