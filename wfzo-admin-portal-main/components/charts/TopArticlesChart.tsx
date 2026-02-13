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
import { TopArticle } from "@/lib/api/gaAnalyticsApi";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TopArticlesChartProps {
  data: TopArticle[];
}

export default function TopArticlesChart({ data }: TopArticlesChartProps) {
  const labels = data.map((article) => {
    // Split long article titles into multiple lines (max 20 chars per line)
    const title = article.title;
    const words = title.split(' ');
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
  const values = data.map((article) => article.views);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Reads",
        data: values,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
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
