# Data Insights - Interactive Data Analysis Platform

## Overview
Data Insights is a full-stack application that provides real-time data analysis and visualization capabilities. It features data quality assessment, statistical analysis, and interactive visualizations to help users better understand their datasets.

## Features
- File upload and processing
- Data quality analysis
- Statistical summaries
- Missing value detection
- Duplicate value analysis
- Dark/Light mode toggle
- Interactive visualizations
- Real-time data processing

## Tech Stack
- **Frontend**: Next.js, TypeScript, TailwindCSS
- **Backend**: FastAPI, Python, Pandas
- **Data Processing**: NumPy, Pandas

## Project Structure

### Frontend (`/src`)

src/
├── app/ # Next.js app directory
│ ├── page.tsx # Main application page
│ └── layout.tsx # Root layout
├── components/
│ └── data-cleaning/ # Data analysis components
│ ├── DataQuality.tsx
│ ├── DatasetAnalysis.tsx
│ └── DataQualityDashboard.tsx
├── contexts/ # React contexts
├── hooks/ # Custom hooks
├── types/ # TypeScript types
└── utils/ # Utility functions

### Backend (`/backend`)

backend/
├── app/
│ ├── main.py # FastAPI application entry
│ ├── routers/ # API route handlers
│ ├── services/ # Business logic
│ ├── models/ # Data models
│ └── utils/ # Helper functions

## Getting Started

### Backend Setup


Clone the repository
```bash
git clone https://github.com/Gaurav-Wankhede/Data-Insights.git
```
```bash
cd Data-Insights/backend
```
Create virtual environment
```bash
python -m venv venv
source venv/bin/activate # On Windows: .\venv\Scripts\activate
```
Install dependencies
```bash
pip install -r requirements.txt
```
Start the server
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

bash
From project root
```bash
cd src
```
Install dependencies
```bash
npm install
or
yarn install
or
pnpm install
```

Start development server
```bash
npm run dev
or
yarn dev
or
pnpm dev
```

## Environment Variables

### Backend (.env)

```env
UPLOAD_DIR=data/uploads
MAX_FILE_SIZE=10485760
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Features

### Data Quality Analysis
- Column-wise quality metrics
- Missing value detection
- Duplicate value identification
- Data type consistency checks

### Statistical Analysis
- Descriptive statistics
- Distribution analysis
- Correlation studies
- Outlier detection

## API Endpoints
- `/api/v1/data/upload`: File upload endpoint
- `/api/v1/analysis/quality/{dataset_id}`: Data quality analysis
- `/api/v1/analysis/describe/{dataset_id}`: Statistical description
- `/api/v1/analysis/columns/{dataset_id}`: Column information

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
MIT License

## Author
Gaurav Wankhede

## Acknowledgments
- Next.js team for the amazing framework
- FastAPI community for the robust backend framework
- All contributors and users of the platform
