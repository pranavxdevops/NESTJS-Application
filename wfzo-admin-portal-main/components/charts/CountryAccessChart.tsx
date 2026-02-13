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

interface CountryData {
  country: string;
  users: number;
}

interface CountryAccessChartProps {
  data: CountryData[];
}

export default function CountryAccessChart({ data }: CountryAccessChartProps) {
  const labels = data.map((item) => item.country);
  const values = data.map((item) => item.users);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Users",
        data: values,
        backgroundColor: "rgba(168, 85, 247, 0.8)",
        borderColor: "rgba(168, 85, 247, 1)",
        borderWidth: 1,
        barThickness: 40, // Fixed bar width for consistent appearance
        maxBarThickness: 50,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Users",
        },
        ticks: {
          precision: 0, // Force whole numbers only
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        },
      },
      x: {
        title: {
          display: true,
          text: "Country",
        },
      },
    },
  };

  return (
    <div style={{ height: "400px" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
