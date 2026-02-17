
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Receita } from '../types';

interface Props {
  onEdit: (id: number) => void;
}

const RecipesLibrary: React.FC<Props> = ({ onEdit }) => {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [search, setSearch] = useState('');
  const [selectedReceita, setSelectedReceita] = useState<Receita | null>(null);

  useEffect(() => {
    loadReceitas();
  }, []);

  const loadReceitas = async () => {
    const data = await db.receitas.toArray();
    setReceitas(data);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Excluir esta receita?')) {
      await db.receitas.delete(id);
      loadReceitas();
    }
  };

  const filtered = receitas.filter(r => r.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">Biblioteca de Delícias</h3>
        <div className="relative max-w-sm w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            placeholder="Buscar receita..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(recipe => (
          <div key={recipe.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all flex flex-col">
            <div className="h-32 bg-slate-100 relative overflow-hidden">
               <img src={`https://picsum.photos/seed/${recipe.id}/400/200`} alt={recipe.nome} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-white/90 backdrop-blur shadow-sm rounded-lg text-[10px] font-bold text-pink-600 uppercase tracking-widest">{recipe.categoria}</span>
               </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h4 className="font-bold text-slate-800 text-lg mb-1">{recipe.nome}</h4>
              <p className="text-xs text-slate-400 mb-4">{recipe.rendimento || 'Rendimento não informado'}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Custo</p>
                  <p className="text-sm font-bold text-pink-500">R$ {recipe.custoProducao.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Venda</p>
                  <p className="text-sm font-bold text-emerald-600">R$ {recipe.precoVenda.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-400">
                  <i className="fa-solid fa-clock text-xs"></i>
                  <span className="text-xs font-medium">{recipe.tempoPreparo} min</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedReceita(recipe)} className="p-2 bg-slate-50 text-slate-400 hover:text-pink-500 rounded-lg transition-colors" title="Ver Detalhes">
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button onClick={() => recipe.id && onEdit(recipe.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-lg transition-colors" title="Editar">
                    <i className="fa-solid fa-pen-to-square"></i>
                  </button>
                  <button onClick={() => recipe.id && handleDelete(recipe.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Excluir">
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white p-20 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <i className="fa-solid fa-utensils text-3xl"></i>
          </div>
          <h3 className="text-lg font-bold text-slate-800">Nenhuma receita encontrada</h3>
          <p className="text-slate-500 mt-2">Crie sua primeira ficha técnica para começar a organizar sua produção.</p>
        </div>
      )}

      {/* Details Modal */}
      {selectedReceita && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">{selectedReceita.categoria}</span>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{selectedReceita.nome}</h3>
              </div>
              <button onClick={() => setSelectedReceita(null)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rendimento</p>
                   <p className="text-slate-800 font-bold">{selectedReceita.rendimento || 'N/A'}</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Preparo</p>
                   <p className="text-slate-800 font-bold">{selectedReceita.tempoPreparo} minutos</p>
                </div>
                <div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Margem</p>
                   <p className="text-slate-800 font-bold">{selectedReceita.margemLucro}x</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Ingredientes</h4>
                <div className="space-y-3">
                  {selectedReceita.ingredientes.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 text-sm border-b border-slate-50 last:border-0">
                      <span className="text-slate-600 font-medium">{ing.nome}</span>
                      <span className="text-slate-400 text-xs">{ing.quantidade}{ing.unidade}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReceita.observacoes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Notas de Preparo</h4>
                  <p className="text-sm text-slate-600 italic whitespace-pre-wrap">{selectedReceita.observacoes}</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
               <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Custo</p>
                    <p className="font-bold text-slate-800">R$ {selectedReceita.custoProducao.toFixed(2)}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Preço</p>
                    <p className="font-bold text-emerald-600">R$ {selectedReceita.precoVenda.toFixed(2)}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedReceita(null)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-900/10">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipesLibrary;
