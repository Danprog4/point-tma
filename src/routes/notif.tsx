import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTRPC } from "~/trpc/init/react";

export const Route = createFileRoute("/notif")({
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: notifications } = useQuery(trpc.main.getNotifications.queryOptions());
  const readNotification = useMutation(trpc.main.readNotification.mutationOptions());

  return (
    <div>
      <div className="relative flex items-center justify-center p-4">
        <button
          onClick={() => window.history.back()}
          className="absolute left-4 flex h-6 w-6 items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-gray-800" strokeWidth={2} />
        </button>
        <h1 className="text-base font-bold text-gray-800">Уведомления</h1>
      </div>
      {notifications && notifications.length > 0 ? (
        notifications.map((notification) => (
          <div key={notification.id}>
            <div>{notification.type}</div>
          </div>
        ))
      ) : (
        <div className="px-4 py-4 text-start text-sm text-gray-500">
          Уведомлений пока нет
        </div>
      )}
    </div>
  );
}
