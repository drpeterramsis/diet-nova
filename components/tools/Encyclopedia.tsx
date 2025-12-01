import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { encyclopediaData, EncyclopediaItem } from '../../data/encyclopediaData';
import { GoogleGenAI } from "@google/genai";

type Sector = 'menu' | 'nutrients';

const Encyclopedia: React.FC = () => {
  const { t, isRTL, lang } = useLanguage();
  
  // Navigation State
  const [currentSector, setCurrentSector] = useState<Sector>('menu');

  // Logic for Vitamins & Minerals Sector
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Vitamin' | 'Mineral'>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'chart'>('chart');

  // AI Translation State
  const [arabicData, setArabicData] = useState<EncyclopediaItem[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(false);

  // Auto Translate Effect
  useEffect(() => {
    const translateEncyclopedia = async () => {
      // Only proceed if lang is Arabic and we don't have data yet
      if (lang === 'ar' && arabicData.length === 0 && !isTranslating && !translationError) {
        
        // 1. Check Local Storage First
        const cached = localStorage.getItem('encyclopedia_ar');
        if (cached) {
            try {
                setArabicData(JSON.parse(cached));
                return;
            } catch (e) {
                console.warn("Invalid cached translation, refetching...");
            }
        }

        // 2. Translate with Gemini
        setIsTranslating(true);
        try {
            if (!process.env.API_KEY) throw new Error("API Key missing");

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                You are a professional medical translator. 
                Translate the following JSON array of nutrient information into Arabic.
                
                Rules:
                1. Preserve the JSON structure exactly (array of objects).
                2. Do NOT translate the keys: "id", "name", "category", "function", "sources", "deficiency".
                3. Keep "id" and "category" VALUES in English (e.g., "Vitamin", "Mineral").
                4. Translate the VALUES of "name", "function", "sources", "deficiency" to Arabic.
                5. Return ONLY the raw JSON string. Do not use Markdown code blocks.

                Data to translate:
                ${JSON.stringify(encyclopediaData)}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text;
            if (text) {
                // Clean markdown if present
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const translated = JSON.parse(cleanJson);
                
                if (Array.isArray(translated) && translated.length > 0) {
                    setArabicData(translated);
                    localStorage.setItem('encyclopedia_ar', JSON.stringify(translated));
                } else {
                    throw new Error("Invalid translation format");
                }
            }
        } catch (err) {
            console.error("AI Translation Error:", err);
            setTranslationError(true);
        } finally {
            setIsTranslating(false);
        }
      }
    };

    translateEncyclopedia();
  }, [lang, arabicData, isTranslating, translationError]);

  // Use localized data if available and active
  const currentData = (lang === 'ar' && arabicData.length > 0) ? arabicData : encyclopediaData;

  const filteredItems = useMemo(() => {
    let items = currentData;
    
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
  }, [searchQuery, activeFilter, currentData]);

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

                {/* Placeholder: Drug Interactions (Future) */}
                <div className="card bg-gray-50 border-dashed border-2 border-gray-200 p-6 flex flex-col items-center text-center opacity-70">
                    <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-3xl mb-4 text-gray-400">
                        ⚡
                    </div>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">Drug Interactions</h3>
                    <p className="text-sm text-gray-400 mb-4">
                        Check interactions between food, supplements, and medication.
                    </p>
                    <span className="mt-auto text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        Coming Soon
                    </span>
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
           <h2 className="text-2xl font-bold text-gray-800">Vitamins & Minerals Guide</h2>
      </div>

      {/* Loading State for Translation */}
      {isTranslating && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 p-6 rounded-xl text-center mb-6 animate-pulse">
              <span className="text-3xl block mb-2">✨</span>
              <h3 className="font-bold text-blue-800 mb-1">Translating with Gemini AI...</h3>
              <p className="text-sm text-blue-600">Please wait while we convert the medical encyclopedia to Arabic.</p>
          </div>
      )}

      {translationError && lang === 'ar' && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-center mb-6 text-sm text-orange-800">
              ⚠️ AI Translation failed. Showing English content as fallback.
          </div>
      )}

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
                                  <td className="p-4 text-gray-700 align-top leading-relaxed">{item.function}</td>
                                  <td className="p-4 text-gray-700 align-top leading-relaxed">{item.sources}</td>
                                  <td className="p-4 text-red-600 align-top leading-relaxed">{item.deficiency}</td>
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

      {filteredItems.length === 0 && !isTranslating && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
              <span className="text-4xl block mb-2">📚</span>
              No items found matching your search.
          </div>
      )}
    </div>
  );
};

export default Encyclopedia;