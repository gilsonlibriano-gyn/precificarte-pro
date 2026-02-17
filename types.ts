
export interface Insumo {
  id?: number;
  nome: string;
  categoria: string;
  unidadeMedida: string;
  qtdAtual: number; // Quantidade de embalagens/unidades compradas
  qtdMinima: number;
  precoUnitario: number; // Preço de uma única embalagem/unidade
  pesoEmbalagem: number; // Peso ou volume de uma única embalagem
  fornecedor: string;
  dataCadastro: string;
}

export interface IngredienteReceita {
  insumoId: number;
  nome: string;
  quantidade: number;
  unidade: string;
  custo: number;
}

export interface Receita {
  id?: number;
  nome: string;
  categoria: string;
  rendimento: number; 
  tempoPreparo: number; // Em minutos
  custoProducao: number; 
  precoVenda: number;
  margemLucro: number; 
  dataCriacao: string;
  observacoes: string;
  ingredientes: IngredienteReceita[];
}

export interface Encomenda {
  id?: number;
  cliente: string;
  telefone: string;
  produto: string; // Nome da Receita
  quantidade: number;
  valorTotal: number;
  despesaEntrega?: number;
  dataPedido: string;
  dataEntrega: string;
  horarioEntrega: string;
  status: 'Pendente' | 'Confirmado' | 'Em Produção' | 'Pronto' | 'Entregue' | 'Cancelado';
  formaPagamento: string;
  observacoes: string;
}

export interface CustoFixo {
  id?: number;
  nome: string;
  valor: number;
}

export interface BemDepreciavel {
  id?: number;
  nome: string;
  valorCompra: number;
  categoria: string;
  dataCompra: string;
  vidaUtilAnos: number;
  taxaAnual: number;
}

export interface DespesaVariavel {
  id?: number;
  nome: string;
  percentual: number;
}

export interface ConfiguracaoProducao {
  id: number;
  valorHoraMOD: number;
  horasMensaisProducao: number;
  custoMensalGas: number;
  custoMensalEletricidade: number;
}

export enum TabType {
  DASHBOARD = 'DASHBOARD',
  ESTOQUE = 'ESTOQUE',
  FICHA_TECNICA = 'FICHA_TECNICA',
  RECEITAS = 'RECEITAS',
  AGENDA = 'AGENDA',
  FINANCEIRO = 'FINANCEIRO',
  RELATORIOS = 'RELATORIOS'
}
