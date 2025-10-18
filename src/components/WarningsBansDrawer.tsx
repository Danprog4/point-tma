import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Ban, Clock } from "lucide-react";
import { useState } from "react";
import { Drawer } from "vaul";
import { useTRPC } from "~/trpc/init/react";

interface WarningsBansDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export const WarningsBansDrawer = ({
  open,
  onOpenChange,
  children,
}: WarningsBansDrawerProps) => {
  const trpc = useTRPC();
  const [activeTab, setActiveTab] = useState<"warnings" | "bans">("warnings");

  const { data: warnings } = useQuery(trpc.main.getUserWarnings.queryOptions());
  const { data: bans } = useQuery(trpc.main.getUserBans.queryOptions());

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>{children}</Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content className="fixed right-0 bottom-0 left-0 z-[100] mt-24 flex h-fit flex-col rounded-t-[16px] bg-white px-4 py-4">
          <header className="flex items-center justify-center pb-4">
            <ArrowLeft className="h-6 w-6 text-transparent" />
            <div className="text-xl font-bold">Модерация</div>
            {/* <button onClick={() => onOpenChange(false)}>
              <X className="h-6 w-6 text-gray-900" />
            </button> */}
          </header>

          {/* Tabs */}
          <div className="mb-4 flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("warnings")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "warnings"
                  ? "border-b-2 border-orange-500 text-orange-600"
                  : "text-gray-500"
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-nowrap">
                <AlertTriangle className="h-4 w-4" />
                Предупреждения ({warnings?.length || 0})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("bans")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "bans"
                  ? "border-b-2 border-red-500 text-red-600"
                  : "text-gray-500"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Ban className="h-4 w-4" />
                Баны ({bans?.length || 0})
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
            {activeTab === "warnings" && (
              <div className="space-y-4">
                {warnings && warnings.length > 0 ? (
                  warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-orange-200 bg-orange-50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                          <span className="font-medium text-orange-800">
                            Предупреждение
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDate(warning.createdAt)}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">{warning.reason}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertTriangle className="h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">У вас нет предупреждений</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "bans" && (
              <div className="space-y-4">
                {bans && bans.length > 0 ? (
                  bans.map((ban, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-red-200 bg-red-50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Ban className="h-5 w-5 text-red-600" />
                          <span className="font-medium text-red-800">Бан</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">
                        Ваш аккаунт заблокирован
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Для разблокировки обратитесь в поддержку
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Ban className="h-12 w-12 text-gray-300" />
                    <p className="mt-2 text-sm text-gray-500">У вас нет банов</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-600">
                Если вы считаете, что предупреждение или бан выдан несправедливо, вы
                можете оспорить его, написав в поддержку.
              </p>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
