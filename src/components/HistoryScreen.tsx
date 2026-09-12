import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Search, FileSpreadsheet, Trash2, Calendar, 
  User, Weight, Sparkles, Filter, X, ZoomIn, Eye 
} from 'lucide-react';

interface HistoryScreenProps {
  items: InventoryItem[];
  onDelete: (id: string) => void;
  onNavigateBack: () => void;
  onExport: () => void;
}

export default function HistoryScreen({
  items,
  onDelete,
  onNavigateBack,
  onExport
}: HistoryScreenProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const categories = ['all', 'أساور', 'حلق', 'أخراص', 'سلسال صدر', 'أخرى'];

  // Filter items based on search and category
  const filteredItems = items.filter(item => {
    const matchesSearch = item.serialNumber.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || item.productType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (catName: string) => {
    switch (catName) {
      case 'أساور': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'حلق': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'أخراص': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'سلسال صدر': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    }
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      onDelete(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div id="history_container" className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col pb-12 relative">
      {/* Header */}
      <header className="px-4 py-4 border-b border-slate-800/80 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors text-sm font-semibold cursor-pointer"
          >
            <ArrowRight size={16} />
            <span>العودة للرئيسية</span>
          </button>
          <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
            <Sparkles size={14} />
            <span>سجل جرد القطع الكامل</span>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 mt-6">
        
        {/* Filters and Search Bar Section */}
        <div className="bg-[#111827] border border-slate-800/80 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.replace(/\D/g, ''))}
              placeholder="البحث بالرقم التسلسلي..."
              className="w-full pr-10 pl-4 py-2.5 bg-[#1e293b]/50 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm font-semibold text-slate-200 placeholder:text-slate-500 focus:outline-none font-mono"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={16} />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none pr-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-amber-500 border-amber-500 text-[#0b0f19] shadow-md shadow-amber-500/10'
                    : 'bg-[#1e293b]/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'كافة القطع' : cat}
              </button>
            ))}
          </div>

          {/* Excel Export Button */}
          <button
            onClick={onExport}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-[#0b0f19] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <FileSpreadsheet size={14} />
            <span>تصدير Excel الحالي</span>
          </button>
        </div>

        {/* Inventory Records List / Table */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="text-center py-24 text-slate-500">
              <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                <Filter size={24} />
              </div>
              <h4 className="font-bold text-slate-300">لم يتم العثور على قطع تطابق البحث</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                تأكد من كتابة الرقم التسلسلي بشكل صحيح، أو أزل تصفية الفئات للمحاولة مجدداً.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#161f30]/80 border-b border-slate-800/80 text-slate-400 text-xs font-extrabold uppercase">
                    <th className="px-6 py-4 w-12 text-center">ت</th>
                    <th className="px-6 py-4">صورة البطاقة</th>
                    <th className="px-6 py-4">الرقم التسلسلي</th>
                    <th className="px-6 py-4">فئة المنتج</th>
                    <th className="px-6 py-4">الوزن</th>
                    <th className="px-6 py-4">تاريخ الجرد</th>
                    <th className="px-6 py-4">اسم الموظف</th>
                    <th className="px-6 py-4 w-12 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredItems.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-[#161f30]/30 transition-colors"
                    >
                      {/* Counter */}
                      <td className="px-6 py-4 text-center text-xs font-semibold text-slate-500 font-mono">
                        {index + 1}
                      </td>

                      {/* Image Thumbnail */}
                      <td className="px-6 py-4">
                        {item.photoUrl ? (
                          <div 
                            onClick={() => setViewingImage(item.photoUrl)}
                            className="relative w-12 h-10 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 cursor-zoom-in group shrink-0"
                            title="تكبير صورة البراكيد"
                          >
                            <img 
                              src={item.photoUrl} 
                              alt="Tag" 
                              className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-400">
                              <ZoomIn size={12} />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-10 bg-slate-800 rounded-lg border border-slate-800/80 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                            لا توجد
                          </div>
                        )}
                      </td>

                      {/* Serial Number */}
                      <td className="px-6 py-4 font-bold text-slate-200 font-mono tracking-wide">
                        {item.serialNumber}
                      </td>

                      {/* Category Pill */}
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase ${getCategoryColor(item.productType)}`}>
                          {item.productType}
                        </span>
                      </td>

                      {/* Weight */}
                      <td className="px-6 py-4 font-semibold text-slate-300 font-mono">
                        {item.weight ? (
                          <div className="flex items-center gap-1">
                            <span>{item.weight.toFixed(2)}</span>
                            <span className="text-[10px] font-sans text-slate-500">غرام</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-sans text-xs">يدوي / غير محدد</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-4 text-xs font-medium text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-500" />
                          <span>
                            {new Date(item.capturedAt).toLocaleString('ar-IQ', {
                              timeZone: 'Asia/Baghdad',
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Employee Name */}
                      <td className="px-6 py-4 font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-slate-500" />
                          <span>{item.capturedBy}</span>
                        </div>
                      </td>

                      {/* Remove/Delete Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                          title="حذف القطعة"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* --- POPUPS AND MODAL DIALOGS --- */}

      <AnimatePresence>
        {/* 1. DELETE CONFIRMATION POPUP */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-[#161f30] border border-slate-800 rounded-2xl p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Trash2 size={20} />
              </div>
              <h3 className="text-md font-bold text-slate-200">تأكيد حذف القطعة</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                هل أنت متأكد من رغبتك في إزالة القطعة ذات الرقم التسلسلي <span className="font-mono text-amber-400 font-extrabold">{itemToDelete.serialNumber}</span> من كشف الجرد؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDeleteConfirm}
                  className="w-1/2 h-10 bg-red-500 hover:bg-red-600 text-[#0b0f19] rounded-xl font-extrabold text-xs transition-colors cursor-pointer"
                >
                  نعم، احذف القطعة
                </button>
                <button
                  onClick={() => setItemToDelete(null)}
                  className="w-1/2 h-10 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  إلغاء التراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. IMAGE EXPANDED VIEW OVERLAY */}
        {viewingImage && (
          <div 
            onClick={() => setViewingImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md cursor-zoom-out"
          >
            <button 
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-white rounded-full cursor-pointer"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-800"
            >
              <img 
                src={viewingImage} 
                alt="Expanded gold card" 
                className="w-full h-auto max-h-[80vh] object-contain" 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
