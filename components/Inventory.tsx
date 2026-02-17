
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Insumo } from '../types';

const Inventory: React.FC = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<Partial<Insumo>>({
    nome: '', 
    categoria: 'Outros', 
    unidadeMedida: 'g', 
    qtdAtual: 0, 
    qtdMinima: 0, 
    precoUnitario: 0,
    pesoEmbalagem: 0,
    fornecedor: ''
  });

  const categories = ["Farinha", "Açúcar", "Laticínios", "Ovos", "Gorduras", "Frutas", "Chocolate", "Decoração", "Outros"];

  useEffect(() => { loadInsumos(); }, []);

  const loadInsumos = async () => setInsumos(await db.insumos.toArray());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Insumo = { 
      ...(formData as Insumo), 
      dataCadastro: new Date().toISOString().split('T')[0] 
    };
    if (editingId) { 
      await db.insumos.update(editingId, data); 
      setEditingId(null); 
    }
    else { 
      await db.insumos.add(data); 
    }
    setFormData({ 
      nome: '', 
      categoria: 'Outros', 
      unidadeMedida: 'g', 
      qtdAtual: 0, 
      qtdMinima: 0, 
      precoUnitario: 0,
      pesoEmbalagem: 0,
      fornecedor: '' 
    });
    loadInsumos();
  };

  const handleEdit = (insumo: Insumo) => { 
    setFormData(insumo); 
    setEditingId(insumo.id || null); 
  };

  const handleDelete = async (id: number) => { 
    if (confirm('Excluir este insumo?')) { 
      await db.insumos.delete(id); 
      loadInsumos(); 
    } 
  };

  const filtered = insumos.filter(i => i.nome.toLowerCase().includes(search.toLowerCase()));

  // Cálculos automáticos para o formulário
  const pesoEmbalagemTotal = (formData.qtdAtual || 0) * (formData.pesoEmbalagem || 0);
  const valorTotal = (formData.qtdAtual || 0) * (formData.precoUnitario || 0);
  const custoPorGramaUnid = pesoEmbalagemTotal > 0 ? valorTotal / pesoEmbalagemTotal : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fa-solid fa-box-open text-pink-500"></i>
          {editingId ? 'Editar Insumo' : 'Novo Insumo'}
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Nome</label>
            <input 
              required 
              value={formData.nome} 
              onChange={e => setFormData({...formData, nome: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-pink-500/20 outline-none" 
              placeholder="Ex: Chocolate Meio Amargo"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Categoria</label>
            <select 
              value={formData.categoria} 
              onChange={e => setFormData({...formData, categoria: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none"
            >
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Unidade</label>
            <select 
              value={formData.unidadeMedida} 
              onChange={e => setFormData({...formData, unidadeMedida: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none"
            >
              {["g", "kg", "ml", "L", "unid"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Qtd Comprada (Emb/Unid)</label>
            <input 
              type="number" 
              required
              value={formData.qtdAtual} 
              onChange={e => setFormData({...formData, qtdAtual: parseFloat(e.target.value) || 0})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Peso da Embalagem ({formData.unidadeMedida})</label>
            <input 
              type="number" 
              required
              value={formData.pesoEmbalagem} 
              onChange={e => setFormData({...formData, pesoEmbalagem: parseFloat(e.target.value) || 0})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Preço Unitário (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              required
              value={formData.precoUnitario} 
              onChange={e => setFormData({...formData, precoUnitario: parseFloat(e.target.value) || 0})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-pink-500 uppercase tracking-tighter">Peso Embalagem Total</label>
            <div className="w-full bg-pink-50/30 border border-pink-100 rounded-xl px-4 py-2 text-slate-700 font-bold">
              {pesoEmbalagemTotal.toLocaleString('pt-BR')} {formData.unidadeMedida}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Valor Total</label>
            <div className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl px-4 py-2 text-emerald-700 font-bold">
              R$ {valorTotal.toFixed(2)}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-blue-500 uppercase tracking-tighter">Custo por Grama/ML</label>
            <div className="w-full bg-blue-50/30 border border-blue-100 rounded-xl px-4 py-2 text-blue-700 font-bold">
              R$ {custoPorGramaUnid.toFixed(4)}
            </div>
          </div>
          
          <div className="lg:col-span-3 flex items-end gap-2 pt-4">
            <button 
              type="submit" 
              className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 hover:bg-pink-600 transition-all active:scale-95"
            >
              {editingId ? 'Salvar Alterações' : 'Adicionar ao Estoque'}
            </button>
            {editingId && (
              <button 
                onClick={() => {
                  setEditingId(null);
                  setFormData({ nome: '', categoria: 'Outros', unidadeMedida: 'g', qtdAtual: 0, qtdMinima: 0, precoUnitario: 0, pesoEmbalagem: 0, fornecedor: '' });
                }} 
                className="py-3 px-6 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h4 className="font-bold text-slate-700 uppercase text-xs tracking-widest">Listagem de Insumos</h4>
            <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input 
                    type="text" 
                    placeholder="Pesquisar..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-pink-500/10"
                />
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                <tr>
                  <th className="p-6">Insumo</th>
                  <th className="p-6">Estoque</th>
                  <th className="p-6">Preço Unitário</th>
                  <th className="p-6 text-blue-500">Custo p/ G/ML</th>
                  <th className="p-6">Valor Total</th>
                  <th className="p-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(i => {
                  const totalValue = i.precoUnitario * i.qtdAtual;
                  const totalWeight = i.pesoEmbalagem * i.qtdAtual;
                  const unitCost = totalWeight > 0 ? totalValue / totalWeight : 0;
                  return (
                    <tr key={i.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-6">
                        <span className="font-bold text-slate-700">{i.nome}</span>
                        <span className="block text-[10px] font-normal text-slate-400">{i.categoria}</span>
                      </td>
                      <td className="p-6">
                        <span className="font-bold text-slate-700">{i.qtdAtual} emb.</span>
                        <span className="block text-[10px] font-normal text-slate-400">{totalWeight.toLocaleString()} {i.unidadeMedida} total</span>
                      </td>
                      <td className="p-6 font-mono text-slate-500 text-sm">R$ {i.precoUnitario.toFixed(2)}</td>
                      <td className="p-6 font-mono text-blue-600 font-bold text-sm">R$ {unitCost.toFixed(4)}</td>
                      <td className="p-6 font-mono text-emerald-600 font-bold">R$ {totalValue.toFixed(2)}</td>
                      <td className="p-6 text-right">
                        <div className="flex justify-center gap-2">
                            <button onClick={() => handleEdit(i)} className="p-2 text-slate-400 hover:text-pink-500 transition-all">
                                <i className="fa-solid fa-pen text-sm"></i>
                            </button>
                            <button onClick={() => handleDelete(i.id!)} className="p-2 text-slate-400 hover:text-red-500 transition-all">
                                <i className="fa-solid fa-trash text-sm"></i>
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
