import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalysisView } from "@/components/analysis-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { unstable_noStore } from "next/cache";

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

async function AnalysisContent({ id }: { id: string }) {
  unstable_noStore(); // Prevent static generation - this route requires authentication
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch analysis
  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !analysis) {
    redirect("/dashboard");
  }

  // Verify ownership (RLS should handle this, but double-check server-side)
  if (analysis.user_id !== user.id) {
    redirect("/dashboard");
  }

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">
          Analysis: {analysis.asset_a} / {analysis.asset_b}
        </h1>
        <p className="text-sm text-muted-foreground">
          Created: {new Date(analysis.created_at).toLocaleString()}
        </p>
      </div>
      <AnalysisView result={analysis.result_data} inputs={analysis.input_data} />
    </>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
      <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
      <div className="h-64 bg-muted rounded animate-pulse" />
    </div>
  );
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  unstable_noStore(); // Mark this route as dynamic
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              PairLab
            </Link>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex-1">
        <Suspense fallback={<AnalysisSkeleton />}>
          <AnalysisContent id={id} />
        </Suspense>
      </div>
    </div>
  );
}

