import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { encyclopediaData, EncyclopediaItem } from '../../data/encyclopediaData';

const Encyclopedia: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Vitamin' | 'Mineral'>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards');

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
  }, [searchQuery, activeFilter]);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-8">
      {/* Header & Controls */}
      <div className="text-center space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-2">{t.tools.encyclopedia.title}</h1>
            <p className="text-gray-600 max-w-2xl mx-auto">{t.tools.encyclopedia.desc}</p>
        </div>

        <div className="flex justify-center mb-6">
             <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                 <button 
                    onClick={() => setViewMode('cards')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'cards' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                 >
                     Grid View
                 </button>
                 <button 
                    onClick={() => setViewMode('chart')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'chart' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                 >
                     Reference Chart
                 </button>
             </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-center max-w-3xl mx-auto">
            <div className="relative flex-grow w-full md:w-auto">
                <input
                    type="text"
                    className="w-full px-6 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none shadow-sm text-lg"
                    placeholder={t.encyclopedia.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    dir={isRTL ? 'rtl' : 'ltr'}
                />
                <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 text-lg ${isRTL ? 'left-4' : 'right-4'}`}>🔍</span>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-full flex-shrink-0">
                {(['All', 'Vitamin', 'Mineral'] as const).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-5 py-2 rounded-full text-sm font-bold transition ${activeFilter === filter ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        {filter === 'All' ? t.encyclopedia.filterAll : filter === 'Vitamin' ? t.encyclopedia.filterVitamins : t.encyclopedia.filterMinerals}
                    </button>
                ))}
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
                              <th className="p-4 border-b w-1/5">Nutrient</th>
                              <th className="p-4 border-b w-1/4">Function</th>
                              <th className="p-4 border-b w-1/4">Food Sources</th>
                              <th className="p-4 border-b w-1/4">Deficiency</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {filteredItems.map((item) => (
                              <tr key={item.id} className="hover:bg-blue-50/30 transition">
                                  <td className="p-4 align-top">
                                      <div className="font-bold text-[var(--color-primary-dark)] text-base">{item.name}</div>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${item.category === 'Vitamin' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                                          {item.category}
                                      </span>
                                  </td>
                                  <td className="p-4 text-sm text-gray-700 align-top">{item.function}</td>
                                  <td className="p-4 text-sm text-gray-700 align-top">{item.sources}</td>
                                  <td className="p-4 text-sm text-red-600 align-top">{item.deficiency}</td>
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
            {/* Quick Access Card for Chart */}
            <div 
                onClick={() => setViewMode('chart')}
                className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 cursor-pointer p-6 flex flex-col justify-center items-center text-white text-center border border-blue-900"
            >
                <div className="text-5xl mb-4 bg-white/20 p-3 rounded-full">📊</div>
                <h3 className="font-bold text-xl mb-2">Reference Chart</h3>
                <p className="text-sm opacity-90">View full table of vitamins & minerals</p>
            </div>

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
                            <p className="text-gray-600 leading-relaxed">{item.function}</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-gray-700 flex items-center gap-2 mb-1">
                                <span className="text-lg">🥗</span> {t.encyclopedia.sources}
                            </h4>
                            <p className="text-gray-600 leading-relaxed">{item.sources}</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-red-700 flex items-center gap-2 mb-1">
                                <span className="text-lg">⚠️</span> {t.encyclopedia.deficiency}
                            </h4>
                            <p className="text-gray-600 leading-relaxed">{item.deficiency}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {filteredItems.length === 0 && (
          <div className="text-center py-20 text-gray-400">
              <span className="text-4xl block mb-2">📚</span>
              No items found matching your search.
          </div>
      )}
    </div>
  );
};

export default Encyclopedia;