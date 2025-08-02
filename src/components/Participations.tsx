import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { usePlatform } from "~/hooks/usePlatform";
import { getImageUrl } from "~/lib/utils/getImageURL";
import { ReviewStar } from "./Icons/ReviewStar";
export const Participations = ({
  participants,
  setIsOpen,
  users,
}: {
  users: any[];
  participants: any[];
  setIsOpen: (isOpen: boolean) => void;
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  const [star, setStar] = useState<number>(0);

  if (!participants || participants.length === 0) {
    return <div>Нет участников</div>;
  }
  const participantsWithUsers = participants.map((participant) => {
    const user = users?.find((user) => user.id === Number(participant));
    return user;
  });

  console.log(users, "users");

  console.log(participantsWithUsers, "participants");

  const isMobile = usePlatform();

  return (
    <div data-mobile={isMobile} className="px-4 py-4 data-[mobile=true]:pt-24">
      <header className="flex items-center justify-between pt-0.5 pb-4">
        <button
          className="flex h-6 w-6 items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-xl font-bold">Оценка участников</div>
        <div className="h-5 w-5"></div>
      </header>
      <div className="flex flex-col gap-4 text-black">
        {participantsWithUsers?.map((participant: any) => {
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
                    <div>Оцените участие пользователя</div>
                    <div className="flex items-center justify-center gap-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <ReviewStar
                          key={index}
                          onClick={() => setStar(index + 1)}
                          isActive={star >= index + 1}
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
