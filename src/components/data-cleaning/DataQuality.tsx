"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IDataQualityProps {
  datasetId: string;
}

interface IDataQualityStats {
  total_rows: number;
  unique_counts: Record<string, number>;
  duplicate_counts: Record<string, number>;
  missing_counts: Record<string, number>;
  null_counts: Record<string, number>;
}

interface IDataQualityResponse {
  success: boolean;
  message?: string;
  quality_analysis: IDataQualityStats;
}

export const DataQuality: React.FC<IDataQualityProps> = ({ datasetId }) => {
  const [qualityData, setQualityData] = useState<IDataQualityStats | null>(null);
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

        const data: IDataQualityResponse = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch data quality analysis");
        }

        setQualityData(data.quality_analysis);
        
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch quality analysis";
        setError(message);
        console.error("Quality analysis fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (datasetId) {
      fetchQualityData();
    }
  }, [datasetId]);

  if (isLoading) {
    return <div className="p-4">Loading quality analysis...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        Error: {error}
      </div>
    );
  }

  if (!qualityData) {
    return <div className="p-4">No quality data available</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-muted rounded">
            <p className="text-sm font-medium">Total Rows</p>
            <p className="text-2xl font-bold">{qualityData.total_rows}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Column</TableHead>
                <TableHead>Unique Values</TableHead>
                <TableHead>Duplicates</TableHead>
                <TableHead>Missing Values</TableHead>
                <TableHead>Null Values</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.keys(qualityData.unique_counts).map((column) => (
                <TableRow key={column}>
                  <TableCell className="font-medium">{column}</TableCell>
                  <TableCell>{qualityData.unique_counts[column]}</TableCell>
                  <TableCell>{qualityData.duplicate_counts[column]}</TableCell>
                  <TableCell>{qualityData.missing_counts[column]}</TableCell>
                  <TableCell>{qualityData.null_counts[column]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
