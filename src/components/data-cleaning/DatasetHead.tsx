"use client";

import { useEffect, useState } from "react";
import { useColumns } from "@/contexts/ColumnContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface IDatasetHeadProps {
  datasetId: string;
  numRows?: number;
}

interface IHeadData {
  columns: string[];
  data: Record<string, any>[];
}

/**
 * DatasetHead component displays the first few rows of the dataset in a table format
 * @param {string} datasetId - The ID of the uploaded dataset
 * @param {number} numRows - Optional number of rows to display (defaults to 5)
 */
export const DatasetHead: React.FC<IDatasetHeadProps> = ({ datasetId, numRows = 5 }) => {
  const [headData, setHeadData] = useState<IHeadData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { columns } = useColumns();

  useEffect(() => {
    const fetchHeadData = async () => {
      try {
        const response = await fetch(`/api/v1/data/head/${datasetId}?rows=${numRows}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.success) {
          setHeadData({
            columns: data.data.columns,
            data: data.data.rows
          });
        } else {
          throw new Error(data.message || "Failed to fetch dataset head");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch dataset head";
        setError(message);
        console.error("Dataset head fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (datasetId) {
      fetchHeadData();
    }
  }, [datasetId, numRows]);

  if (isLoading) {
    return <div className="p-4">Loading dataset preview...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        Error: {error}
      </div>
    );
  }

  if (!headData || !headData.data.length) {
    return <div className="p-4">No data available</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headData.columns.map((column) => (
                  <TableHead key={column}>
                    {column}
                    <div className="text-xs text-muted-foreground">
                      {columns.find(col => col.name === column)?.type || "unknown"}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {headData.data.map((row, index) => (
                <TableRow key={index}>
                  {headData.columns.map((column) => (
                    <TableCell key={`${index}-${column}`}>
                      {row[column]?.toString() || ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
