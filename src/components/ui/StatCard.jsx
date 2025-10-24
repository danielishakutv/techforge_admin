export default function StatCard({ title, value, icon, trend, trendLabel }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
