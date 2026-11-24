import { Coordenadas } from "@/context/cidade-context";
import { bancoDeDados } from "@/firebase-config";
import { Ocorrencia } from "@/types/ocorrencia";
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";

/**
 * Lê os reportes que estão salvos no Firestore.
 *
 * - Sem `idNotificante`: traz os 50 mais recentes de todo mundo.
 * - Com `idNotificante`: traz só os reportes feitos por aquele usuário.
 *
 * `_centro` ainda não faz nada (filtrar por distância seria um desafio à parte).
 * Deixei o "_" no começo para mostrar que o parâmetro é ignorado de propósito.
 *
 * Detalhe importante: quando uso orderBy("criadoEm"), qualquer documento que
 * não tenha esse campo simplesmente some do resultado.
 */
export async function buscarOcorrencias(
  _centro: Coordenadas,
  idNotificante?: string,
): Promise<Ocorrencia[]> {
  const colecao = collection(bancoDeDados, "ocorrencias");

  // Se eu juntar where e orderBy em campos diferentes, o Firestore exige um
  // índice composto criado no console. Para fugir disso, no caso "meus reportes"
  // eu só filtro no servidor e faço a ordenação aqui no app (mais abaixo).
  // O `query` só descreve o pedido; quem realmente busca é o `getDocs`.
  const consulta = idNotificante
    ? query(colecao, where("idNotificante", "==", idNotificante), limit(100))
    : query(colecao, orderBy("criadoEm", "desc"), limit(50));
  const resultado = await getDocs(consulta);

  // Transforma cada documento cru do Firestore no tipo `Ocorrencia` que as telas esperam.
  const lista: Ocorrencia[] = resultado.docs.map((documento) => {
    const dados = documento.data();
    return {
      id: documento.id, // o id não vem dentro de data(), fica no próprio documento
      titulo: dados.titulo,
      descricao: dados.descricao ?? undefined, // o null do banco vira undefined no app
      status: dados.status,
      latitude: dados.latitude,
      longitude: dados.longitude,
      tipo: dados.tipo ?? undefined, // reportes feitos antes do campo existir não têm tipo
      endereco: dados.endereco ?? undefined, // nem endereço
      // No banco a data é um Timestamp; o .toDate() transforma em Date do JavaScript.
      // Uso `?.` para não quebrar se o campo faltar ou ainda não tiver sido preenchido.
      criadoEm: dados.criadoEm?.toDate(),
      idNotificante: dados.idNotificante,
    };
  });

  // Ordena do mais novo para o mais velho. Na busca geral isso não muda nada
  // (já veio ordenado); serve para a busca com where, que veio sem ordem.
  lista.sort((a, b) => (b.criadoEm?.getTime() ?? 0) - (a.criadoEm?.getTime() ?? 0));

  return lista;
}
