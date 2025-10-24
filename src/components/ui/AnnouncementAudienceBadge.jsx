export default function AnnouncementAudienceBadge({ audienceType, stream }) {
  if (audienceType === 'global') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        General Announcement
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      Stream: {stream}
    </span>
  );
}
