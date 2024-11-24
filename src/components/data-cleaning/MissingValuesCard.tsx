import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface IMissingValuesProps {
  missingCounts: Record<string, number>;
  totalRows: number;
}

export const MissingValuesCard: React.FC<IMissingValuesProps> = ({
  missingCounts,
  totalRows,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Missing Values Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(missingCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([column, count]) => {
              const percentage = (count / totalRows) * 100;
              return (
                <div key={column} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{column}</span>
                    <span className="text-muted-foreground">
                      {count} missing ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="bg-red-100 dark:bg-red-900"
                  />
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};
