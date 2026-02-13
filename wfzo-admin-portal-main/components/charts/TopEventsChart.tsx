"use client";

import BaseHorizontalBarChart from "./BaseHorizontalBarChart";
import { TopEvent } from "@/lib/api/gaAnalyticsApi";

interface TopEventsChartProps {
  data: TopEvent[];
}

export default function TopEventsChart({ data }: TopEventsChartProps) {
  const labels = data.map((event) => event.eventTitle);
  const values = data.map((event) => event.pageViews);

  return (
    <BaseHorizontalBarChart
      title="Most Visited Events"
      labels={labels}
      data={values}
      dataLabel="Views"
      backgroundColor="rgba(245, 158, 11, 0.8)"
      borderColor="rgba(245, 158, 11, 1)"
    />
  );
}
