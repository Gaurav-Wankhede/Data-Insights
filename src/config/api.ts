export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  endpoints: {
    cleaning: {
      methods: '/api/v1/cleaning/methods',
      process: '/api/v1/cleaning/process'
    },
    analysis: {
      columns: (datasetId: string) => `/api/v1/analysis/columns/${datasetId}`,
      describe: (datasetId: string) => `/api/v1/analysis/describe/${datasetId}`,
      analyze: (datasetId: string, columnName: string) => 
        `/api/v1/analysis/analyze/${datasetId}/${columnName}`
    },
    data: {
      upload: '/api/v1/data/upload',
      datasets: '/api/v1/data/datasets',
      head: (datasetId: string) => `/api/v1/data/head/${datasetId}`
    }
  }
};
