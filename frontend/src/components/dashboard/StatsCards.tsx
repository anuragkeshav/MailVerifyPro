import { JobStats } from '@/lib/types';
import { Card, CardContent } from '../ui/card';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  Mail, 
  CopyMinus, 
  ShieldCheck,
  FileDigit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface StatsCardsProps {
  stats: JobStats | null;
}

// Simple animated counter component
function Counter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    // Very simple instant update for now to ensure it works
    setDisplayValue(value);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) return null;

  const cards = [
    {
      title: "Total Emails",
      value: stats.total,
      icon: FileDigit,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      percent: 100
    },
    {
      title: "Processed",
      value: stats.processed,
      icon: Mail,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      percent: stats.total > 0 ? (stats.processed / stats.total) * 100 : 0
    },
    {
      title: "Valid",
      value: stats.valid,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      percent: stats.processed > 0 ? (stats.valid / stats.processed) * 100 : 0
    },
    {
      title: "Invalid",
      value: stats.invalid,
      icon: XCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      percent: stats.processed > 0 ? (stats.invalid / stats.processed) * 100 : 0
    },
    {
      title: "Risky",
      value: stats.risky,
      icon: AlertTriangle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      percent: stats.processed > 0 ? (stats.risky / stats.processed) * 100 : 0
    },
    {
      title: "Catch-All",
      value: stats.catch_all,
      icon: ShieldCheck,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
      percent: stats.processed > 0 ? (stats.catch_all / stats.processed) * 100 : 0
    },
    {
      title: "Unknown",
      value: stats.unknown,
      icon: HelpCircle,
      color: "text-slate-500",
      bgColor: "bg-slate-500/10",
      percent: stats.processed > 0 ? (stats.unknown / stats.processed) * 100 : 0
    },
    {
      title: "Duplicates",
      value: stats.duplicates,
      icon: CopyMinus,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      percent: stats.total > 0 ? (stats.duplicates / stats.total) * 100 : 0
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="overflow-hidden relative">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold tracking-tight">
                      <Counter value={card.value} />
                    </h3>
                  </div>
                </div>
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
              </div>
              
              {/* Progress bar background */}
              <div className="absolute bottom-0 left-0 h-1 w-full bg-muted">
                <motion.div 
                  className={cn("h-full", card.bgColor.replace('/10', ''))}
                  initial={{ width: 0 }}
                  animate={{ width: `${card.percent}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
