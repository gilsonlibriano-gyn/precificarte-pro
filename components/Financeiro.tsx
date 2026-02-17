
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { CustoFixo, BemDepreciavel, DespesaVariavel, ConfiguracaoProducao } from '../types';

const TAXAS_DEPRECIACAO = {
  "Eletrodomésticos": { taxa: 10, vida: 10 },
  "Eletrônicos": { taxa: 20, vida: 5 },
  "Móveis/Utensílios": { taxa: 10, vida: 10 },
  "Veículos": { taxa: 20, vida: 5 }
};

const Financeiro: React.FC = () => {
  const [config, setConfig] = useState<ConfiguracaoProducao | null>(null);
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [bens, setBens] = useState<BemDepreciavel[]>([]);
  const [despesas, setDespesas] = useState<DespesaVariavel[]>([]);

  const [newCF, setNewCF] = useState({ nome: '', valor: 0 });
  const [newDV, setNewDV] = useState({ nome: '', percentual: 0 });
  const [newBem, setNewBem] = useState({ nome: '', valorCompra: 0, categoria: 'Eletrodomésticos', dataCompra: new Date().toISOString().split('T')[0] });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const c = await db.configuracao.get(1);
    setConfig(c || null);
    setCustosFixos(await db.custosFixos.toArray());
    setBens(await db.bensDepreciaveis.toArray());
    setDespesas(await db.despesasVariaveis.toArray());
  };

  const saveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (config) await db.configuracao.put(config);
    alert('Configurações salvas!');
  };

  const addCF = async () => {
    if (!newCF.nome || newCF.valor <= 0) return;
    await db.custosFixos.add(newCF);
    setNewCF({ nome: '', valor: 0 });
    loadData();
  };

  const addDV = async () => {
    if (!newDV.nome || newDV.percentual < 0) return;
    await db.despesasVariaveis.add(newDV);
    setNewDV({ nome: '', percentual: 0 });
    loadData();
  };

  const addBem = async () => {
    if (!newBem.nome || newBem.valorCompra <= 0) return;
    const cat = TAXAS_DEPRECIACAO[newBem.categoria as keyof typeof TAXAS_DEPRECIACAO];
    await db.bensDepreciaveis.add({
      ...newBem,
      taxaAnual: cat.taxa,
      vidaUtilAnos: cat.vida
    });
    setNewBem({ nome: '', valorCompra: 0, categoria: 'Eletrodomésticos', dataCompra: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const totalDepreciacaoMensal = bens.reduce((acc, b) => acc + (b.valorCompra / (b.vidaUtilAnos * 12)), 0);
  const totalCustosFixos = custosFixos.reduce((acc, c) => acc + c.valor, 0) + totalDepreciacaoMensal;
  const thcf = config ? totalCustosFixos / config.horasMensaisProducao : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Parâmetros de Produção */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <i className="fa-solid fa-gears text-pink-500"></i>
            Parâmetros de Produção
          </h3>
          {config && (
            <form onSubmit={saveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Valor Hora MOD (R$)</label>
                <input type="number" step="0.01" value={config.valorHoraMOD} onChange={e => setConfig({...config, valorHoraMOD: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Horas Mensais</label>
                <input type="number" value={config.horasMensaisProducao} onChange={e => setConfig({...config, horasMensaisProducao: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Custo Mensal Gás (R$)</label>
                <input type="number" step="0.01" value={config.custoMensalGas} onChange={e => setConfig({...config, custoMensalGas: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Custo Mensal Luz (R$)</label>
                <input type="number" step="0.01" value={config.custoMensalEletricidade} onChange={e => setConfig({...config, custoMensalEletricidade: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2" />
              </div>
              <button type="submit" className="md:col-span-2 py-3 bg-slate-900 text-white rounded-xl font-bold">Salvar Parâmetros</button>
            </form>
          )}
        </section>

        {/* Resumo de Taxas */}
        <section className="bg-slate-900 text-white p-8 rounded-2xl shadow-sm flex flex-col justify-center">
          <h3 className="text-pink-400 font-bold uppercase text-xs tracking-widest mb-4">Taxas Calculadas (Rateio)</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-slate-400 text-sm">THCF (Fixo + Deprec.)</p>
              <p className="text-2xl font-bold">R$ {thcf.toFixed(2)}/h</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Fixo Mensal</p>
              <p className="text-2xl font-bold">R$ {totalCustosFixos.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">TH Gás/Luz</p>
              <p className="text-2xl font-bold">R$ {config ? ((config.custoMensalGas + config.custoMensalEletricidade) / config.horasMensaisProducao).toFixed(2) : '0.00'}/h</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Depreciação/Mês</p>
              <p className="text-2xl font-bold">R$ {totalDepreciacaoMensal.toFixed(2)}</p>
            </div>
          </div>
        </section>

        {/* Custos Fixos e Despesas Variáveis */}
        <section className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Custos Fixos Mensais</h3>
            <div className="flex gap-2 mb-4">
              <input placeholder="Nome" value={newCF.nome} onChange={e => setNewCF({...newCF, nome: e.target.value})} className="flex-1 bg-slate-50 border p-2 rounded-lg" />
              <input type="number" placeholder="Valor" value={newCF.valor} onChange={e => setNewCF({...newCF, valor: parseFloat(e.target.value)})} className="w-24 bg-slate-50 border p-2 rounded-lg" />
              <button onClick={addCF} className="bg-pink-500 text-white px-4 rounded-lg"><i className="fa-solid fa-plus"></i></button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {custosFixos.map(c => (
                <div key={c.id} className="flex justify-between p-2 bg-slate-50 rounded-lg text-sm">
                  <span>{c.nome}</span>
                  <span className="font-bold">R$ {c.valor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Despesas Variáveis (Incidência sobre Venda)</h3>
            <div className="flex gap-2 mb-4">
              <input placeholder="Ex: Imposto Simples" value={newDV.nome} onChange={e => setNewDV({...newDV, nome: e.target.value})} className="flex-1 bg-slate-50 border p-2 rounded-lg" />
              <input type="number" placeholder="%" value={newDV.percentual} onChange={e => setNewDV({...newDV, percentual: parseFloat(e.target.value)})} className="w-24 bg-slate-50 border p-2 rounded-lg" />
              <button onClick={addDV} className="bg-pink-500 text-white px-4 rounded-lg"><i className="fa-solid fa-plus"></i></button>
            </div>
            {despesas.map(d => (
              <div key={d.id} className="flex justify-between p-2 bg-slate-50 rounded-lg text-sm mb-1">
                <span>{d.nome}</span>
                <span className="font-bold">{d.percentual}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* Depreciação de Bens */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-full">
          <h3 className="font-bold text-slate-800 mb-4">Depreciação de Bens (Máquinas/Equip.)</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <input placeholder="Nome do Equipamento" value={newBem.nome} onChange={e => setNewBem({...newBem, nome: e.target.value})} className="col-span-2 bg-slate-50 border p-2 rounded-lg" />
            <input type="number" placeholder="Valor Compra" value={newBem.valorCompra} onChange={e => setNewBem({...newBem, valorCompra: parseFloat(e.target.value)})} className="bg-slate-50 border p-2 rounded-lg" />
            <select value={newBem.categoria} onChange={e => setNewBem({...newBem, categoria: e.target.value})} className="bg-slate-50 border p-2 rounded-lg">
              {Object.keys(TAXAS_DEPRECIACAO).map(k => <option key={k}>{k}</option>)}
            </select>
            <button onClick={addBem} className="col-span-2 bg-pink-500 text-white py-2 rounded-lg font-bold">Adicionar Bem</button>
          </div>
          <div className="space-y-2">
            {bens.map(b => (
              <div key={b.id} className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-bold">{b.nome}</p>
                  <p className="text-slate-400">{b.categoria} • {b.vidaUtilAnos} anos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">R$ {b.valorCompra.toFixed(2)}</p>
                  <p className="text-pink-500">Deprec: R$ {(b.valorCompra / (b.vidaUtilAnos * 12)).toFixed(2)}/mês</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Financeiro;
