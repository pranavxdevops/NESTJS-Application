"use client";

import BaseLineChart from "./BaseLineChart";

interface TrafficDataPoint {
  period: string;
  sessions: number;
  users: number;
  pageViews: number;
}

interface TrafficOverTimeChartProps {
  data: TrafficDataPoint[];
}

export default function TrafficOverTimeChart({ data }: TrafficOverTimeChartProps) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500 text-center py-8">No traffic data available yet</p>;
  }

  const labels = data.map((item) => item.period);
  const datasets = [
    {
      label: "Sessions",
      data: data.map((item) => item.sessions),
      borderColor: "rgba(212, 175, 55, 1)",
      backgroundColor: "rgba(212, 175, 55, 0.2)",
    },
    {
      label: "Users",
      data: data.map((item) => item.users),
      borderColor: "rgba(59, 130, 246, 1)",
      backgroundColor: "rgba(59, 130, 246, 0.2)",
    },
  ];

  return (
    <BaseLineChart
      title="Traffic Over Time"
      labels={labels}
      datasets={datasets}
    />
  );
}
