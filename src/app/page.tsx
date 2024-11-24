"use client";

import { useState } from "react";
import Image from "next/image";
import { FileUpload } from "@/components/data-cleaning/FileUpload";
import ModeToggle from "@/components/mode-toggle";
import { useColumns } from "@/contexts/ColumnContext";
import { DatasetHead } from "@/components/data-cleaning/DatasetHead";
import { DatasetAnalysis } from "@/components/data-cleaning/DatasetAnalysis";
import { DataQuality } from "@/components/data-cleaning/DataQuality";
import { UniqueValuesCard } from "@/components/data-cleaning/UniqueValuesCard";
import { MissingValuesCard } from "@/components/data-cleaning/MissingValuesCard";

interface IDatasetAnalysisProps {
  datasetId: string;
  selectedColumns: string[];
}

interface IColumnInfo {
  name: string;
  type: string;
  missing_count: number;
  unique_count: number;
}

interface IColumnResponse {
  success: boolean;
  message: string;
  data: {
    columns: string[];
    column_types: Record<string, string>;
    total_columns: number;
    column_info: IColumnInfo[];
  };
}

export default function Home() {
  const [uploadedDatasetId, setUploadedDatasetId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { columns, setColumns } = useColumns();
  const [activeView, setActiveView] = useState<'statistics' | 'quality'>('statistics');
  const [qualityData, setQualityData] = useState<{
    unique_counts: Record<string, number>;
    missing_counts: Record<string, number>;
    total_rows: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadSuccess = (datasetId: string) => {
    setUploadedDatasetId(datasetId);
    setError(null);
    fetchColumns(datasetId);
    fetchQualityData(datasetId);
  };

  const fetchQualityData = async (datasetId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/analysis/quality/${datasetId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch quality data");
      }

      setQualityData(data.quality_analysis);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch quality data";
      setError(message);
      console.error('Quality data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchColumns = async (datasetId: string) => {
    try {
      const response = await fetch(`/api/v1/analysis/columns/${datasetId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: IColumnResponse = await response.json();
      
      if (data.success && data.data?.column_info) {
        setColumns(data.data.column_info);
      } else {
        throw new Error(data.message || "Invalid column data format");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch columns";
      console.error(message);
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen bg-background relative">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 w-64 h-screen border-r bg-card hover:overflow-y-auto overflow-hidden transition-all duration-300">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Dashboard</h2>
            <ModeToggle />
          </div>

          <FileUpload onUploadSuccess={handleUploadSuccess} />

          {error && (
            <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 ml-64">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
            Real-time Data Analysis
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Interactive dashboard for exploratory data analysis
          </p>
        </header>

        {uploadedDatasetId && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <button 
                onClick={() => setActiveView('statistics')}
                className="p-6 rounded-lg border bg-card shadow-sm hover:bg-accent/50 transition-colors"
              >
                <div className="p-3 rounded-full bg-primary/10 mb-4 w-fit">
                  <Image
                    src="/file.svg"
                    alt="Statistics"
                    width={24}
                    height={24}
                    className="dark:invert"
                  />
                </div>
                <h3 className="font-semibold mb-2">Statistical Summary</h3>
                <p className="text-sm text-muted-foreground">
                  View descriptive statistics and distributions
                </p>
              </button>

              <button 
                onClick={() => setActiveView('quality')}
                className="p-6 rounded-lg border bg-card shadow-sm hover:bg-accent/50 transition-colors"
              >
                <div className="p-3 rounded-full bg-primary/10 mb-4 w-fit">
                  <Image
                    src="/globe.svg"
                    alt="Quality"
                    width={24}
                    height={24}
                    className="dark:invert"
                  />
                </div>
                <h3 className="font-semibold mb-2">Data Quality</h3>
                <p className="text-sm text-muted-foreground">
                  Check for missing values and anomalies
                </p>
              </button>
            </div>

            <div className="space-y-8">
              <DatasetHead datasetId={uploadedDatasetId} numRows={5} />
              
              {activeView === 'statistics' && (
                <DatasetAnalysis datasetId={uploadedDatasetId} />
              )}
              
              {activeView === 'quality' && (
                <>
                  {isLoading ? (
                    <div className="p-4">Loading quality analysis...</div>
                  ) : error ? (
                    <div className="p-4 text-red-500 bg-red-50 rounded">
                      Error: {error}
                    </div>
                  ) : qualityData ? (
                    <>
                      <DataQuality datasetId={uploadedDatasetId} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <UniqueValuesCard 
                          uniqueCounts={qualityData.unique_counts} 
                          totalRows={qualityData.total_rows} 
                        />
                        <MissingValuesCard 
                          missingCounts={qualityData.missing_counts}
                          totalRows={qualityData.total_rows}
                        />
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        )}

        {!uploadedDatasetId && (
          <div className="flex items-center justify-center h-[60vh] text-muted-foreground">
            Please upload a dataset to begin analysis
          </div>
        )}
      </main>
    </div>
  );
}
