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
import { TopMember } from "@/lib/api/gaAnalyticsApi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TopMembersChartProps {
  data: TopMember[];
}

export default function TopMembersChart({ data }: TopMembersChartProps) {
  const labels = data.map((member) => {
    // Split long member names into multiple lines (max 20 chars per line)
    const name = member.memberName;
    const words = name.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length > 20) {
        if (currentLine) lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    });
    if (currentLine) lines.push(currentLine.trim());
    
    return lines;
  });
  const values = data.map((member) => member.profileViews);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Profile Views",
        data: values,
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
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
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 11,
          },
          callback: function(value, index) {
            const label = this.getLabelForValue(value as number);
            // Handle array labels (multi-line)
            if (Array.isArray(label)) {
              const firstLine = label[0] || '';
              return firstLine.length > 10 ? firstLine.substring(0, 10) + '...' : firstLine;
            }
            // Handle string labels
            if (typeof label === 'string') {
              return label.length > 10 ? label.substring(0, 10) + '...' : label;
            }
            return label;
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
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
