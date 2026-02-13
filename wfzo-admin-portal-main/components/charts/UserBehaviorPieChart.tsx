"use client";

import BasePieChart from "./BasePieChart";
import { UserBehavior } from "@/lib/api/gaAnalyticsApi";

interface UserBehaviorPieChartProps {
  data: UserBehavior;
}

export default function UserBehaviorPieChart({ data }: UserBehaviorPieChartProps) {
  const returningUsers = Math.max(0, data.totalUsers - data.newUsers);
  const labels = ["New Users", "Returning Users", "Engaged Sessions"];
  const values = [data.newUsers, returningUsers, data.engagedSessions];

  return (
    <BasePieChart
      title="User Behavior"
      labels={labels}
      data={values}
    />
  );
}
