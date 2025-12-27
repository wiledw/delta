"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

interface SavedAnalysis {
  id: string;
  created_at: string;
  asset_a: string;
  asset_b: string;
  result_data: {
    stats: {
      zScoreNow: number;
    };
    signal: {
      tradeSignal: string;
    };
  };
}

interface SavedAnalysesListProps {
  analyses: SavedAnalysis[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function SavedAnalysesList({
  analyses,
  isLoading,
  onDelete,
}: SavedAnalysesListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSignalBadgeVariant = (signal: string) => {
    if (signal === "NO_SIGNAL") return "secondary";
    return "default";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Analyses</CardTitle>
        <CardDescription>Your saved pair trading analyses</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : analyses.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No saved analyses yet. Run an analysis and click "Save Analysis" to
            save it here.
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="p-3 border rounded-md space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      {analysis.asset_a} / {analysis.asset_b}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(analysis.created_at)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onDelete(analysis.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getSignalBadgeVariant(
                      analysis.result_data.signal.tradeSignal,
                    )}
                    className="text-xs"
                  >
                    {analysis.result_data.signal.tradeSignal}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Z: {analysis.result_data.stats.zScoreNow.toFixed(2)}
                  </span>
                </div>
                <Link href={`/analysis/${analysis.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

