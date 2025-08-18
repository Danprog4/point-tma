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
        console.log("🗺️ Yandex suggest: starting", {
          input,
          apiKey: process.env.API_KEY ? "***" + process.env.API_KEY.slice(-4) : "NOT_SET",
          geocoderApiKey: process.env.GEOCODER_API_KEY
            ? "***" + process.env.GEOCODER_API_KEY.slice(-4)
            : "NOT_SET",
        });

        const url = new URL("https://suggest-maps.yandex.ru/v1/suggest");
        url.searchParams.set("apikey", process.env.API_KEY!);
        url.searchParams.set("text", `${input.city}, ${input.query}`);
        url.searchParams.set("print_address", "1");
        url.searchParams.set("attrs", "uri");
        url.searchParams.set("results", input.results.toString());
        url.searchParams.set("lang", "ru_RU");
        url.searchParams.set("types", input.types);

        console.log(
          "🗺️ Yandex suggest: request URL",
          url.toString().replace(process.env.API_KEY!, "***"),
        );

        const suggestResponse = await fetch(url.toString());

        if (!suggestResponse.ok) {
          console.error("🗺️ Yandex suggest: response not ok", {
            status: suggestResponse.status,
            statusText: suggestResponse.statusText,
            headers: Object.fromEntries(suggestResponse.headers.entries()),
          });
          const errorText = await suggestResponse.text();
          console.error("🗺️ Yandex suggest: error response", errorText);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to fetch suggestions from Yandex API: ${suggestResponse.status} ${errorText}`,
          });
        }

        const suggestData = await suggestResponse.json();
        console.log("🗺️ Yandex suggest: got results", suggestData.results?.length || 0);

        // Возвращаем все результаты поиска
        if (suggestData.results && suggestData.results.length > 0) {
          const resultsWithGeocode = await Promise.all(
            suggestData.results.map(async (result: any, index: number) => {
              let geocodeData = null;
              if (result?.uri) {
                try {
                  const geocodeUrl = `https://geocode-maps.yandex.ru/1.x/?apikey=${process.env.GEOCODER_API_KEY}&lang=ru_RU&sco=latlong&uri=${encodeURIComponent(result.uri)}&format=json`;
                  console.log(`🗺️ Geocode ${index}: fetching`, {
                    uri: result.uri,
                    url: geocodeUrl.replace(process.env.GEOCODER_API_KEY!, "***"),
                  });

                  const geocodeResponse = await fetch(geocodeUrl);

                  if (geocodeResponse.ok) {
                    geocodeData = await geocodeResponse.json();
                    console.log(`🗺️ Geocode ${index}: success`, geocodeData);
                  } else {
                    console.error(`🗺️ Geocode ${index}: failed`, {
                      status: geocodeResponse.status,
                      statusText: geocodeResponse.statusText,
                    });
                    const errorText = await geocodeResponse.text();
                    console.error(`🗺️ Geocode ${index}: error response`, errorText);
                  }
                } catch (error) {
                  console.error(`🗺️ Geocode ${index}: exception`, error);
                }
              } else {
                console.log(`🗺️ Geocode ${index}: no URI, skipping geocode`);
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
