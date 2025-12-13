
import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { encyclopediaData, miscTopicsData, EncyclopediaItem, MiscTopicItem } from '../../data/encyclopediaData';
import { drugsData, DrugItem } from '../../data/drugsData';
import LabReference from './LabReference';

type Sector = 'menu' | 'nutrients' | 'definitions' | 'drugs' | 'labs' | 'misc';

const Encyclopedia: React.FC = () => {
  const { t, isRTL, lang } = useLanguage();
  
  // Navigation State
  const [currentSector, setCurrentSector] = useState<Sector>('menu');

  // Logic for Vitamins & Minerals & Definitions
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Vitamin' | 'Mineral'>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('cards'); 
  
  // Logic for Drugs Sector
  const [drugSearchQuery, setDrugSearchQuery] = useState('');

  // Logic for Misc Topics
  const [miscSearchQuery, setMiscSearchQuery] = useState('');
  const [miscCategoryFilter, setMiscCategoryFilter] = useState<string>('All');

  // Extract Unique Misc Categories
  const miscCategories = useMemo(() => {
      const cats = new Set(miscTopicsData.map(t => t.category));
      return ['All', ...Array.from(cats)];
  }, []);

  const filteredNutrients = useMemo(() => {
    let items = encyclopediaData.filter(i => i.category === 'Vitamin' || i.category === 'Mineral');
    
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

  const filteredDefinitions = useMemo(() => {
      let items = encyclopediaData.filter(i => i.category === 'Definition');
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          items = items.filter(item => 
            item.name.toLowerCase().includes(q) || 
            item.function.toLowerCase().includes(q)
          );
      }
      return items;
  }, [searchQuery]);

  const filteredDrugs = useMemo(() => {
      if (!drugSearchQuery) return drugsData;
      const q = drugSearchQuery.toLowerCase();
      return drugsData.filter(d => 
          d.category.toLowerCase().includes(q) ||
          d.mechanism.toLowerCase().includes(q) ||
          d.examples.toLowerCase().includes(q)
      );
  }, [drugSearchQuery]);

  const filteredMiscTopics = useMemo(() => {
      let items = miscTopicsData;
      
      if (miscCategoryFilter !== 'All') {
          items = items.filter(t => t.category === miscCategoryFilter);
      }

      if (miscSearchQuery) {
          const q = miscSearchQuery.toLowerCase();
          items = items.filter(t => 
              t.title.toLowerCase().includes(q) || 
              t.content.toLowerCase().includes(q) ||
              t.category.toLowerCase().includes(q)
          );
      }
      return items;
  }, [miscSearchQuery, miscCategoryFilter]);

  // Group Drugs for Visual Grid
  const groupedDrugs = useMemo(() => {
      const groups: Record<string, DrugItem[]> = {
          A: [], B: [], C: [], D: []
      };
      filteredDrugs.forEach(d => {
          if (groups[d.group]) groups[d.group].push(d);
      });
      return groups;
  }, [filteredDrugs]);

  // Helper to format text with colors for arrows and numbers
  const renderFormattedText = (text: string) => {
      const lines = text.split('\n');
      return lines.map((line, idx) => {
          // 1. Split by arrows to color them
          // 2. Handle bold **text** within parts
          // 3. Highlight numbers/units
          const arrowParts = line.split(/([↑↓→])/g);
          
          return (
              <div key={idx} className="mb-1 last:mb-0">
                  {arrowParts.map((part, pIdx) => {
                      if (part === '↑') return <span key={pIdx} className="text-green-600 font-extrabold text-lg mx-0.5">↑</span>;
                      if (part === '↓') return <span key={pIdx} className="text-red-600 font-extrabold text-lg mx-0.5">↓</span>;
                      if (part === '→') return <span key={pIdx} className="text-gray-400 font-bold mx-1">→</span>;
                      
                      // Handle Bold Markdown **text**
                      const boldParts = part.split(/(\*\*.*?\*\*)/g);
                      return (
                          <span key={pIdx}>
                              {boldParts.map((bp, bIdx) => {
                                  if (bp.startsWith('**') && bp.endsWith('**')) {
                                      // Inside bold part (Markdown)
                                      const content = bp.slice(2, -2);
                                      // Also highlight numbers within bold
                                      const numParts = content.split(/(\d+(?:\.\d+)?(?:%|g|mg|kcal|kg|cm|ml|L|\s?g\/d|\s?g\/kg)?)/g);
                                      return (
                                          <strong key={bIdx} className="text-gray-900 font-extrabold">
                                              {numParts.map((np, nIdx) => {
                                                  if (/^\d/.test(np)) return <span key={nIdx} className="text-blue-700">{np}</span>;
                                                  return np;
                                              })}
                                          </strong>
                                      );
                                  }
                                  
                                  // Regular text - highlight numbers
                                  const numParts = bp.split(/(\d+(?:\.\d+)?(?:%|g|mg|kcal|kg|cm|ml|L|\s?g\/d|\s?g\/kg)?)/g);
                                  return (
                                      <span key={bIdx}>
                                          {numParts.map((np, nIdx) => {
                                              // Detect numbers starting with digit
                                              if (/^\d/.test(np)) return <span key={nIdx} className="text-blue-600 font-bold">{np}</span>;
                                              return np;
                                          })}
                                      </span>
                                  );
                              })}
                          </span>
                      );
                  })}
              </div>
          );
      });
  };

  // --- SECTOR MENU VIEW ---
  if (currentSector === 'menu') {
      return (
        <div className="max-w-7xl mx-auto animate-fade-in space-y-8 pb-12">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-bold text-[var(--color-heading)]">{t.tools.encyclopedia.title}</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Select a knowledge sector to explore detailed nutritional information, charts, and guides.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* 1. Vitamins & Minerals */}
                <div 
                    onClick={() => { setCurrentSector('nutrients'); setActiveFilter('All'); setSearchQuery(''); }}
                    className="card bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 p-6 flex flex-col items-center text-center border-t-4 border-t-orange-500"
                >
                    <div className="h-14 w-14 bg-orange-50 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:bg-orange-100 transition">
                        💊
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Vitamins & Minerals</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                        Comprehensive chart of essential vitamins and minerals.
                    </p>
                    <button className="mt-auto text-orange-600 font-bold text-xs bg-orange-50 px-3 py-1.5 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition w-full">
                        Explore
                    </button>
                </div>

                {/* 2. Definitions */}
                <div 
                    onClick={() => { setCurrentSector('definitions'); setSearchQuery(''); }}
                    className="card bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 p-6 flex flex-col items-center text-center border-t-4 border-t-purple-500"
                >
                    <div className="h-14 w-14 bg-purple-50 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:bg-purple-100 transition">
                        📖
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Nutritional Definitions</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                        Key terms: BMR, TEE, RDA, DRI, and standards.
                    </p>
                    <button className="mt-auto text-purple-600 font-bold text-xs bg-purple-50 px-3 py-1.5 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition w-full">
                        View Terms
                    </button>
                </div>

                {/* 3. Biochemical Labs */}
                <div 
                    onClick={() => setCurrentSector('labs')}
                    className="card bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 p-6 flex flex-col items-center text-center border-t-4 border-t-green-500"
                >
                    <div className="h-14 w-14 bg-green-50 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:bg-green-100 transition">
                        🧬
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{t.tools.labs.title}</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                        Reference ranges for blood tests, electrolytes, lipids.
                    </p>
                    <button className="mt-auto text-green-600 font-bold text-xs bg-green-50 px-3 py-1.5 rounded-lg group-hover:bg-green-600 group-hover:text-white transition w-full">
                        View Labs
                    </button>
                </div>

                {/* 4. Drugs & Weight */}
                <div 
                    onClick={() => setCurrentSector('drugs')}
                    className="card bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 p-6 flex flex-col items-center text-center border-t-4 border-t-red-500"
                >
                    <div className="h-14 w-14 bg-red-50 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:bg-red-100 transition">
                        🧪
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Drugs & Weight</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                        Medications affecting weight, mechanisms and examples.
                    </p>
                    <button className="mt-auto text-red-600 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-lg group-hover:bg-red-600 group-hover:text-white transition w-full">
                        View Map
                    </button>
                </div>

                {/* 5. Misc Topics (NEW) */}
                <div 
                    onClick={() => { setCurrentSector('misc'); setMiscSearchQuery(''); setMiscCategoryFilter('All'); }}
                    className="card bg-white hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 p-6 flex flex-col items-center text-center border-t-4 border-t-blue-500"
                >
                    <div className="h-14 w-14 bg-blue-50 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:bg-blue-100 transition">
                        📚
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Misc Topics</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                        Obesity, Body Types, Counseling plans, etc.
                    </p>
                    <button className="mt-auto text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition w-full">
                        Browse Topics
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- LABS SECTOR VIEW ---
  if (currentSector === 'labs') {
      return (
          <div className="animate-fade-in">
              <div className="mb-4">
                <button 
                    onClick={() => setCurrentSector('menu')}
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium"
                >
                    <span>←</span> Back to Sectors
                </button>
              </div>
              <LabReference />
          </div>
      );
  }

  // --- DRUGS SECTOR VIEW (VISUAL GRID) ---
  if (currentSector === 'drugs') {
      const groupInfo = {
          A: { title: 'Psychotropic & Neuro', color: 'indigo', desc: 'Antidepressants, Antipsychotics, etc.' },
          B: { title: 'Blockers & Others', color: 'teal', desc: 'Beta-blockers, Cancer meds' },
          C: { title: 'Hormonal Agents', color: 'rose', desc: 'Corticosteroids, Contraceptives' },
          D: { title: 'Diabetic Agents', color: 'amber', desc: 'Insulin, Oral Hypoglycemics' },
      };

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
                    <h2 className="text-2xl font-bold text-gray-800">Drugs Affecting Weight</h2>
                    <p className="text-sm text-gray-500">Visual Mechanism Map</p>
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

            {/* Visual Grid Layout (Mind Map Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['A', 'B', 'C', 'D'].map((groupKey) => {
                    const info = groupInfo[groupKey as keyof typeof groupInfo];
                    const items = groupedDrugs[groupKey];
                    
                    if (items.length === 0) return null;

                    // Dynamic styles based on group color
                    const borderColor = `border-${info.color}-200`;
                    const bgColor = `bg-${info.color}-50`;
                    const textColor = `text-${info.color}-800`;

                    return (
                        <div key={groupKey} className={`rounded-2xl border-2 ${borderColor} ${bgColor} p-4 md:p-6 shadow-sm flex flex-col gap-4`}>
                            <div className="flex items-center gap-3 border-b border-black/10 pb-3 mb-1">
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl bg-white shadow-sm ${textColor}`}>
                                    {groupKey}
                                </span>
                                <div>
                                    <h3 className={`font-bold text-lg ${textColor}`}>{info.title}</h3>
                                    <p className="text-xs opacity-70 font-medium">{info.desc}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-transparent hover:border-gray-200 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{item.icon}</span>
                                                <h4 className="font-bold text-gray-800">{item.category}</h4>
                                            </div>
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 mb-3 pl-1 border-l-2 border-gray-100 leading-relaxed">
                                            {renderFormattedText(item.mechanism)}
                                        </div>

                                        {item.notes && (
                                            <div className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded mb-3 border border-yellow-100">
                                                <strong>Note:</strong> {item.notes}
                                            </div>
                                        )}

                                        {item.examples && (
                                            <div className="bg-gray-50 rounded-lg p-2.5 text-xs text-gray-500 font-mono">
                                                <div className="uppercase text-[10px] font-bold text-gray-400 mb-1">Examples</div>
                                                {item.examples.split('\n').map((ex, i) => <div key={i}>{ex}</div>)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
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

  // --- MISC TOPICS VIEW ---
  if (currentSector === 'misc') {
      return (
          <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                  <button 
                      onClick={() => setCurrentSector('menu')}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium self-start md:self-auto"
                  >
                      <span>←</span> Back to Sectors
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800">Miscellaneous Topics</h2>
              </div>

              {/* Tag Filters */}
              <div className="flex flex-wrap gap-2 justify-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  {miscCategories.map(cat => (
                      <button
                          key={cat}
                          onClick={() => setMiscCategoryFilter(cat)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${
                              miscCategoryFilter === cat 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>

              {/* Search */}
              <div className="relative w-full max-w-lg mx-auto">
                  <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-white shadow-sm"
                      placeholder="Search topics (Obesity, Fat types, Counseling...)"
                      value={miscSearchQuery}
                      onChange={(e) => setMiscSearchQuery(e.target.value)}
                      dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'left-3' : 'right-3'}`}>🔍</span>
              </div>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredMiscTopics.map(topic => (
                      <div key={topic.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition">
                          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                              <h3 className="font-bold text-lg text-blue-900">{topic.title}</h3>
                              <span className="text-[10px] bg-white text-blue-600 px-2 py-1 rounded-full border border-blue-200 font-bold uppercase tracking-wider">{topic.category}</span>
                          </div>
                          <div className="p-6 text-sm text-gray-700 leading-loose whitespace-pre-wrap">
                              {renderFormattedText(topic.content)}
                          </div>
                      </div>
                  ))}
                  {filteredMiscTopics.length === 0 && (
                      <div className="col-span-full text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                          <span className="text-4xl block mb-2">📚</span>
                          No topics found.
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // --- DEFINITIONS VIEW ---
  if (currentSector === 'definitions') {
      return (
          <div className="max-w-6xl mx-auto animate-fade-in space-y-8 pb-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                  <button 
                      onClick={() => setCurrentSector('menu')}
                      className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium self-start md:self-auto"
                  >
                      <span>←</span> Back to Sectors
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800">Nutritional Definitions</h2>
              </div>

              {/* Search */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                  <div className="relative w-full max-w-lg mx-auto">
                      <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                          placeholder="Search terms (BMR, RDA, etc...)"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          dir={isRTL ? 'rtl' : 'ltr'}
                      />
                      <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'left-3' : 'right-3'}`}>🔍</span>
                  </div>
              </div>

              {/* Definitions Table */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-purple-50 text-purple-900 uppercase text-xs font-bold">
                              <tr>
                                  <th className="p-4 border-b border-purple-100 w-1/4">Term</th>
                                  <th className="p-4 border-b border-purple-100 w-3/4">Definition</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                              {filteredDefinitions.map((item) => (
                                  <tr key={item.id} className="hover:bg-purple-50/30 transition">
                                      <td className="p-4 align-top font-bold text-purple-700 bg-white sticky left-0 border-r border-gray-50">
                                          {item.name}
                                      </td>
                                      <td className="p-4 text-gray-700 align-top leading-relaxed whitespace-pre-line">
                                          {renderFormattedText(item.function)}
                                      </td>
                                  </tr>
                              ))}
                              {filteredDefinitions.length === 0 && (
                                  <tr>
                                      <td colSpan={2} className="p-8 text-center text-gray-400">
                                          No definitions found matching "{searchQuery}"
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
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
           <h2 className="text-2xl font-bold text-gray-800">Nutrients Guide</h2>
      </div>

      {/* Controls */}
      <div className="text-center space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-grow w-full md:w-auto max-w-lg">
                <input
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
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
                <div className="flex bg-gray-100 p-1 rounded-lg flex-wrap justify-center gap-1">
                    {(['All', 'Vitamin', 'Mineral'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${activeFilter === filter ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {filter === 'All' ? t.encyclopedia.filterAll : 
                             filter === 'Vitamin' ? t.encyclopedia.filterVitamins : 
                             t.encyclopedia.filterMinerals}
                        </button>
                    ))}
                </div>

                {/* Display Mode */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('chart')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'chart' ? 'bg-white shadow-sm text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        📊 Chart
                    </button>
                    <button 
                        onClick={() => setViewMode('cards')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${viewMode === 'cards' ? 'bg-white shadow-sm text-orange-700' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        🃏 Cards
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
                          {filteredNutrients.map((item) => (
                              <tr key={item.id} className="hover:bg-orange-50/30 transition">
                                  <td className="p-4 align-top font-medium bg-white sticky left-0 border-r border-gray-50 group-hover:bg-orange-50/10">
                                      <div className="text-orange-900 text-base">{item.name}</div>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${
                                          item.category === 'Vitamin' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                      }`}>
                                          {item.category}
                                      </span>
                                  </td>
                                  <td className="p-4 text-gray-700 align-top leading-relaxed whitespace-pre-line">{renderFormattedText(item.function)}</td>
                                  <td className="p-4 text-gray-700 align-top leading-relaxed whitespace-pre-line">{renderFormattedText(item.sources)}</td>
                                  <td className="p-4 text-red-600 align-top leading-relaxed whitespace-pre-line">{renderFormattedText(item.deficiency)}</td>
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
            {filteredNutrients.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition duration-300 flex flex-col">
                    {/* Card Header */}
                    <div className={`p-4 border-b border-gray-100 flex justify-between items-start ${
                        item.category === 'Vitamin' ? 'bg-orange-50' : 'bg-blue-50'
                    }`}>
                        <h3 className={`font-bold text-xl ${
                            item.category === 'Vitamin' ? 'text-orange-700' : 'text-blue-700'
                        }`}>
                            {item.name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${
                            item.category === 'Vitamin' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'
                        }`}>
                            {item.category}
                        </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-4 flex-grow text-sm">
                        <div>
                            <h4 className="font-bold text-gray-700 flex items-center gap-2 mb-1">
                                <span className="text-lg">⚡</span> {t.encyclopedia.function}
                            </h4>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{renderFormattedText(item.function)}</p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-gray-700 flex items-center gap-2 mb-1">
                                <span className="text-lg">🥗</span> {t.encyclopedia.sources}
                            </h4>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{renderFormattedText(item.sources)}</p>
                        </div>

                        <div>
                            <h4 className="font-bold text-red-700 flex items-center gap-2 mb-1">
                                <span className="text-lg">⚠️</span> {t.encyclopedia.deficiency}
                            </h4>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{renderFormattedText(item.deficiency)}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      )}

      {filteredNutrients.length === 0 && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
              <span className="text-4xl block mb-2">📚</span>
              No items found matching your search.
          </div>
      )}
    </div>
  );
};

export default Encyclopedia;