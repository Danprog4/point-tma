import { shareURL } from "@telegram-apps/sdk";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function useReferral(userId?: number) {
  const [copiedLink, setCopiedLink] = useState(false);

  const referralLink = useMemo(() => {
    return `https://t.me/pointTMA_bot?startapp=ref_${userId || ""}`;
  }, [userId]);

  const referralText = `Привет! 👋 Присоединяйся к Point - приложению для интересных встреч и квестов! Используй мою ссылку для регистрации и получи бонусы! 🎁`;

  const handleShare = () => {
    if (shareURL.isAvailable()) {
      shareURL(referralLink, referralText);
    } else {
      navigator.clipboard.writeText(`${referralText}\n\n${referralLink}`);
      toast.success("Ссылка скопирована в буфер обмена!");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Ссылка скопирована!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return {
    referralLink,
    referralText,
    copiedLink,
    handleShare,
    handleCopyLink,
  };
}
