"use client";

import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EnquiriesData {
  period: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface Props {
  data: EnquiriesData[];
}

const EnquiriesChart: React.FC<Props> = ({ data }) => {
  const chartData = {
    labels: data.map((d) => d.period),
    datasets: [
      {
        label: "Total",
        data: data.map((d) => d.total),
        borderColor: "#95A5A6",
        backgroundColor: "#95A5A6",
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: "Pending",
        data: data.map((d) => d.pending),
        borderColor: "#FFE66D",
        backgroundColor: "#FFE66D",
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: "Approved",
        data: data.map((d) => d.approved),
        borderColor: "#4ECDC4",
        backgroundColor: "#4ECDC4",
        tension: 0.4,
        pointRadius: 4,
      },
      {
        label: "Rejected",
        data: data.map((d) => d.rejected),
        borderColor: "#FF6B6B",
        backgroundColor: "#FF6B6B",
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default EnquiriesChart;
