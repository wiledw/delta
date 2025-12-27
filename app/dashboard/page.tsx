import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  // User will be fetched on client side to avoid blocking navigation
  return <DashboardClient user={null} />;
}

