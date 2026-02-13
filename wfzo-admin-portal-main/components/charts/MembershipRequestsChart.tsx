"use client";

import React from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MembershipRequestsData {
  period: string;
  count: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface Props {
  data: MembershipRequestsData[];
  period: "daily" | "weekly" | "monthly" | "yearly";
}

const MembershipRequestsChart: React.FC<Props> = ({ data, period }) => {
  const chartData = {
    labels: data.map((d) => d.period),
    datasets: [
      {
        label: "Approved",
        data: data.map((d) => d.approved),
        backgroundColor: "#4ECDC4",
        stack: "stack0",
      },
      {
        label: "Pending",
        data: data.map((d) => d.pending),
        backgroundColor: "#FFE66D",
        stack: "stack0",
      },
      {
        label: "Rejected",
        data: data.map((d) => d.rejected),
        backgroundColor: "#FF6B6B",
        stack: "stack0",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default MembershipRequestsChart;
