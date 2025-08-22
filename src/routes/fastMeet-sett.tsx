import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Step2 } from "~/components/createMeet/Step2";
import { CreateMeetDrawer } from "~/components/CreateMeetDrawer";
import { TagsDrawer } from "~/components/TagsDrawer";
import { FastMeet, User as UserType } from "~/db/schema";
import { useTRPC } from "~/trpc/init/react";

interface FastMeetSettingsProps {
  meet: FastMeet;
  currentUser: UserType | null;
  onSaved?: () => void;
}

export const Route = createFileRoute("/fastMeet-sett")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { meetId, cameFromList } = Route.useSearch() as {
    meetId?: number;
    cameFromList?: boolean;
  };

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: currentUser } = useQuery(trpc.main.getUser.queryOptions());
  const { data: fastMeets } = useQuery(trpc.meetings.getFastMeets.queryOptions());
  const meet = fastMeets?.find((m) => m.id === Number(meetId));

  if (!meet) {
    return (
      <div className="min-h-[100dvh] px-4 py-8 text-center text-sm text-gray-500">
        Встреча не найдена
      </div>
    );
  }

  const [index, setIndex] = useState(0);
  const [isDisabled, setIsDisabled] = useState(true);
  const [areLocationsValid, setAreLocationsValid] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTagsDrawerOpen, setIsTagsDrawerOpen] = useState(false);

  const [title, setTitle] = useState(meet.name || "");
  const [description, setDescription] = useState(meet.description || "");
  const [type, setType] = useState(meet.type || "");
  const [subType, setSubType] = useState(meet.subType || "");
  const [tags, setTags] = useState<string[]>(meet.tags || []);

  const [locations, setLocations] = useState<
    {
      location: string;
      address: string;
      starttime?: string;
      endtime?: string;
      index?: number;
      coordinates?: [number, number];
      isCustom?: boolean;
    }[]
  >(
    (meet.locations?.map((l) => ({ ...l, isCustom: true })) as any) || [
      { location: "", address: "", starttime: "", endtime: "", isCustom: true },
    ],
  );

  const [length, setLength] = useState(Math.max(1, meet.locations?.length || 1));
  const [city, setCity] = useState(meet.city || "");
  const [selectedItems, setSelectedItems] = useState<
    { id: number; type: string; index: number }[]
  >([]);

  const editFastMeet = useMutation(
    trpc.meetings.editFastMeet.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trpc.meetings.getFastMeets.queryKey(),
        });

        const prevFastMeets = queryClient.getQueryData(
          trpc.meetings.getFastMeets.queryKey(),
        ) as FastMeet[] | undefined;

        // Optimistically update the meet in the list
        queryClient.setQueryData(
          trpc.meetings.getFastMeets.queryKey(),
          (old: FastMeet[] | undefined) => {
            if (!old) return old;
            return old.map((m) =>
              m.id === meet.id
                ? {
                    ...m,
                    name: variables.name,
                    description: variables.description,
                    locations: variables.locations as any,
                    coordinates: variables.coordinates as [number, number],
                    type: variables.type,
                    subType: variables.subType,
                    tags: variables.tags,
                    city: variables.city,
                  }
                : m,
            );
          },
        );

        return { prevFastMeets };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.prevFastMeets) {
          queryClient.setQueryData(
            trpc.meetings.getFastMeets.queryKey(),
            ctx.prevFastMeets,
          );
        }
      },
      onSuccess: () => {
        navigate({
          to: "/people",
          search: { openFastMeetId: meet.id, cameFromList: cameFromList || false },
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.meetings.getFastMeets.queryKey(),
        });
      },
    }),
  );

  const handleSave = () => {
    if (!meet?.id) return;
    const coordinates = (locations[0]?.coordinates || [0, 0]) as [number, number];
    editFastMeet.mutate({
      meetId: meet.id,
      name: title,
      description,
      locations: locations.map((l) => ({
        location: l.location,
        address: l.address,
        coordinates: (l.coordinates || [0, 0]) as [number, number],
      })),
      coordinates,
      type,
      subType,
      tags,
      city,
    });
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));
  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-center bg-white px-4 py-4 pt-28">
        <button
          className="absolute left-4 flex items-center justify-center"
          onClick={() =>
            navigate({
              to: "/people",
              search: { openFastMeetId: meet.id, cameFromList: cameFromList || false },
            })
          }
        >
          ←
        </button>
        <div className="font-bold">Настройки быстрой встречи</div>
      </div>
      <div className="min-h-[100dvh] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+120px)]">
        <div className="flex flex-col items-start gap-2 pb-4">
          <div className="text-xl font-bold">Тип встречи *</div>
          <div
            onClick={() => setIsDrawerOpen(true)}
            className="flex h-11 w-full cursor-pointer items-center justify-between rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black opacity-50 placeholder:text-black/50"
          >
            <div>{subType || type || "Выберите тип"}</div>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 py-4 pb-4">
          <div className="text-xl font-bold">Название *</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            type="text"
            placeholder={`Введите название`}
            className="h-11 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-base text-black placeholder:text-black/50"
          />
        </div>

        <div className="flex flex-col items-start gap-2 pb-4">
          <div className="text-xl font-bold">Описание *</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Введите описание`}
            className="h-28 w-full rounded-[14px] border border-[#DBDBDB] bg-white px-4 py-3 text-base text-black placeholder:text-black/50"
          />
        </div>

        <div className="flex flex-col items-start gap-2 pb-4">
          <div className="text-xl font-bold">Тэги</div>
          <div className="mb-4 w-full">
            {tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-[#F1F1F1] px-3 py-1 text-sm text-black"
                  >
                    {tag}
                    <span
                      className="cursor-pointer text-xs text-gray-500"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div
              onClick={() => setIsTagsDrawerOpen(true)}
              className="flex h-11 w-full cursor-pointer items-center justify-between rounded-[14px] border border-[#DBDBDB] bg-white px-4 text-sm text-black opacity-50 placeholder:text-black/50"
            >
              <div>
                {tags.length > 0
                  ? `Выбрано тэгов: ${tags.length}`
                  : "Выберите тэги (необязательно)"}
              </div>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        <Step2
          user={(currentUser as unknown as UserType) || ({} as UserType)}
          setLocations={setLocations}
          setIndex={setIndex}
          index={index}
          isDisabled={isDisabled}
          locations={locations}
          length={length}
          setLength={setLength}
          setSelectedItems={setSelectedItems}
          setIsDisabled={(disabled) => setAreLocationsValid(!disabled)}
          selectedItems={selectedItems}
          city={city}
          setCity={setCity}
          isFastMeet={true}
          requireCity={true}
        />

        <div className="fixed inset-x-0 bottom-0 z-[100] flex w-full items-center justify-between px-4 pb-[env(safe-area-inset-bottom)]">
          <button
            onClick={handleSave}
            className={`z-[100] mx-auto mb-4 flex-1 rounded-tl-lg rounded-br-lg bg-[#9924FF] px-4 py-3 text-center text-white disabled:opacity-50`}
          >
            {editFastMeet.isPending ? "Сохраняем..." : "Сохранить изменения"}
          </button>
        </div>

        <CreateMeetDrawer
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          setType={setType}
          type={type}
          subType={subType}
          setSubType={setSubType}
        />
        <TagsDrawer
          open={isTagsDrawerOpen}
          onOpenChange={setIsTagsDrawerOpen}
          category="fastMeets"
          setTags={setTags}
          tags={tags}
          isFastMeet={true}
        />
      </div>
    </div>
  );
}
