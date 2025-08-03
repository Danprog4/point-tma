import { retrieveLaunchParams } from "@telegram-apps/sdk";

export const usePlatform = () => {
  const launchParams = retrieveLaunchParams();

  return (
    launchParams.tgWebAppPlatform === "ios" ||
    launchParams.tgWebAppPlatform === "android" ||
    launchParams.tgWebAppPlatform === "android-x" ||
    launchParams.tgWebAppPlatform === "android_x" ||
    launchParams.tgWebAppPlatform === "web"
  );
};
