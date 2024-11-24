import { useEffect, useState } from "react";
import { UniqueValuesCard } from "./UniqueValuesCard";
import { MissingValuesCard } from "./MissingValuesCard";
import { IQualityAnalysis } from "@/types/analysis";

interface IDataQualityDashboardProps {
  datasetId: string;
}

export const DataQualityDashboard: React.FC<IDataQualityDashboardProps> = ({
  datasetId,
}) => {
  const [qualityData, setQualityData] = useState<IQualityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQualityData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/analysis/quality/${datasetId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setQualityData(data.quality_analysis);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to fetch quality data");
      } finally {
        setIsLoading(false);
      }
    };

    if (datasetId) {
      fetchQualityData();
    }
  }, [datasetId]);

  if (isLoading) return <div>Loading quality analysis...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!qualityData) return null;

  return (
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
  );
};
