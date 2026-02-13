"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BaseHorizontalBarChartProps {
  title: string;
  labels: string[];
  data: number[];
  backgroundColor?: string;
  borderColor?: string;
  dataLabel?: string;
}

export default function BaseHorizontalBarChart({
  title,
  labels,
  data,
  backgroundColor = "rgba(212, 175, 55, 0.8)",
  borderColor = "rgba(212, 175, 55, 1)",
  dataLabel = "Views",
}: BaseHorizontalBarChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: dataLabel,
        data,
        backgroundColor,
        borderColor,
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height: "400px" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
