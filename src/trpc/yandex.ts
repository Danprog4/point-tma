import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, procedure } from "./init";

export const yandexRouter = createTRPCRouter({
  suggest: procedure
    .input(
      z.object({
        city: z.string(),
        query: z.string(),
        types: z.string().optional().default("biz,geo"), // Типы объектов для поиска
        results: z.number().optional().default(10), // Количество результатов
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const url = new URL("https://suggest-maps.yandex.ru/v1/suggest");
        url.searchParams.set("apikey", process.env.API_KEY!);
        url.searchParams.set("text", `${input.city}, ${input.query}`);
        url.searchParams.set("print_address", "1");
        url.searchParams.set("attrs", "uri");
        url.searchParams.set("results", input.results.toString());
        url.searchParams.set("lang", "ru_RU");
        url.searchParams.set("types", input.types);

        const suggestResponse = await fetch(url.toString());

        if (!suggestResponse.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch suggestions from Yandex API",
          });
        }

        const suggestData = await suggestResponse.json();

        // Возвращаем все результаты поиска
        if (suggestData.results && suggestData.results.length > 0) {
          const resultsWithGeocode = await Promise.all(
            suggestData.results.map(async (result: any) => {
              let geocodeData = null;
              if (result?.uri) {
                try {
                  const geocodeResponse = await fetch(
                    `https://geocode-maps.yandex.ru/1.x/?apikey=${process.env.GEOCODER_API_KEY}&lang=ru_RU&sco=latlong&uri=${encodeURIComponent(result.uri)}&format=json`,
                  );

                  if (geocodeResponse.ok) {
                    geocodeData = await geocodeResponse.json();
                  }
                } catch (error) {
                  console.error("Error fetching geocode for result:", error);
                }
              }

              return {
                ...result,
                geocode: geocodeData,
              };
            }),
          );

          return {
            results: resultsWithGeocode,
          };
        } else {
          return {
            results: [],
          };
        }
      } catch (error) {
        console.error("Error in suggest query:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process suggestion request",
        });
      }
    }),
  reverseGeocode: procedure
    .input(
      z.object({
        lat: z.number(),
        lon: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { lat, lon } = input;
        const url = new URL("https://geocode-maps.yandex.ru/1.x/");
        url.searchParams.set("apikey", process.env.GEOCODER_API_KEY!);
        url.searchParams.set("format", "json");
        url.searchParams.set("lang", "ru_RU");
        // Yandex expects lon,lat
        url.searchParams.set("geocode", `${lon},${lat}`);

        const res = await fetch(url.toString());
        if (!res.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to reverse geocode",
          });
        }

        const data = await res.json();
        const members = data?.response?.GeoObjectCollection?.featureMember || [];
        const first = members[0]?.GeoObject;
        const text = first?.metaDataProperty?.GeocoderMetaData?.text || null;
        const name = first?.name || null;
        const description = first?.description || null;

        return {
          text,
          name,
          description,
          raw: data,
        };
      } catch (error) {
        console.error("Error in reverseGeocode:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process reverse geocode request",
        });
      }
    }),
});

export type YandexRouter = typeof yandexRouter;
