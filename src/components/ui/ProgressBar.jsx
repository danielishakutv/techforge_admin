export default function ProgressBar({ value, max = 100, className = '', showLabel = true }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
