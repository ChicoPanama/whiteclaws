import Link from "next/link";

interface ResourceCardProps {
  id: string;
  title: string;
  description: string;
  type: "pdf" | "article" | "video" | "tool" | "course";
  author: string;
  downloads: number;
  upvotes: number;
  createdAt: string;
}

export default function ResourceCard({
  id,
  title,
  description,
  type,
  author,
  downloads,
  upvotes,
  createdAt,
}: ResourceCardProps) {
  const typeColors = {
    pdf: "bg-blue-900/50 text-blue-400",
    article: "bg-green-900/50 text-green-400",
    video: "bg-purple-900/50 text-purple-400",
    tool: "bg-yellow-900/50 text-yellow-400",
    course: "bg-red-900/50 text-red-400",
  };

  const typeIcons = {
    pdf: "📄",
    article: "📝",
    video: "🎥",
    tool: "🛠️",
    course: "🎓",
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{typeIcons[type]}</span>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <p className="text-gray-400 text-sm line-clamp-2">{description}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${typeColors[type]}`}>
          {type}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">by @{author}</span>
        <div className="flex items-center gap-3 text-gray-400">
          <span>⬇ {downloads}</span>
          <span>↑ {upvotes}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-500">{createdAt}</span>
        <Link 
          href={`/resources/${id}`}
          className="text-indigo-400 hover:text-indigo-300 text-sm"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}