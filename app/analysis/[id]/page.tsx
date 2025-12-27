import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AnalysisView } from "@/components/analysis-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AnalysisPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = await params;
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
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold">
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
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">
            Analysis: {analysis.asset_a} / {analysis.asset_b}
          </h1>
          <p className="text-sm text-muted-foreground">
            Created: {new Date(analysis.created_at).toLocaleString()}
          </p>
        </div>
        <AnalysisView result={analysis.result_data} inputs={analysis.input_data} />
      </div>
    </div>
  );
}

