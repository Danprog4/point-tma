import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { useTRPC } from "~/trpc/init/react";
import { ReviewStar } from "./Icons/ReviewStar";

export const Participations = ({
  participants,
  setIsOpen,
  users,
  meetId,
  handleRateUsers,
  userRating,
  isOwner,
  organizer,
}: {
  users: any[];
  participants: any[];
  setIsOpen: (isOpen: boolean) => void;
  meetId: number;
  handleRateUsers: (userIds: number[], rating: number) => void;
  userRating:
    | {
        meetId: number | null;
        id: number;
        userId: number | null;
        rating: number | null;
        fromUserId: number | null;
        createdAt: Date | null;
      }[]
    | undefined;
  isOwner: boolean;
  organizer: any;
}) => {
  const trpc = useTRPC();
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const queryClient = useQueryClient();

  if (!participants || participants.length === 0) {
    return <div>Нет участников</div>;
  }
  const participantsWithUsers = participants.map((participant) => {
    const user = users?.find((user) => user.id === Number(participant));
    const existingRating = userRating?.find((rating) => rating.userId === user?.id);
    return {
      ...user,
      existingRating,
    };
  });

  useEffect(() => {
    if (userRating && userRating.length > 0) {
      const ratingsMap = userRating.reduce(
        (acc, rating) => {
          if (rating.userId && rating.rating) {
            acc[rating.userId] = rating.rating;
          }
          return acc;
        },
        {} as Record<number, number>,
      );
      setRatings(ratingsMap);
    }
  }, [userRating, participantsWithUsers]);

  const filteredParticipants = isOwner ? participantsWithUsers : [organizer];

  const handleBack = () => {
    setIsOpen(false);

    const newRatings = Object.entries(ratings).filter(([userId, rating]) => {
      const existingRating = userRating?.find((r) => r.userId === Number(userId));
      return !existingRating || existingRating.rating !== rating;
    });

    if (newRatings.length === 0) {
      return;
    }

    if (newRatings.length > 0) {
      newRatings.forEach(([userId, rating]) => {
        handleRateUsers([Number(userId)], rating);
      });
    }
  };

  const isMobile = usePlatform();

  return (
    <div data-mobile={isMobile} className="px-4 py-4 data-[mobile=true]:pt-39">
      <header
        data-mobile={isMobile}
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-white p-4 data-[mobile=true]:pt-28"
      >
        <button
          className="flex h-6 w-6 items-center justify-center"
          onClick={() => {
            handleBack();
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-base font-bold">
          {isOwner ? "Оценка участников" : "Оценка встречи"}
        </div>
        <div className="h-5 w-5"></div>
      </header>
      <div className="flex flex-col gap-4 text-black">
        {filteredParticipants?.map((participant: any) => {
          return (
            <div>
              {participant.id === selectedParticipant ? (
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-3xl px-4 py-4"
                  style={{ boxShadow: "0px 8px 16px 0px #0000001A" }}
                >
                  <div className="flex flex-col items-center justify-center gap-4">
                    <img
                      src={
                        participant?.photo
                          ? getImageUrl(participant?.photo)
                          : participant.photoUrl
                      }
                      alt=""
                      className="h-28 w-28 rounded-3xl"
                    />
                    <div className="text-2xl font-bold">
                      {participant?.name} {participant?.surname}
                    </div>
                  </div>
                  <div className="flex w-full flex-col items-center justify-center gap-4 rounded-3xl bg-[#FFF7D7] px-4 py-4">
                    {isOwner ? (
                      <div>Оцените участие пользователя</div>
                    ) : (
                      <div>
                        Оцените как прошла встреча от {organizer?.name}{" "}
                        {organizer?.surname}
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <ReviewStar
                          key={index}
                          disabled={participant.existingRating?.rating > 0}
                          onClick={() =>
                            setRatings({ ...ratings, [participant.id]: index + 1 })
                          }
                          isActive={ratings[participant.id] >= index + 1}
                          width={52}
                          height={52}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setSelectedParticipant(participant.id);
                  }}
                  className="flex items-center justify-start gap-2 rounded-3xl px-4 py-4"
                  key={participant.id}
                  style={{ boxShadow: "0px 8px 16px 0px #0000001A" }}
                >
                  <img
                    src={
                      participant?.photo
                        ? getImageUrl(participant?.photo)
                        : participant.photoUrl
                    }
                    alt=""
                    className="h-12 w-12 rounded-full"
                  />
                  <div className="text-xl">
                    {participant?.name} {participant?.surname}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
