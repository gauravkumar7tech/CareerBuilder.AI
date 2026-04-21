import { useState, useEffect } from 'react';

const ProgressChart = ({ data, type = 'line' }) => {
  const [animatedData, setAnimatedData] = useState([]);

  useEffect(() => {
    // Animate chart data loading
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [data]);

  const maxValue = Math.max(...data.map(d => d.value));

  if (type === 'circular') {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            {/* Background circle */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-base-300"
            />
            {/* Progress circle */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${data.percentage || 0}, 100`}
              className="text-primary transition-all duration-1000 ease-out"
              style={{
                strokeDasharray: `${animatedData.percentage || 0}, 100`
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {animatedData.percentage || 0}%
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold">{data.label}</p>
          <p className="text-sm text-gray-500">{data.description}</p>
        </div>
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-sm text-gray-500">{item.value}%</span>
            </div>
            <div className="w-full bg-base-300 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${animatedData[index]?.value || 0}%`
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Line chart (simplified)
  return (
    <div className="w-full h-64 relative">
      <svg className="w-full h-full" viewBox="0 0 400 200">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={i}
            x1="0"
            y1={i * 40}
            x2="400"
            y2={i * 40}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-base-300"
          />
        ))}
        
        {/* Data line */}
        {animatedData.length > 1 && (
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary"
            points={animatedData.map((point, index) => 
              `${(index / (animatedData.length - 1)) * 400},${200 - (point.value / maxValue) * 180}`
            ).join(' ')}
          />
        )}
        
        {/* Data points */}
        {animatedData.map((point, index) => (
          <circle
            key={index}
            cx={(index / (animatedData.length - 1)) * 400}
            cy={200 - (point.value / maxValue) * 180}
            r="4"
            fill="currentColor"
            className="text-primary"
          />
        ))}
      </svg>
      
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
        {data.map((point, index) => (
          <span key={index}>{point.label}</span>
        ))}
      </div>
    </div>
  );
};

export default ProgressChart;
