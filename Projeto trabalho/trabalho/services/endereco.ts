import { Coordenadas } from "@/context/cidade-context";
import * as Location from "expo-location";

// Quanto tempo eu espero, no máximo, pelo endereço. Se o serviço demorar demais,
// desisto dele para não segurar o envio do reporte.
const TEMPO_MAXIMO_MS = 5000;

/**
 * Descobre o endereço de um ponto do mapa, ex.: "Rua das Palmeiras, 120 - Centro - Cuiabá".
 *
 * Isso se chama geocodificação reversa (de coordenadas para endereço) e é feito
 * pelo `Location.reverseGeocodeAsync`. Como o endereço é só um extra, esta função
 * nunca dá erro: se falhar, demorar ou não achar nada, devolve `null` e o reporte
 * é salvo do mesmo jeito, apenas sem o campo `endereco`.
 */
export async function buscarEndereco(coordenadas: Coordenadas): Promise<string | null> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  try {
    // Faço uma "corrida": ganha quem terminar primeiro, o endereço ou o erro de tempo esgotado.
    const limite = new Promise<never>((_, rejeitar) => {
      temporizador = setTimeout(() => rejeitar(new Error("tempo esgotado")), TEMPO_MAXIMO_MS);
    });
    const [lugar] = await Promise.race([Location.reverseGeocodeAsync(coordenadas), limite]);
    if (!lugar) {
      return null;
    }

    // Monta o texto "rua, número - bairro - cidade", ignorando as partes que vierem vazias.
    const rua = [lugar.street, lugar.streetNumber].filter(Boolean).join(", ");
    const partes = [rua, lugar.district, lugar.city ?? lugar.subregion].filter(Boolean);
    return partes.length > 0 ? partes.join(" - ") : null;
  } catch (erro) {
    console.warn("Não foi possível descobrir o endereço", erro);
    return null;
  } finally {
    clearTimeout(temporizador); // cancela o cronômetro quando o endereço chegou antes do limite
  }
}
