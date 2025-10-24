const statusStyles = {
  // Cohort/Session statuses
  upcoming: 'bg-blue-100 text-blue-800',
  ongoing: 'bg-green-100 text-green-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  'live soon': 'bg-orange-100 text-orange-800',
  paused: 'bg-yellow-100 text-yellow-800',
  
  // Assignment/Submission statuses
  assigned: 'bg-blue-100 text-blue-800',
  submitted: 'bg-indigo-100 text-indigo-800',
  graded: 'bg-green-100 text-green-800',
  'resubmission requested': 'bg-orange-100 text-orange-800',
  closed: 'bg-gray-100 text-gray-800',
  
  // Student statuses
  active: 'bg-green-100 text-green-800',
  graduated: 'bg-purple-100 text-purple-800',
  dropped: 'bg-red-100 text-red-800',
  
  // Certificate statuses
  eligible: 'bg-green-100 text-green-800',
  'not eligible': 'bg-gray-100 text-gray-800',
  issued: 'bg-purple-100 text-purple-800',
  
  // Delivery modes
  online: 'bg-blue-100 text-blue-800',
  physical: 'bg-green-100 text-green-800',
  recording: 'bg-gray-100 text-gray-800',
};

export default function StatusBadge({ status, className = '' }) {
  const normalizedStatus = status?.toLowerCase() || '';
  const style = statusStyles[normalizedStatus] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {status}
    </span>
  );
}
