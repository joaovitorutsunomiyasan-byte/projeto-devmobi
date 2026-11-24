import { LISTA_DE_TIPOS, TIPOS } from "@/constants/tipos";
import { useAuth } from "@/hooks/use-auth";
import { useCidade } from "@/hooks/use-cidade";
import { buscarEndereco } from "@/services/endereco";
import { criarReporte } from "@/services/reportes";
import { cores } from "@/styles";
import { TipoOcorrencia } from "@/types/ocorrencia";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NovoReporte() {
  const roteador = useRouter();
  const { user: usuario } = useAuth(); // quem está logado no Firebase (null se ninguém)
  const { coordenadas } = useCidade(); // posição do GPS (null se a permissão não foi dada)

  // Um estado para cada campo do formulário, mais um para saber se está enviando.
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoOcorrencia>("buraco"); // começa com "buraco" marcado
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    // Primeiro confiro tudo o que pode estar faltando. Se algo falhar, aviso o
    // usuário e saio da função sem tocar no banco.
    if (!titulo.trim()) {
      Alert.alert("Falta o título", "Escreva rapidamente qual é o problema.");
      return;
    }
    if (!usuario) {
      Alert.alert("Você precisa entrar", "Faça login para conseguir enviar um reporte.");
      return;
    }
    if (!coordenadas) {
      Alert.alert("Sem localização", "Ligue o GPS do aparelho e tente de novo.");
      return;
    }

    setEnviando(true); // trava o botão (evita enviar duas vezes) e liga o indicador de carregamento
    try {
      // O endereço é um extra. Se não der para achá-lo (sem internet, serviço lento),
      // buscarEndereco devolve null e o reporte segue normalmente sem ele.
      const endereco = await buscarEndereco(coordenadas);

      await criarReporte({
        idNotificante: usuario.uid,
        titulo,
        descricao,
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
        tipo,
        endereco,
      });
      // A tela só fecha depois que o usuário toca em OK no aviso.
      Alert.alert("Tudo certo!", "Seu reporte foi registrado. Obrigado por ajudar a cidade!", [
        { text: "OK", onPress: () => roteador.back() },
      ]);
    } catch (erro) {
      // O erro técnico vai só para o console (ajuda a depurar, ex.: "Missing or
      // insufficient permissions"). Para o usuário mostro uma frase simples.
      console.warn("Falha ao gravar o reporte", erro);
      Alert.alert("Falha no envio", "Não consegui salvar o reporte. Tente novamente daqui a pouco.");
    } finally {
      // O finally executa dando certo ou errado, então o botão nunca fica travado para sempre.
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.container}>
      <Text style={estilos.titulo}>Registrar problema</Text>

      <TextInput
        style={estilos.campo}
        placeholder="O que aconteceu? (ex.: Buraco na Rua das Palmeiras)"
        value={titulo}
        onChangeText={setTitulo}
      />
      <TextInput
        style={[estilos.campo, estilos.campoGrande]}
        placeholder="Mais detalhes (opcional)"
        value={descricao}
        onChangeText={setDescricao}
        multiline
      />

      {/* Seleção do tipo por botões; o botão escolhido muda para verde. */}
      <Text style={estilos.rotulo}>Categoria</Text>
      <View style={estilos.tipos}>
        {LISTA_DE_TIPOS.map((opcao) => {
          const selecionado = opcao === tipo;
          return (
            <TouchableOpacity
              key={opcao}
              style={[estilos.botaoTipo, selecionado && estilos.botaoTipoSelecionado]}
              onPress={() => setTipo(opcao)}
              disabled={enviando}
              accessibilityRole="button"
              accessibilityState={{ selected: selecionado }}
            >
              <Text style={[estilos.textoDoTipo, selecionado && estilos.textoDoTipoSelecionado]}>
                {TIPOS[opcao].rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[estilos.botao, enviando && estilos.botaoDesabilitado]}
        onPress={enviar}
        disabled={enviando}
      >
        {/* Durante o envio aparece uma rodinha de carregamento ao lado do texto. */}
        {enviando && <ActivityIndicator color={cores.branco} />}
        <Text style={estilos.textoDoBotao}>{enviando ? "Salvando..." : "Enviar"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => roteador.back()} disabled={enviando}>
        <Text style={estilos.cancelar}>Voltar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, backgroundColor: cores.bgBrancoGelo },
  titulo: { fontSize: 22, fontWeight: "700", color: cores.preto },
  campo: { backgroundColor: cores.branco, borderRadius: 12, padding: 14, fontSize: 15 },
  campoGrande: { minHeight: 100, textAlignVertical: "top" },
  rotulo: { fontSize: 14, fontWeight: "600", color: cores.cinzaEscuro },
  tipos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  botaoTipo: {
    backgroundColor: cores.branco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.googleBorda,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  botaoTipoSelecionado: { backgroundColor: cores.verde, borderColor: cores.verde },
  textoDoTipo: { fontSize: 14, color: cores.preto },
  textoDoTipoSelecionado: { color: cores.branco, fontWeight: "700" },
  botao: {
    backgroundColor: cores.verde,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  botaoDesabilitado: { opacity: 0.7 },
  textoDoBotao: { color: cores.branco, fontWeight: "700", fontSize: 16 },
  cancelar: { textAlign: "center", color: cores.cinzaEscuro, padding: 8 },
});
