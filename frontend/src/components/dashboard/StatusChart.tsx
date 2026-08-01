import { JobStats } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface StatusChartProps {
  stats: JobStats | null;
}

export function StatusChart({ stats }: StatusChartProps) {
  if (!stats) return null;

  const data = [
    { name: 'Valid', value: stats.valid, color: '#10b981' },
    { name: 'Invalid', value: stats.invalid, color: '#ef4444' },
    { name: 'Risky', value: stats.risky, color: '#f59e0b' },
    { name: 'Catch-All', value: stats.catch_all, color: '#3b82f6' },
    { name: 'Unknown', value: stats.unknown, color: '#6b7280' },
  ].filter(item => item.value > 0);

  return (
    <Card className="flex flex-col h-[400px]">
      <CardHeader>
        <CardTitle className="text-lg">Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-full"
        >
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No data available yet
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
