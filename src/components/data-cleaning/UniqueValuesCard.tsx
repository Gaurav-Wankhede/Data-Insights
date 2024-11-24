import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface IUniqueValuesProps {
  uniqueCounts: Record<string, number>;
  totalRows: number;
}

export const UniqueValuesCard: React.FC<IUniqueValuesProps> = ({
  uniqueCounts,
  totalRows,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unique Values Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(uniqueCounts).map(([column, count]) => {
            const percentage = (count / totalRows) * 100;
            return (
              <div key={column} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{column}</span>
                  <span className="text-muted-foreground">
                    {count} / {totalRows} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={percentage} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
