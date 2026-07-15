interface SparklineProps {
  data: { date: string; count: number }[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({ data, width = 80, height = 24, className = '' }: SparklineProps) {
  if (data.length === 0) {
    return <svg width={width} height={height} className={className} />;
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (d.count / maxValue) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
