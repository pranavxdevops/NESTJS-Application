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
  Filler,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MemberGrowthData {
  period: string;
  totalMembers: number;
  newMembers: number;
}

interface Props {
  data: MemberGrowthData[];
}

const MemberGrowthChart: React.FC<Props> = ({ data }) => {
  const chartData = {
    labels: data.map((d) => d.period),
    datasets: [
      {
        label: "Total Members",
        data: data.map((d) => d.totalMembers),
        borderColor: "#45B7D1",
        backgroundColor: "rgba(69, 183, 209, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          afterLabel: function (context) {
            const dataIndex = context.dataIndex;
            const newMembers = data[dataIndex]?.newMembers || 0;
            return `New: +${newMembers}`;
          },
        },
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

export default MemberGrowthChart;
