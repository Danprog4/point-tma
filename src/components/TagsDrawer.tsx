import { Drawer } from "vaul";
import { fastTagsByType } from "../config/fastTags";
import { tagsByType } from "../config/tags";

interface TagsDrawerProps {
  open: boolean;
  category: string;
  onOpenChange: (open: boolean) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  isFastMeet?: boolean;
}

export function TagsDrawer({
  open,
  onOpenChange,
  category,
  tags,
  setTags,
  isFastMeet = false,
}: TagsDrawerProps) {
  const tagsList = isFastMeet
    ? fastTagsByType.fastMeets
    : tagsByType[category as keyof typeof tagsByType];

  const handleTagClick = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  if (!tagsList) {
    return null;
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-[80%] flex-col rounded-t-[16px] bg-white px-4 py-4">
          {/* Header */}
          <div className="mb-4 text-center">
            <h2 className="text-lg font-bold">
              {isFastMeet ? "Выберите тэги для быстрой встречи" : "Выберите тэги"}
            </h2>
          </div>

          <div className="scrollbar-hidden overflow-y-auto">
            {tagsList.map((tag) => (
              <div
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="mb-2 flex cursor-pointer items-center justify-between rounded-lg bg-gray-100 p-2"
              >
                <span>{tag}</span>
                {tags.includes(tag) ? (
                  <span className="text-lg text-green-500">✓</span>
                ) : (
                  <span className="text-lg text-gray-400">+</span>
                )}
              </div>
            ))}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
