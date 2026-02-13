"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, ChartOptions } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface BasePieChartProps {
  title: string;
  labels: string[];
  data: number[];
  backgroundColors?: string[];
}

export default function BasePieChart({
  title,
  labels,
  data,
  backgroundColors = [
    "rgba(212, 175, 55, 0.8)",
    "rgba(59, 130, 246, 0.8)",
    "rgba(16, 185, 129, 0.8)",
    "rgba(239, 68, 68, 0.8)",
    "rgba(168, 85, 247, 0.8)",
  ],
}: BasePieChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) => color.replace("0.8", "1")),
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div style={{ height: "400px" }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
