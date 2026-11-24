import { TipoOcorrencia } from "@/types/ocorrencia";

// Nome bonito de cada tipo de problema para aparecer na tela (igual ao que fiz em constants/status.ts).
export const TIPOS: Record<TipoOcorrencia, { rotulo: string }> = {
  buraco: { rotulo: "Buraco" },
  calcada: { rotulo: "Calçada" },
  iluminacao: { rotulo: "Iluminação" },
  outro: { rotulo: "Outro" },
};

// Lista de chaves, na ordem em que os botões aparecem no formulário.
export const LISTA_DE_TIPOS = Object.keys(TIPOS) as TipoOcorrencia[];
