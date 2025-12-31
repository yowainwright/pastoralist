import type { PopoverProps } from "./types";

export const Popover: React.FC<PopoverProps> = ({
  stepNumber,
  title,
  description,
  visible,
  showEmoji,
  verticalCenter,
}) => {
  if (!visible) return null;

  const positionClass = verticalCenter ? "top-1/2 -translate-y-1/2" : "top-12";

  return (
    <div
      className={`absolute z-10 w-64 right-4 ${positionClass} animate-pop-in`}
    >
      <div className="bg-base-100/95 backdrop-blur-sm border-2 border-blue-600 rounded-lg shadow-xl shadow-blue-500/15 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/25">
            {stepNumber}
          </span>
          <span className="font-bold text-base-content">{title}</span>
        </div>
        <div className="text-sm text-base-content/70 ml-8">
          {description}
          {showEmoji && (
            <span className="inline-block ml-1 animate-bounce-once">⚡</span>
          )}
        </div>
      </div>
    </div>
  );
};
