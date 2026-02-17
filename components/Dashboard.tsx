
import React, { useEffect, useState } from 'react';
import { db } from '../db';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalFaturamento: 0,
    pedidosMes: 0,
    insumosBaixos: 0,
    pontoEquilibrio: 0,
    margemContribMedia: 0
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const orders = await db.encomendas.toArray();
    const config = await db.configuracao.get(1);
    const cfs = await db.custosFixos.toArray();
    const bens = await db.bensDepreciaveis.toArray();
    const recipes = await db.receitas.toArray();

    const totalFaturado = orders.reduce((acc, curr) => curr.status !== 'Cancelado' ? acc + curr.valorTotal : acc, 0);
    const totalFixoMensal = cfs.reduce((acc, c) => acc + c.valor, 0) + bens.reduce((acc, b) => acc + (b.valorCompra / (b.vidaUtilAnos * 12)), 0);

    // Estimativa de Margem de Contribuição Média (baseado nas receitas)
    const mcMedia = recipes.length > 0 ? recipes.reduce((acc, r) => {
      const cv = r.custoProducao; // Na v5.1 custoProducao é o CV total
      const pv = r.precoVenda;
      return acc + (pv - cv) / pv;
    }, 0) / recipes.length : 0.4; // Default 40%

    // Ponto de Equilíbrio em Valor: Custos Fixos / IMC
    const pe = mcMedia > 0 ? totalFixoMensal / mcMedia : 0;

    setMetrics({
      totalFaturamento: totalFaturado,
      pedidosMes: orders.length,
      insumosBaixos: 0, // Mock
      pontoEquilibrio: pe,
      margemContribMedia: mcMedia * 100
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Faturamento Bruto</p>
          <h3 className="text-2xl font-bold text-slate-800">R$ {metrics.totalFaturamento.toFixed(2)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-pink-500 text-xs font-bold uppercase mb-1">Ponto de Equilíbrio</p>
          <h3 className="text-2xl font-bold text-slate-800">R$ {metrics.pontoEquilibrio.toFixed(2)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Faturamento mínimo necessário p/ pagar fixos</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-emerald-500 text-xs font-bold uppercase mb-1">Margem Média</p>
          <h3 className="text-2xl font-bold text-slate-800">{metrics.margemContribMedia.toFixed(1)}%</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-blue-500 text-xs font-bold uppercase mb-1">Status de Meta</p>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${Math.min((metrics.totalFaturamento / metrics.pontoEquilibrio) * 100, 100)}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{((metrics.totalFaturamento / (metrics.pontoEquilibrio || 1)) * 100).toFixed(0)}% do P.E. atingido</p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <h3 className="text-3xl font-brand mb-4">Bem-vindo ao Deliciarte Pro v5.1</h3>
          <p className="text-slate-400 max-w-2xl mb-8 leading-relaxed">Sua gestão agora conta com custeio por absorção real, depreciação automatizada e precificação inteligente via Markup Divisor. O sistema está calibrado para o mercado profissional.</p>
          <div className="flex gap-4">
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                <i className="fa-solid fa-chart-line text-pink-400"></i>
                <span className="text-sm font-medium">Saúde Financeira: {metrics.totalFaturamento > metrics.pontoEquilibrio ? 'Lucrativa' : 'Em Recuperação'}</span>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <i className="fa-solid fa-cookie-bite text-[15rem] rotate-12"></i>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
