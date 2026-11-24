import { Coordenadas } from "@/context/cidade-context";
import { buscarOcorrencias } from "@/services/ocorrencias";
import { Ocorrencia } from "@/types/ocorrencia";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/**
 * Hook que entrega a lista de ocorrências para as telas (mapa e lista).
 * A busca acontece sempre que a tela volta a ficar em foco, então um reporte
 * que acabei de criar já aparece quando eu volto da tela de formulário.
 *
 * Por que useFocusEffect e não useEffect? Porque na navegação em pilha o mapa
 * continua montado por baixo do formulário. O useEffect não dispara de novo ao
 * voltar, já o useFocusEffect dispara toda vez que a tela ganha o foco.
 *
 * `idNotificante` é opcional: se vier preenchido, só os reportes dessa pessoa são buscados.
 * `recarregar` e `atualizando` existem para o gesto de puxar a lista para atualizar.
 */
export function useOcorrencias(coordenadas: Coordenadas | null, idNotificante?: string) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(false); // busca automática, ao abrir a tela
  const [atualizando, setAtualizando] = useState(false); // busca manual, ao puxar a lista

  useFocusEffect(
    // O useCallback é obrigatório: sem ele a função seria nova a cada render e a
    // busca ficaria rodando em loop. Quando `idNotificante` muda (de "Todos" para
    // "Meus", por exemplo), a função também muda e a busca é refeita.
    useCallback(() => {
      if (!coordenadas) {
        return;
      }
      let ativo = true; // vira false se a tela sair de foco, para não atualizar estado à toa
      setCarregando(true);
      buscarOcorrencias(coordenadas, idNotificante)
        .then((lista) => ativo && setOcorrencias(lista))
        .catch((erro) => console.warn("Falha ao buscar ocorrências", erro))
        .finally(() => ativo && setCarregando(false));
      // Limpeza: executa quando a tela perde o foco ou os parâmetros mudam.
      return () => {
        ativo = false;
      };
    }, [coordenadas, idNotificante]),
  );

  // Busca de novo quando o usuário pede. Retorna uma Promise para o RefreshControl
  // saber o momento de parar de girar.
  const recarregar = useCallback(async () => {
    if (!coordenadas) {
      return;
    }
    setAtualizando(true);
    try {
      setOcorrencias(await buscarOcorrencias(coordenadas, idNotificante));
    } catch (erro) {
      console.warn("Falha ao atualizar ocorrências", erro);
    } finally {
      setAtualizando(false);
    }
  }, [coordenadas, idNotificante]);

  return { ocorrencias, carregando, atualizando, recarregar };
}
