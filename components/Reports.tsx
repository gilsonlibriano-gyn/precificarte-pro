
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { Receita, Encomenda, CustoFixo, DespesaVariavel, BemDepreciavel } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any>({
    salesByCategory: [],
    totals: { revenue: 0, count: 0 },
    profitComposition: []
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const orders = await db.encomendas.toArray();
    const recipes = await db.receitas.toArray();
    const fixedCosts = await db.custosFixos.toArray();
    const variableExpenses = await db.despesasVariaveis.toArray();
    const assets = await db.bensDepreciaveis.toArray();

    // 1. Totais básicos
    const activeOrders = orders.filter(o => o.status !== 'Cancelado');
    const totalRevenue = activeOrders.reduce((acc, curr) => acc + curr.valorTotal, 0);

    // 2. Custos Fixos Totais
    const monthlyFixed = fixedCosts.reduce((acc, c) => acc + c.valor, 0);
    const monthlyDepreciation = assets.reduce((acc, b) => acc + (b.valorCompra / (b.vidaUtilAnos * 12)), 0);
    const totalFixedCosts = monthlyFixed + monthlyDepreciation;

    // 3. Impostos %
    const taxPct = variableExpenses.reduce((acc, d) => acc + d.percentual, 0) / 100;

    // 4. Composição do Lucro por Produto
    // Mapear produtos que tiveram vendas
    const productNames = Array.from(new Set(activeOrders.map(o => o.produto)));
    
    const composition = productNames.map(pName => {
      const productOrders = activeOrders.filter(o => o.produto === pName);
      const recipe = recipes.find(r => r.nome === pName);
      
      const sales = productOrders.reduce((acc, o) => acc + o.valorTotal, 0);
      const qtySold = productOrders.reduce((acc, o) => acc + o.quantidade, 0);
      const deliveryExp = productOrders.reduce((acc, o) => acc + (o.despesaEntrega || 0), 0);
      
      const cpv = recipe ? recipe.custoProducao * qtySold : 0;
      const taxes = sales * taxPct;
      
      const mcValue = sales - cpv - deliveryExp - taxes;
      const mcPct = sales > 0 ? (mcValue / sales) * 100 : 0;

      // Rateio de custos fixos baseado no faturamento (Participação no faturamento)
      const participation = totalRevenue > 0 ? sales / totalRevenue : 0;
      const allocatedFixed = totalFixedCosts * participation;
      
      const profit = mcValue - allocatedFixed;
      const profitPct = sales > 0 ? (profit / sales) * 100 : 0;

      return {
        name: pName,
        sales,
        cpv,
        deliveryExp,
        taxes,
        mcValue,
        mcPct,
        fixed: allocatedFixed,
        profit,
        profitPct
      };
    });

    // Linha Total
    const totalLine = {
      name: 'TOTAL',
      sales: totalRevenue,
      cpv: composition.reduce((acc, c) => acc + c.cpv, 0),
      deliveryExp: composition.reduce((acc, c) => acc + c.deliveryExp, 0),
      taxes: composition.reduce((acc, c) => acc + c.taxes, 0),
      mcValue: composition.reduce((acc, c) => acc + c.mcValue, 0),
      mcPct: totalRevenue > 0 ? (composition.reduce((acc, c) => acc + c.mcValue, 0) / totalRevenue) * 100 : 0,
      fixed: totalFixedCosts,
      profit: composition.reduce((acc, c) => acc + c.mcValue, 0) - totalFixedCosts,
      profitPct: totalRevenue > 0 ? ((composition.reduce((acc, c) => acc + c.mcValue, 0) - totalFixedCosts) / totalRevenue) * 100 : 0
    };

    setReportData({
      salesByCategory: composition.map(c => ({ name: c.name, value: c.sales })),
      totals: { revenue: totalRevenue, count: activeOrders.length },
      profitComposition: [...composition, totalLine]
    });
  };

  const COLORS = ['#ec4899', '#f43f5e', '#fb7185', '#fda4af', '#fff1f2'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Faturamento Real</p>
            <p className="text-3xl font-brand font-bold text-pink-600">R$ {reportData.totals.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
         <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ticket Médio</p>
            <p className="text-3xl font-brand font-bold text-slate-800">R$ {(reportData.totals.revenue / (reportData.totals.count || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
         </div>
         <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pedidos</p>
            <p className="text-3xl font-brand font-bold text-slate-800">{reportData.totals.count}</p>
         </div>
      </div>

      {/* Tabela – Composição do Lucro */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
           <h3 className="font-bold text-slate-800">Tabela – Composição do Lucro</h3>
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v5.1 Estratégica</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="p-4 border-r border-slate-200 sticky left-0 bg-slate-100 z-10 w-48 text-left">Item</th>
                {reportData.profitComposition.map((prod: any, idx: number) => (
                  <th key={idx} className={`p-4 text-right min-w-[140px] ${prod.name === 'TOTAL' ? 'bg-pink-50 text-pink-600' : ''}`}>
                    {prod.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white border-r border-slate-200">Vendas</td>
                {reportData.profitComposition.map((p: any, i: number) => <td key={i} className="p-4 text-right text-slate-600">R$ {p.sales.toFixed(2)}</td>)}
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white border-r border-slate-200">(–) CPV</td>
                {reportData.profitComposition.map((p: any, i: number) => <td key={i} className="p-4 text-right text-red-400">R$ {p.cpv.toFixed(2)}</td>)}
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white border-r border-slate-200">(–) Despesa com entregas</td>
                {reportData.profitComposition.map((p: any, i: number) => <td key={i} className="p-4 text-right text-slate-400">R$ {p.deliveryExp.toFixed(2)}</td>)}
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-700 sticky left-0 bg-white border-r border-slate-200">(–) Impostos s/ faturamento</td>
                {reportData.profitComposition.map((p: any, i: number) => <td key={i} className="p-4 text-right text-slate-400">R$ {p.taxes.toFixed(2)}</td>)}
              </tr>
              <tr className="bg-emerald-50 font-bold">
                <td className="p-4 text-emerald-700 sticky left-0 bg-emerald-50 border-r border-slate-200">(=) Margem de contribuição</td>
                {reportData.profitComposition.map((p: any, i: number) => <td key={i} className="p-4 text-right text-emerald-600">R$ {p.mcValue.toFixed(2)}</td>)}
              </tr>
              <tr className="bg-emerald-50/50 italic text-[10px]">
                <td className="p-2 pl-4 text-emerald-500 sticky left-0 bg-emerald-50/50 border-r border-slate-200">(%) Margem de contribuição</td>
                {reportData.profitComposition.map((p: any, i: number) => <td key={i} className="p-2 text-right text-emerald-500">{p.mcPct.toFixed(1)}%</td>)}
              </tr>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-400">
                <td colSpan={reportData.profitComposition.length + 1} className="p-2 pl-4 uppercase tracking-widest border-y border-slate-100">(–) Custos e Despesas Fixas (Rateio)</td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors text-xs">
                <td className="p-4 font-medium text-slate-500 sticky left-0 bg-white border-r border-slate-200 pl-8">Fixos Mensais + Depreciação</td>
                {reportData.profitComposition.map((p: any, i: number) => <td key={i} className="p-4 text-right text-slate-400">R$ {p.fixed.toFixed(2)}</td>)}
              </tr>
              <tr className="bg-pink-50 font-bold text-lg">
                <td className="p-4 text-pink-700 sticky left-0 bg-pink-50 border-r border-slate-200">(=) Lucro</td>
                {reportData.profitComposition.map((p: any, i: number) => (
                  <td key={i} className={`p-4 text-right ${p.profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    R$ {p.profit.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr className="bg-pink-50/50 italic text-[11px] font-bold">
                <td className="p-2 pl-4 text-pink-400 sticky left-0 bg-pink-50/50 border-r border-slate-200">(%) Lucro</td>
                {reportData.profitComposition.map((p: any, i: number) => (
                  <td key={i} className={`p-2 text-right ${p.profitPct >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                    {p.profitPct.toFixed(1)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
           <h3 className="text-lg font-bold text-slate-800 mb-8">Vendas por Produto (Top 5)</h3>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.salesByCategory.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {reportData.salesByCategory.slice(0, 5).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-900 p-12 rounded-3xl text-white relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
               <h3 className="text-3xl font-brand font-bold mb-4">Gerar PDF Estratégico</h3>
               <p className="text-slate-400 leading-relaxed mb-6">Exporte sua composição de lucro e ficha técnica para análise externa ou prestação de contas.</p>
               <button onClick={() => window.print()} className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all shadow-xl shadow-pink-500/20 flex items-center gap-2 w-fit">
                  <i className="fa-solid fa-file-pdf"></i>
                  Imprimir Relatório
               </button>
            </div>
            <div className="absolute top-0 right-0 p-10 opacity-10">
                <i className="fa-solid fa-chart-line text-[10rem]"></i>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
