
import React, { useState } from 'react';
import { TabType } from './types';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import FichaTecnica from './components/FichaTecnica';
import RecipesLibrary from './components/RecipesLibrary';
import Agenda from './components/Agenda';
import Financeiro from './components/Financeiro';
import Reports from './components/Reports';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case TabType.DASHBOARD: return <Dashboard />;
      case TabType.ESTOQUE: return <Inventory />;
      case TabType.FICHA_TECNICA: return <FichaTecnica onSaved={() => setActiveTab(TabType.RECEITAS)} />;
      case TabType.RECEITAS: return <RecipesLibrary onEdit={(id) => setActiveTab(TabType.FICHA_TECNICA)} />;
      case TabType.AGENDA: return <Agenda />;
      case TabType.FINANCEIRO: return <Financeiro />;
      case TabType.RELATORIOS: return <Reports />;
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { type: TabType.DASHBOARD, label: 'Dashboard', icon: 'fa-chart-pie' },
    { type: TabType.ESTOQUE, label: 'Estoque', icon: 'fa-box-open' },
    { type: TabType.FICHA_TECNICA, label: 'Ficha Técnica', icon: 'fa-file-invoice-dollar' },
    { type: TabType.RECEITAS, label: 'Receitas', icon: 'fa-utensils' },
    { type: TabType.AGENDA, label: 'Agenda', icon: 'fa-calendar-alt' },
    { type: TabType.FINANCEIRO, label: 'Financeiro', icon: 'fa-sack-dollar' },
    { type: TabType.RELATORIOS, label: 'Relatórios', icon: 'fa-chart-line' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50 fixed h-full lg:relative`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white shrink-0">
              <i className="fa-solid fa-cookie-bite"></i>
            </div>
            {sidebarOpen && <span className="font-brand text-xl font-bold text-pink-600 truncate">PrecificArte</span>}
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.type}
              onClick={() => setActiveTab(item.type)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                activeTab === item.type 
                  ? 'bg-pink-50 text-pink-600 shadow-sm ring-1 ring-pink-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
              {sidebarOpen && <span className="font-medium text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full p-2 text-slate-400 hover:text-slate-600 flex justify-center">
             <i className={`fa-solid ${sidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800">{navItems.find(i => i.type === activeTab)?.label}</h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-pink-500 text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">Versão 5.1 Pro</span>
            <img src="https://picsum.photos/40/40" alt="User" className="w-10 h-10 rounded-full border border-pink-100" />
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
