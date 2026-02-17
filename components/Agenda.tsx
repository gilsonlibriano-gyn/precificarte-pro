
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Encomenda } from '../types';

const Agenda: React.FC = () => {
  const [encomendas, setEncomendas] = useState<Encomenda[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Encomenda>>({
    cliente: '', telefone: '', produto: '', quantidade: 1, valorTotal: 0, despesaEntrega: 0,
    dataPedido: new Date().toISOString().split('T')[0],
    dataEntrega: '', horarioEntrega: '', status: 'Pendente', formaPagamento: 'PIX', observacoes: ''
  });

  useEffect(() => {
    loadEncomendas();
  }, []);

  const loadEncomendas = async () => {
    const data = await db.encomendas.orderBy('dataEntrega').toArray();
    setEncomendas(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.id) {
       await db.encomendas.update(formData.id, formData as Encomenda);
    } else {
       await db.encomendas.add(formData as Encomenda);
    }
    setShowModal(false);
    loadEncomendas();
    setFormData({
      cliente: '', telefone: '', produto: '', quantidade: 1, valorTotal: 0, despesaEntrega: 0,
      dataPedido: new Date().toISOString().split('T')[0],
      dataEntrega: '', horarioEntrega: '', status: 'Pendente', formaPagamento: 'PIX', observacoes: ''
    });
  };

  const handleEdit = (enc: Encomenda) => {
    setFormData(enc);
    setShowModal(true);
  };

  const updateStatus = async (id: number, status: Encomenda['status']) => {
    await db.encomendas.update(id, { status });
    loadEncomendas();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-amber-100 text-amber-700';
      case 'Em Produção': return 'bg-blue-100 text-blue-700';
      case 'Pronto': return 'bg-emerald-100 text-emerald-700';
      case 'Entregue': return 'bg-slate-100 text-slate-500';
      case 'Cancelado': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const filtered = encomendas.filter(e => 
    e.cliente.toLowerCase().includes(search.toLowerCase()) || 
    e.produto.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
           <h3 className="text-lg font-bold text-slate-800">Próximos Pedidos</h3>
           <p className="text-xs text-slate-400 font-medium">Gerencie suas entregas e prazos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 max-w-2xl justify-end">
           <div className="relative w-full sm:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"
                placeholder="Pesquisar pedido..."
              />
           </div>
           <button 
             onClick={() => {setFormData({cliente: '', telefone: '', produto: '', quantidade: 1, valorTotal: 0, despesaEntrega: 0, dataPedido: new Date().toISOString().split('T')[0], dataEntrega: '', horarioEntrega: '', status: 'Pendente', formaPagamento: 'PIX', observacoes: ''}); setShowModal(true);}}
             className="w-full sm:w-auto px-6 py-2.5 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
           >
             <i className="fa-solid fa-plus"></i>
             Novo Pedido
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(enc => (
          <div key={enc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-pink-200 transition-all">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
               <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(enc.dataEntrega).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                  <p className="text-xl font-bold text-slate-800">{new Date(enc.dataEntrega).getDate()}</p>
               </div>
               <div>
                  <h4 className="text-lg font-bold text-slate-800">{enc.cliente}</h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm font-medium text-pink-600">{enc.produto}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-xs text-slate-400 font-medium">Qtd: {enc.quantidade}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="text-xs text-slate-400 font-medium">Previsão: {enc.horarioEntrega}h</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
               <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor</p>
                  <p className="text-lg font-bold text-slate-800">R$ {enc.valorTotal.toFixed(2)}</p>
               </div>
               <div className="flex flex-col gap-2">
                  <select 
                    value={enc.status}
                    onChange={(e) => updateStatus(enc.id!, e.target.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer ${getStatusColor(enc.status)}`}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Em Produção">Em Produção</option>
                    <option value="Pronto">Pronto</option>
                    <option value="Entregue">Entregue</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => handleEdit(enc)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all"><i className="fa-solid fa-pencil"></i></button>
                  <button onClick={() => db.encomendas.delete(enc.id!).then(loadEncomendas)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><i className="fa-solid fa-trash-can"></i></button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
             <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{formData.id ? 'Editar Pedido' : 'Novo Pedido'}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark text-xl"></i></button>
             </div>
             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Cliente</label>
                      <input required value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" placeholder="Nome completo" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Telefone</label>
                      <input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" placeholder="(00) 00000-0000" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Produto (Receita)</label>
                      <input required value={formData.produto} onChange={e => setFormData({...formData, produto: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" placeholder="Ex: Bolo de Cenoura" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">Quantidade</label>
                        <input type="number" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">Valor Total (R$)</label>
                        <input type="number" step="0.01" value={formData.valorTotal} onChange={e => setFormData({...formData, valorTotal: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Data Entrega</label>
                      <input required type="date" value={formData.dataEntrega} onChange={e => setFormData({...formData, dataEntrega: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase">Taxa de Entrega (R$)</label>
                      <input type="number" step="0.01" value={formData.despesaEntrega} onChange={e => setFormData({...formData, despesaEntrega: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none" placeholder="0.00" />
                   </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-50 rounded-xl">Cancelar</button>
                   <button type="submit" className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-900/10">Salvar Pedido</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
