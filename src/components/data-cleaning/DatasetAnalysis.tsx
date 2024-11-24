"use client";

import { useEffect, useState } from "react";
import { useColumns } from "@/contexts/ColumnContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IDatasetAnalysisProps {
  datasetId: string;
}

interface IDescriptiveStats {
  [key: string]: {
    count: number;
    mean?: number;
    std?: number;
    min?: number;
    max?: number;
    '25%'?: number;
    '50%'?: number;
    '75%'?: number;
  };
}

/**
 * DatasetAnalysis component for displaying dataset analysis information
 * @param {IDatasetAnalysisProps} props - Component props
 * @returns {JSX.Element} Dataset analysis component
 */
export const DatasetAnalysis: React.FC<IDatasetAnalysisProps> = ({ datasetId }) => {
  const [description, setDescription] = useState<IDescriptiveStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { columns } = useColumns();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/analysis/dataset/${datasetId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch dataset analysis");
        }

        setDescription(data.data.description);
        
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch analysis";
        setError(message);
        console.error("Analysis fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (datasetId) {
      fetchAnalysis();
    }
  }, [datasetId]);

  if (isLoading) {
    return <div className="p-4">Loading analysis...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistical Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(description).map(([field, stats]) => (
            <div key={field} className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">{field}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Count:</span>
                  <span>{stats.count}</span>
                </div>
                {stats.mean !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mean:</span>
                    <span>{stats.mean.toFixed(2)}</span>
                  </div>
                )}
                {stats.std !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Std:</span>
                    <span>{stats.std.toFixed(2)}</span>
                  </div>
                )}
                {stats.min !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min:</span>
                    <span>{stats.min.toFixed(2)}</span>
                  </div>
                )}
                {stats.max !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max:</span>
                    <span>{stats.max.toFixed(2)}</span>
                  </div>
                )}
                {stats['25%'] !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">25%:</span>
                    <span>{stats['25%'].toFixed(2)}</span>
                  </div>
                )}
                {stats['50%'] !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">50%:</span>
                    <span>{stats['50%'].toFixed(2)}</span>
                  </div>
                )}
                {stats['75%'] !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">75%:</span>
                    <span>{stats['75%'].toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
