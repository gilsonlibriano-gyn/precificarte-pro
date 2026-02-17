
import { Dexie, type Table } from 'dexie';
import { Insumo, Receita, Encomenda, CustoFixo, BemDepreciavel, DespesaVariavel, ConfiguracaoProducao } from './types';

// AppDatabase correctly extends Dexie to inherit version() and on() methods.
// Using the named import for Dexie class to ensure correct type inheritance.
export class AppDatabase extends Dexie {
  insumos!: Table<Insumo>;
  receitas!: Table<Receita>;
  encomendas!: Table<Encomenda>;
  custosFixos!: Table<CustoFixo>;
  bensDepreciaveis!: Table<BemDepreciavel>;
  despesasVariaveis!: Table<DespesaVariavel>;
  configuracao!: Table<ConfiguracaoProducao>;

  constructor() {
    super('DeliciarteDB');
    // Using standard version method from correctly imported Dexie base class
    this.version(2).stores({
      insumos: '++id, nome, categoria',
      receitas: '++id, nome, categoria',
      encomendas: '++id, cliente, dataEntrega, status',
      custosFixos: '++id, nome',
      bensDepreciaveis: '++id, nome, categoria',
      despesasVariaveis: '++id, nome',
      configuracao: 'id'
    });
  }
}

export const db = new AppDatabase();

// Initializing configuration if it doesn't exist. 
// Use the standard on() method of the Dexie instance with correctly imported Dexie.
db.on('ready', async () => {
  const config = await db.configuracao.get(1);
  if (!config) {
    await db.configuracao.add({
      id: 1,
      valorHoraMOD: 20,
      horasMensaisProducao: 160,
      custoMensalGas: 0,
      custoMensalEletricidade: 0
    });
  }
});
