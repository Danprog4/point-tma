import { ChevronRight } from "lucide-react";

export function MenuItem({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between border-b border-gray-100 px-4 py-5 last:border-b-0"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-base font-medium text-black">{title}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-gray-400" />
    </div>
  );
}
