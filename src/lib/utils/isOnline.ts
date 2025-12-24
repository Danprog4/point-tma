export const getUserOnlineStatus = (
  lastLogin: Date | string | null | undefined,
  lastLocationUpdate: Date | string | null | undefined,
) => {
  if (!lastLogin && !lastLocationUpdate) return { isOnline: false, label: "был давно" };

  const now = Date.now();
  const loginTime = lastLogin ? new Date(lastLogin).getTime() : 0;
  const locationTime = lastLocationUpdate ? new Date(lastLocationUpdate).getTime() : 0;
  const lastActive = Math.max(loginTime, locationTime);

  const diffMs = now - lastActive;
  const diffMins = diffMs / (1000 * 60);
  const diffHours = diffMins / 60;
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 5) {
    return { isOnline: true, label: "Онлайн" };
  }

  if (diffHours < 24) {
    return { isOnline: false, label: "был(а) недавно" };
  }

  if (diffDays <= 30) {
    return { isOnline: false, label: `${diffDays}д назад` };
  }

  return { isOnline: false, label: "был(а) давно" };
};

export const isUserOnline = (
  lastLogin: Date | string | null | undefined,
  lastLocationUpdate: Date | string | null | undefined,
) => {
  return getUserOnlineStatus(lastLogin, lastLocationUpdate).isOnline;
};
