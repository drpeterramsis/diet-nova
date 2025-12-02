
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { encyclopediaData, EncyclopediaItem } from '../../data/encyclopediaData';
import { drugsData, DrugItem } from '../../data/drugsData';

type Sector = 'menu' | 'nutrients' | 'drugs';

const Encyclopedia: React.FC = () => {
  const { t, isRTL, lang } = useLanguage();
  
  // Navigation State
  const [currentSector, setCurrentSector] = useState<Sector>('menu');

  // Logic for Vitamins & Minerals Sector
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Vitamin' | 'Mineral'>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('chart');
  
  // Logic for Drugs Sector
  const [drugSearchQuery, setDrugSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    let items = encyclopediaData;
    
    // Filter by Category
    if (activeFilter !== 'All') {
      items = items.filter(item => item.category === activeFilter);
    }

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.function.toLowerCase().includes(q) || 
        item.sources.toLowerCase().includes(q) ||
        item.deficiency.toLowerCase().includes(q)
      );
    }

    return items;
  }, [searchQuery, activeFilter, lang]);

  const filteredDrugs = useMemo(() => {
      if (!drugSearchQuery) return drugsData;
      const q = drugSearchQuery.toLowerCase();
      return drugsData.filter(d => 
          d.category.toLowerCase().includes(q) ||
          d.mechanism.toLowerCase().includes(q) ||
          d.examples.toLowerCase().includes(q)
      );
  }, [drugSearchQuery]);

  // --- SECTOR MENU VIEW ---
  if (currentSector === 'menu') {
      return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-8 pb-12">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-bold text-[var(--color-heading)]">{t.tools.encyclopedia.title}</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Select a knowledge sector to explore detailed nutritional information and charts.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. Vitamins & Minerals Chart Card */}
                <div 
                    onClick={() => setCurrentSector('nutrients')}
                    className="card bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 p-6 flex flex-col items-center text-center border-t-4 border-t-blue-500"
                >
                    <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:bg-blue-100 transition">
                        💊
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Vitamins & Minerals</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Comprehensive chart of micronutrients, their functions, deficiency symptoms, and food sources.
                    </p>
                    <button className="mt-auto text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition w-full">
                        View Chart & Cards
                    </button>
                </div>

                {/* 2. Drugs & Weight Card */}
                <div 
                    onClick={() => setCurrentSector('drugs')}
                    className="card bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 p-6 flex flex-col items-center text-center border-t-4 border-t-red-500"
                >
                    <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:bg-red-100 transition">
                        💊
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Drugs & Weight</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Reference guide for medications that affect body weight, including mechanisms and examples.
                    </p>
                    <button className="mt-auto text-red-600 font-bold text-sm bg-red-50 px-4 py-2 rounded-lg group-hover:bg-red-600 group-hover:text-white transition w-full">
                        View Table
                    </button>
                </div>

                {/* Placeholder: Herbs (Future) */}
                <div className="card bg-gray-50 border-dashed border-2 border-gray-200 p-6 flex flex-col items-center text-center opacity-70">
                    <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-3xl mb-4 text-gray-400">
                        🌿
                    </div>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">Herbs & Botanicals</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Scientific guide to herbal supplements and therapeutic uses.
                    </p>
                    <span className="mt-auto text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        Coming Soon
                    </span>
                </div>
            </div>
        </div>
      );
  }

  // --- DRUGS SECTOR VIEW ---
  if (currentSector === 'drugs') {
      return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <button 
                    onClick={() => setCurrentSector('menu')}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium self-start md:self-auto"
                >
                    <span>←</span> Back to Sectors
                </button>
                <div className="text-center md:text-right">
                    <h2 className="text-2xl font-bold text-gray-800">Drugs Can Affect Weight</h2>
                    <p className="text-sm text-gray-500">Mechanisms and Examples</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative w-full max-w-lg mx-auto">
                    <input
                        type="text"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                        placeholder="Search drugs, mechanisms..."
                        value={drugSearchQuery}
                        onChange={(e) => setDrugSearchQuery(e.target.value)}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'left-3' : 'right-3'}`}>🔍</span>
                </div>
            </div>

            {/* Table View */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-red-50 text-gray-700 uppercase text-xs">
                            <tr>
                                <th className="p-4 border-b w-16 text-center">Group</th>
                                <th className="p-4 border-b w-1/5">Drug Category</th>
                                <th className="p-4 border-b w-1/3">Mechanism of Action</th>
                                <th className="p-4 border-b w-1/6">Notes</th>
                                <th className="p-4 border-b w-1/4">Examples</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredDrugs.map((item) => (
                                <tr key={item.id} className="hover:bg-red-50/30 transition">
                                    <td className="p-4 text-center font-bold text-gray-400 align-top">
                                        <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${
                                            item.group === 'A' ? 'bg-blue-400' :
                                            item.group === 'B' ? 'bg-green-400' :
                                            item.group === 'C' ? 'bg-red-400' :
                                            'bg-purple-400'
                                        }`}>
                                            {item.group}
                                        </span>
                                    </td>
                                    <td className="p-4 align-top font-bold text-gray-800">
                                        {item.category}
                                    </td>
                                    <td className="p-4 text-gray-700 align-top leading-relaxed whitespace-pre-line">
                                        {item.mechanism}
                                    </td>
                                    <td className="p-4 text-gray-600 align-top text-xs leading-relaxed">
                                        {item.notes ? (
                                            <div className="bg-yellow-50 border border-yellow-100 p-2 rounded text-yellow-800">
                                                {item.notes}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 text-gray-700 align-top leading-relaxed whitespace-pre-line font-mono text-xs">
                                        {item.examples}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {filteredDrugs.length === 0 && (
                <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    <span className="text-4xl block mb-2">💊</span>
                    No drugs found matching your search.
                </div>
            )}
        </div>
      );
  }

  // --- VITAMINS & MINERALS SECTOR VIEW ---
  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-8 pb-12">
      {/* Sector Header & Back Button */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
           <button 
              onClick={() => setCurrentSector('menu')}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium self-start md:self-auto"
           >
               <span>←</span> Back to Sectors
           </button>
           <h2 className="text-2xl font-bold text-gray-800">Vitamins & Minerals Guide</h2>
      </div>

      {/* Controls */}
      <div className="text-center space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-grow w-full md:w-auto max-w-lg">
                <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none text-sm"
                    placeholder={t.encyclopedia.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    dir={isRTL ? 'rtl' : 'ltr'}
                />
                <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'left-3' : 'right-3'}`}>🔍</span>
            </div>
            
            {/* View Toggles */}
            <div className="flex gap-4 items-center flex-wrap justify-center">
                {/* Type Filter */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['All', 'Vitamin', 'Mineral'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${activeFilter === filter ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {filter === 'All' ? t.encyclopedia.filterAll : filter === 'Vitamin' ? t.encyclopedia.filterVitamins : t.encyclopedia.filterMinerals}
                        </button>
                    ))}
                </div>

                {/* Display Mode */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('chart')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'chart' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        📊 Chart View
                    </button>
                    <button 
                        onClick={() => setViewMode('cards')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'cards' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        🃏 Card View
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* CHART VIEW (Table) */}
      {viewMode === 'chart' && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                          <tr>
                              <th className="p-4 border-b w-1/5 bg-gray-50 sticky left-0 z-10">{lang === 'ar' ? 'المغذيات' : 'Nutrient'}</th>
                              <th className="p-4 border-b w-1/4">{t.encyclopedia.function}</th>
                              <th className="p-4 border-b w-1/4">{t.encyclopedia.sources}</th>
                              <th className="p-4 border-b w-1/4">{t.encyclopedia.deficiency}</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                          {filteredItems.map((item) => (
                              <tr key={item.id} className="hover:bg-blue-50/30 transition">
                                  <td className="p-4 align-top font-medium bg-white sticky left-0 border-r border-gray-50 group-hover:bg-blue-50/10">
                                      <div className="text-[var(--color-primary-dark)] text-base">{item.name}</div>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${item.category === 'Vitamin' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                          {item.category}
                                      </span>
                                  </td>
                                  <td className="p-4 text-gray-700 align-top leading-relaxed whitespace-pre-line">{item.function}</td>
                                  <td className="p-4 text-gray-700 align-top leading-relaxed whitespace-pre-line">{item.sources}</td>
                                  <td className="p-4 text-red-600 align-top leading-relaxed whitespace-pre-line">{item.deficiency}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* CARD GRID VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition duration-300 flex flex-col">
                    {/* Card Header */}
                    <div className={`p-4 border-b border-gray-100 flex justify-between items-start ${item.category === 'Vitamin' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                        <h3 className={`font-bold text-xl ${item.category === 'Vitamin' ? 'text-orange-700' : 'text-blue-700'}`}>
                            {item.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${item.category === 'Vitamin' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}>
                            {item.category}
                        </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4 flex-grow text-sm">
                        <div>
                            <h4 className="font-bold text-gray-700 flex items-center gap-2 mb-1">
                                <span className="text-lg">⚡</span> {t.encyclopedia.function}
                            </h4>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.function}</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-gray-700 flex items-center gap-2 mb-1">
                                <span className="text-lg">🥗</span> {t.encyclopedia.sources}
                            </h4>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.sources}</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-red-700 flex items-center gap-2 mb-1">
                                <span className="text-lg">⚠️</span> {t.encyclopedia.deficiency}
                            </h4>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.deficiency}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {filteredItems.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
              <span className="text-4xl block mb-2">📚</span>
              No items found matching your search.
          </div>
      )}
    </div>
  );
};

export default Encyclopedia;
