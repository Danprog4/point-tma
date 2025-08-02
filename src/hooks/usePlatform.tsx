import { retrieveLaunchParams } from "@telegram-apps/sdk";

export const usePlatform = () => {
  const launchParams = retrieveLaunchParams();

  console.log(launchParams, "launchParams");

  return launchParams.tgWebAppPlatform;
};
