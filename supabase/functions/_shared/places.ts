// Cliente da Google Places API (New) usado pela prospecção.
//
// Os campos do Places são cobrados em faixas (SKU) muito diferentes, então as
// duas chamadas são separadas de propósito:
//
//   searchNearby  → Nearby Search **Pro**: id, nome, endereço, coordenada.
//                   Barato e com cota grátis larga. É o que varre a cidade.
//   placeDetails  → Place Details **Enterprise**: telefone, site, rating,
//                   número de avaliações. Caro, cota grátis apertada — só
//                   roda em lead que a descoberta já encontrou.
//
// A v1 pedia os campos Enterprise em toda busca, o que colocava a varredura
// inteira na faixa cara sem necessidade.

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby";
const DETAILS_URL = "https://places.googleapis.com/v1/places";

/** Nearby Search Pro. Note que NÃO pede telefone, site nem rating. */
const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.businessStatus",
].join(",");

/** Place Details Enterprise. Sem o prefixo `places.` — é outro endpoint. */
const DETAILS_FIELD_MASK = [
  "id",
  "nationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "businessStatus",
].join(",");

export const PROVIDER_PLACES = "google_places";
export const SKU_NEARBY = "nearby_pro";
export const SKU_DETAILS = "details_enterprise";

export interface NearbyPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  businessStatus?: string;
}

export interface PlaceDetails {
  id: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
}

/** Erro que não adianta repetir: tipo de nicho inválido, chave sem permissão. */
export class PermanentPlacesError extends Error {}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A v1 disparava as chamadas em rajada e, em qualquer falha, seguia direto
 * para a próxima — martelando um rate limit que talvez fosse justamente a
 * causa do erro. Aqui 429 e 5xx são repetidos com backoff exponencial e
 * jitter; 4xx (fora 429) sobe como permanente e não gasta mais tentativa.
 */
async function callPlaces(
  url: string,
  init: RequestInit,
  attempt = 0,
): Promise<Response> {
  const res = await fetch(url, init);
  if (res.ok) return res;

  const retriable = res.status === 429 || res.status >= 500;
  const body = await res.text();

  if (!retriable) {
    throw new PermanentPlacesError(`Places API ${res.status}: ${body.slice(0, 300)}`);
  }
  if (attempt >= 3) {
    throw new Error(`Places API ${res.status} após 4 tentativas: ${body.slice(0, 300)}`);
  }

  const backoffMs = 2 ** attempt * 500 + Math.random() * 250;
  await sleep(backoffMs);
  return callPlaces(url, init, attempt + 1);
}

export async function searchNearby(
  apiKey: string,
  opts: { niche: string; lat: number; lng: number; radiusMeters: number },
): Promise<NearbyPlace[]> {
  const res = await callPlaces(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: [opts.niche],
      maxResultCount: 20,
      regionCode: "BR",
      languageCode: "pt-BR",
      locationRestriction: {
        circle: {
          center: { latitude: opts.lat, longitude: opts.lng },
          radius: opts.radiusMeters,
        },
      },
    }),
  });
  const data = await res.json();
  return (data.places ?? []) as NearbyPlace[];
}

export async function placeDetails(apiKey: string, placeId: string): Promise<PlaceDetails> {
  const res = await callPlaces(`${DETAILS_URL}/${encodeURIComponent(placeId)}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": DETAILS_FIELD_MASK,
      "Accept-Language": "pt-BR",
    },
  });
  return (await res.json()) as PlaceDetails;
}

/**
 * O endereço do Places vem como "Rua X, 123 - Bairro, Cidade - CE, CEP, Brasil".
 * O bairro é o argumento mais concreto que a abordagem tem ("vocês do Meireles"),
 * então vale extrair mesmo com heurística simples.
 */
export function extractNeighborhood(address: string | null | undefined): string | null {
  if (!address) return null;
  const match = address.match(/-\s*([^,-]+?)\s*,/);
  const value = match?.[1]?.trim();
  if (!value || value.length < 3 || /^\d/.test(value)) return null;
  return value;
}
