import { config } from "@/config/envConfig";

const placesApiUrl = "https://places.googleapis.com/v1";

interface GoogleAddressComponent {
  longText?: string;
  types?: string[];
}

interface GoogleAutocompleteResponse {
  suggestions?: {
    placePrediction?: { placeId?: string; text?: { text?: string } };
  }[];
}

interface GooglePlaceDetailsResponse {
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
}

export interface AddressSuggestion {
  place_id: string;
  description: string;
}

export interface SuggestedAddress {
  address: string;
  address_2?: string;
  city?: string;
  pincode?: string;
  state?: string;
  country?: string;
}

const googleHeaders = (fieldMask: string) => {
  if (!config.GOOGLE_MAPS_API_KEY) throw new Error("Google Places is not configured.");
  return {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": config.GOOGLE_MAPS_API_KEY,
    "X-Goog-FieldMask": fieldMask,
  };
};

const readGoogleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Google Places request failed with status ${String(response.status)}.`);
  }
  return (await response.json()) as T;
};

export const hasGooglePlacesConfiguration = () => Boolean(config.GOOGLE_MAPS_API_KEY);

export const findAddressSuggestions = async (
  input: string,
  sessionToken?: string,
): Promise<AddressSuggestion[]> => {
  const response = await fetch(`${placesApiUrl}/places:autocomplete`, {
    method: "POST",
    headers: googleHeaders(
      "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
    ),
    body: JSON.stringify({
      input,
      includedRegionCodes: ["in"],
      languageCode: "en",
      regionCode: "in",
      ...(sessionToken ? { sessionToken } : {}),
    }),
    signal: AbortSignal.timeout(5_000),
  });
  const data = await readGoogleResponse<GoogleAutocompleteResponse>(response);

  return (data.suggestions ?? []).flatMap(({ placePrediction }) =>
    placePrediction?.placeId && placePrediction.text?.text
      ? [{ place_id: placePrediction.placeId, description: placePrediction.text.text }]
      : [],
  );
};

export const findAddressDetails = async (
  placeId: string,
  sessionToken?: string,
): Promise<SuggestedAddress> => {
  const searchParams = new URLSearchParams({
    languageCode: "en",
    regionCode: "in",
    ...(sessionToken ? { sessionToken } : {}),
  });
  const response = await fetch(
    `${placesApiUrl}/places/${encodeURIComponent(placeId)}?${searchParams.toString()}`,
    {
      headers: googleHeaders("formattedAddress,addressComponents"),
      signal: AbortSignal.timeout(5_000),
    },
  );
  const data = await readGoogleResponse<GooglePlaceDetailsResponse>(response);
  const components = data.addressComponents ?? [];
  const component = (...types: string[]) =>
    components.find((item) => types.some((type) => item.types?.includes(type)))?.longText ?? "";
  const street = [component("street_number"), component("route")].filter(Boolean).join(" ");
  const address = [component("subpremise"), component("premise"), street]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(", ");
  const additionalAddress = [
    component("neighborhood"),
    component("sublocality_level_2"),
    component("sublocality_level_1", "sublocality"),
  ]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .join(", ");
  const fallbackAddress = data.formattedAddress?.split(",")[0]?.trim() ?? "";

  return {
    address: address.length > 0 ? address : fallbackAddress,
    ...(additionalAddress ? { address_2: additionalAddress } : {}),
    city: component("locality", "postal_town", "administrative_area_level_3"),
    state: component("administrative_area_level_1"),
    pincode: component("postal_code"),
    country: component("country"),
  };
};
