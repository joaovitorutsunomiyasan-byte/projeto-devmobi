import { bancoDeDados } from "@/firebase-config";
import { TipoOcorrencia } from "@/types/ocorrencia";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// Informações que a tela de formulário precisa me entregar para eu salvar um reporte.
// "status" e "criadoEm" ficam de fora de propósito: eu mesmo defino esses dois
// aqui dentro, assim a tela não consegue mandar um valor inválido por engano.
export type DadosDoReporte = {
  idNotificante: string; // uid do usuário logado (a regra do Firestore compara com o auth.uid)
  titulo: string;
  descricao: string;
  latitude: number;
  longitude: number;
  tipo: TipoOcorrencia; // buraco, calçada, iluminação ou outro
  endereco: string | null; // fica null se o endereço não foi encontrado
};

/**
 * Salva um novo documento na coleção "ocorrencias" e retorna o id que ele recebeu.
 *
 * Usei addDoc porque ele cria o id sozinho (com setDoc eu teria que inventar um).
 * Deixei esta função num arquivo separado da tela para a tela não precisar saber
 * nada sobre o Firestore: ela só chama criarReporte e pronto.
 */
export async function criarReporte(dados: DadosDoReporte): Promise<string> {
  const documento = await addDoc(collection(bancoDeDados, "ocorrencias"), {
    idNotificante: dados.idNotificante,
    titulo: dados.titulo.trim(),
    // Se o usuário não escreveu descrição, salvo null. O Firestore recusa
    // `undefined`, então não dá para simplesmente omitir o valor aqui.
    descricao: dados.descricao.trim() || null,
    tipo: dados.tipo,
    endereco: dados.endereco, // string ou null, nunca undefined (mesmo motivo da descrição)
    status: "aberto", // todo reporte começa aberto; depois a prefeitura muda
    latitude: dados.latitude,
    longitude: dados.longitude,
    criadoEm: serverTimestamp(), // o próprio servidor carimba a hora, então não depende do relógio do celular
  });

  return documento.id;
}
