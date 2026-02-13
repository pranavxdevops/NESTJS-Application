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

interface TopPage {
  pagePath: string;
  pageTitle: string;
  pageViews: number;
  totalUsers: number;
  newUsers: number;
  avgSessionDuration: number;
}

interface TopPagesChartProps {
  data: TopPage[];
}

export default function TopPagesChart({ data }: TopPagesChartProps) {
  console.log('TopPagesChart - Raw data received:', data.length, 'pages');
  console.log('TopPagesChart - Raw data:', data.map(p => ({ title: p.pageTitle, path: p.pagePath, views: p.pageViews })));

  // Filter out "(not set)" entries
  const filteredData = data.filter(page => 
    page.pageTitle !== '(not set)' && 
    page.pagePath !== '(not set)' &&
    page.pageTitle !== '' &&
    page.pagePath !== ''
  );

  console.log('TopPagesChart - After filtering (not set):', filteredData.length, 'pages');

  // Helper function to normalize page name (remove locale prefixes and identify home page variants)
  const normalizePageName = (page: TopPage) => {
    let path = page.pagePath;
    const title = page.pageTitle || '';
    
    // Remove locale prefixes like /en, /es, /fr, /sp etc.
    path = path.replace(/^\/(en|es|fr|sp|ar|de|it|pt|zh|ja|ko)\/?/, '/');
    
    // Treat root path as "Home Page"
    if (path === '/' || path === '') {
      return 'Home Page';
    }
    
    // Clean up common suffixes from page titles
    const cleanTitle = title
      .replace(/\s*-\s*WFZO$/i, '')
      .replace(/\s*-\s*World Free Zones? Organization$/i, '')
      .trim();
    
    // If the cleaned title is generic (WFZO, World Free Zones Organization, Home Page), 
    // generate name from path instead
    const genericTitles = ['wfzo', 'world free zones organization', 'world free zone organization', 'home page'];
    const isGenericTitle = genericTitles.includes(cleanTitle.toLowerCase());
    
    if (isGenericTitle) {
      // Extract the last meaningful segment from the path and convert to title case
      const segments = path.split('/').filter(Boolean);
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        // Convert kebab-case to Title Case
        const pageName = lastSegment
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        console.log('Normalizing:', { original: title, path, normalized: pageName });
        return pageName;
      }
    }
    
    console.log('Normalizing:', { original: title, path, normalized: cleanTitle });
    
    // Use cleaned title if available, otherwise extract from path
    return cleanTitle || page.pageTitle || path.split('/').filter(Boolean).pop() || path;
  };

  // Aggregate duplicate page names by summing their views
  const aggregatedData = filteredData.reduce((acc, page) => {
    const pageName = normalizePageName(page);
    
    if (acc[pageName]) {
      acc[pageName].pageViews += page.pageViews;
      acc[pageName].totalUsers += page.totalUsers;
    } else {
      acc[pageName] = { ...page, pageName };
    }
    
    return acc;
  }, {} as Record<string, TopPage & { pageName: string }>);

  // Convert to array and sort by page views
  const sortedData = Object.values(aggregatedData)
    .sort((a, b) => b.pageViews - a.pageViews);

  console.log('TopPagesChart - Total pages after aggregation:', sortedData.length);
  console.log('TopPagesChart - All pages:', sortedData.map(p => ({ name: p.pageName, views: p.pageViews })));

  // Take top 10 or all if less than 10
  const topPages = sortedData.slice(0, 10);

  const labels = topPages.map((page) => page.pageName);
  const values = topPages.map((page) => page.pageViews);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Page Views",
        data: values,
        backgroundColor: "rgba(212, 175, 55, 0.8)",
        borderColor: "rgba(212, 175, 55, 1)",
        borderWidth: 1,
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
          text: "Number of Views",
        },
      },
      x: {
        title: {
          display: true,
          text: "Page Name",
        },
        ticks: {
          font: {
            weight: 'bold' as const,
          },
          callback: function(value: string | number, index: number) {
            const label = labels[index];
            if (!label) return '';
            
            // Split long labels into multiple lines (max 20 characters per line)
            const maxCharsPerLine = 20;
            if (label.length <= maxCharsPerLine) return label;
            
            const words = label.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            
            words.forEach(word => {
              if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
                currentLine = (currentLine + ' ' + word).trim();
              } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
              }
            });
            
            if (currentLine) lines.push(currentLine);
            return lines;
          }
        }
      },
    },
  };

  return (
    <div style={{ height: "400px" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
