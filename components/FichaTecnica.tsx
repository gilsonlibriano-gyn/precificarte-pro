
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Insumo, Receita, IngredienteReceita, ConfiguracaoProducao } from '../types';
import { getPricingAdvice } from '../geminiService';

interface Props {
  onSaved: () => void;
}

const FichaTecnica: React.FC<Props> = ({ onSaved }) => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [ingredientes, setIngredientes] = useState<IngredienteReceita[]>([]);
  const [config, setConfig] = useState<ConfiguracaoProducao | null>(null);
  const [fixedCostsTotal, setFixedCostsTotal] = useState(0);
  const [depreciationTotal, setDepreciationTotal] = useState(0);
  const [variableExpensesPct, setVariableExpensesPct] = useState(0);

  const [selectedInsumoId, setSelectedInsumoId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [targetProfit, setTargetProfit] = useState<number>(20);
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  
  const [recipeInfo, setRecipeInfo] = useState({
    nome: '',
    categoria: 'Bolos',
    rendimento: 1,
    tempoPreparo: 0,
    observacoes: ''
  });

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    setInsumos(await db.insumos.toArray());
    const c = await db.configuracao.get(1);
    setConfig(c || null);
    
    const cfs = await db.custosFixos.toArray();
    setFixedCostsTotal(cfs.reduce((acc, curr) => acc + curr.valor, 0));
    
    const bens = await db.bensDepreciaveis.toArray();
    setDepreciationTotal(bens.reduce((acc, b) => acc + (b.valorCompra / (b.vidaUtilAnos * 12)), 0));

    const dvs = await db.despesasVariaveis.toArray();
    setVariableExpensesPct(dvs.reduce((acc, d) => acc + d.percentual, 0));
  };

  const addIngrediente = () => {
    const insumo = insumos.find(i => i.id === Number(selectedInsumoId));
    if (!insumo || quantity <= 0) return;

    // Cálculo v5.2: Custo por grama/unid = precoUnitario / pesoEmbalagem
    const costPerGramUnid = insumo.pesoEmbalagem > 0 ? insumo.precoUnitario / insumo.pesoEmbalagem : 0;
    const custo = costPerGramUnid * quantity;

    setIngredientes([...ingredientes, {
      insumoId: insumo.id!,
      nome: insumo.nome,
      quantidade: quantity,
      unidade: insumo.unidadeMedida,
      custo
    }]);
    
    setQuantity(0);
    setSelectedInsumoId('');
  };

  const removeIngrediente = (index: number) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  // CÁLCULOS V5.1 (DELICIARTE PRO)
  const custoMP = ingredientes.reduce((acc, curr) => acc + curr.custo, 0);
  const tempoEmHoras = recipeInfo.tempoPreparo / 60;
  
  const custoMOD = config ? tempoEmHoras * config.valorHoraMOD : 0;
  
  const totalFixoMensal = fixedCostsTotal + depreciationTotal;
  const thcf = config ? totalFixoMensal / config.horasMensaisProducao : 0;
  const custoRateioFixo = tempoEmHoras * thcf;

  const thUtilidades = config ? (config.custoMensalGas + config.custoMensalEletricidade) / config.horasMensaisProducao : 0;
  const custoUtilidades = tempoEmHoras * thUtilidades;

  const custoTotalLote = custoMP + custoMOD + custoRateioFixo + custoUtilidades;
  const custoUnitario = recipeInfo.rendimento > 0 ? custoTotalLote / recipeInfo.rendimento : 0;

  // Precificação via Markup Divisor: PV = Custo / (1 - (DV% + Lucro%))
  const markupDivisor = 1 - ((variableExpensesPct + targetProfit) / 100);
  const precoVendaSugerido = markupDivisor > 0 ? custoUnitario / markupDivisor : 0;

  const handleSave = async () => {
    if (!recipeInfo.nome || ingredientes.length === 0) return;
    const newReceita: Receita = {
      ...recipeInfo,
      rendimento: recipeInfo.rendimento,
      custoProducao: custoTotalLote,
      precoVenda: precoVendaSugerido,
      margemLucro: targetProfit,
      dataCriacao: new Date().toISOString().split('T')[0],
      ingredientes
    };
    await db.receitas.add(newReceita);
    onSaved();
  };

  const getAIAdvice = async () => {
    if (ingredientes.length === 0) return;
    setLoadingAdvice(true);
    const result = await getPricingAdvice(custoUnitario, recipeInfo.categoria, ingredientes.map(i => i.nome));
    setAdvice(result || '');
    setLoadingAdvice(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="lg:col-span-2 space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fa-solid fa-cake-candles text-pink-500"></i>
            Composição da Receita
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Nome da Delícia</label>
              <input value={recipeInfo.nome} onChange={e => setRecipeInfo({...recipeInfo, nome: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none" placeholder="Ex: Bolo Vulcão Ninho" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Rendimento (Unids/Fatias)</label>
              <input type="number" value={recipeInfo.rendimento} onChange={e => setRecipeInfo({...recipeInfo, rendimento: parseInt(e.target.value) || 1})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Tempo de Preparo Lote (Minutos)</label>
              <input type="number" value={recipeInfo.tempoPreparo} onChange={e => setRecipeInfo({...recipeInfo, tempoPreparo: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Categoria</label>
              <select value={recipeInfo.categoria} onChange={e => setRecipeInfo({...recipeInfo, categoria: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none">
                {["Bolos", "Tortas", "Doces", "Salgados", "Sobremesas"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Ingredientes */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Ingredientes</h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <select value={selectedInsumoId} onChange={e => setSelectedInsumoId(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <option value="">Escolha um insumo...</option>
              {insumos.map(i => <option key={i.id} value={i.id}>{i.nome} ({i.unidadeMedida})</option>)}
            </select>
            <input type="number" step="0.01" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} className="w-full sm:w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5" placeholder="Qtd" />
            <button onClick={addIngrediente} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold">Adicionar</button>
          </div>
          <div className="space-y-2">
            {ingredientes.map((ing, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span>{ing.nome} ({ing.quantidade}{ing.unidade})</span>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-700">R$ {ing.custo.toFixed(2)}</span>
                  <button onClick={() => removeIngrediente(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Precificação v5.1 */}
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
          <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Resumo de Precificação</h3>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Insumos (MP)</span>
              <span className="font-bold text-slate-700">R$ {custoMP.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Mão de Obra (MOD)</span>
              <span className="font-bold text-slate-700">R$ {custoMOD.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Rateio Fixo + Deprec.</span>
              <span className="font-bold text-slate-700">R$ {custoRateioFixo.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 font-medium">Gás e Luz</span>
              <span className="font-bold text-slate-700">R$ {custoUtilidades.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-100 my-2"></div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-800">Custo p/ Unidade</span>
              <span className="text-pink-600">R$ {custoUnitario.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-700">Margem Desejada</label>
                <span className="text-pink-500 font-bold">{targetProfit}%</span>
              </div>
              <input type="range" min="5" max="80" step="5" value={targetProfit} onChange={e => setTargetProfit(parseInt(e.target.value))} className="w-full accent-pink-500" />
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Preço de Venda</p>
              <p className="text-4xl font-brand font-bold text-emerald-700">R$ {precoVendaSugerido.toFixed(2)}</p>
              <p className="text-[10px] text-emerald-500 mt-2 font-medium">Considerando {variableExpensesPct}% de Despesas Variáveis</p>
            </div>

            <button onClick={handleSave} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all active:scale-95">Salvar Receita</button>
            <button onClick={getAIAdvice} disabled={loadingAdvice} className="w-full py-3 border border-pink-200 text-pink-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-pink-50 transition-all">
              {loadingAdvice ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-robot"></i>}
              Consultoria IA
            </button>
          </div>

          {advice && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 leading-relaxed max-h-40 overflow-y-auto">
              <h4 className="font-bold text-pink-600 mb-2 uppercase">Mercado Sugere:</h4>
              <div className="prose prose-sm whitespace-pre-line">
                {advice}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FichaTecnica;
