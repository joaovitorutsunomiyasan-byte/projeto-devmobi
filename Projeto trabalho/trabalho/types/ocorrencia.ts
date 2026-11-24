export type StatusOcorrencia = "aberto" | "em_execucao" | "resolvido";

// Categorias de problema que a pessoa escolhe ao reportar (extra do Desafio 1).
// Sem acento de propósito: esses valores são códigos salvos no Firestore.
// O texto com acento, que aparece para o usuário, está em constants/tipos.ts.
export type TipoOcorrencia = "buraco" | "calcada" | "iluminacao" | "outro";

export type Ocorrencia = {
  id: string;
  titulo: string;
  descricao?: string;
  status: StatusOcorrencia;
  latitude: number;
  longitude: number;
  // Campos que entraram nos desafios extras. São opcionais porque os reportes
  // antigos, salvos antes deles, não possuem esses dados no Firestore.
  tipo?: TipoOcorrencia;
  endereco?: string;
  criadoEm?: Date; // veio como Timestamp e foi convertido com .toDate()
  idNotificante?: string; // uid de quem fez o reporte
};
