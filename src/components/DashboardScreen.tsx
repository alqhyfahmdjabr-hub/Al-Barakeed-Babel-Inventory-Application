import React, { useState, useEffect } from 'react';
import { User, InventoryItem } from '../types';
import { motion } from 'motion/react';
import { 
  Camera, FileSpreadsheet, History, LogOut, Sparkles, TrendingUp, 
  Weight, Calendar, Layers, CheckCircle2, ChevronRight 
} from 'lucide-react';

interface DashboardScreenProps {
  user: User;
  items: InventoryItem[];
  onLogout: () => void;
  onNavigate: (view: 'scan' | 'history') => void;
  onExport: () => void;
}

export default function DashboardScreen({ 
  user, 
  items, 
  onLogout, 
  onNavigate, 
  onExport 
}: DashboardScreenProps) {
  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute statistics
  const todayStr = new Date().toDateString();
  const itemsToday = items.filter(item => new Date(item.capturedAt).toDateString() === todayStr);
  const totalPieces = items.length;
  const piecesTodayCount = itemsToday.length;

  const totalWeight = items.reduce((acc, item) => acc + (item.weight || 0), 0);
  const todayWeight = itemsToday.reduce((acc, item) => acc + (item.weight || 0), 0);

  // Category counts
  const categories = [
    { name: 'أساور', color: 'from-amber-500 to-yellow-600', text: 'text-amber-400' },
    { name: 'حلق', color: 'from-rose-500 to-pink-600', text: 'text-rose-400' },
    { name: 'أخراص', color: 'from-emerald-500 to-teal-600', text: 'text-emerald-400' },
    { name: 'سلسال صدر', color: 'from-cyan-500 to-blue-600', text: 'text-cyan-400' },
    { name: 'أخرى', color: 'from-purple-500 to-fuchsia-600', text: 'text-purple-400' },
  ];

  const getCategoryCount = (catName: string) => {
    return items.filter(item => item.productType === catName).length;
  };

  const getCategoryPercentage = (catName: string) => {
    if (totalPieces === 0) return 0;
    return Math.round((getCategoryCount(catName) / totalPieces) * 100);
  };

  // Last 5 items
  const recentItems = items.slice(0, 5);

  return (
    <div id="dashboard_container" className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col pb-12">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-[#0b0f19]/80 border-b border-slate-800/80 px-4 py-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-extrabold text-[#0b0f19] shadow-md shadow-amber-500/10">
              بابل
            </div>
            <div>
              <h1 className="text-md sm:text-lg font-bold text-slate-100">بابل للذهب والمجوهرات</h1>
              <p className="text-[10px] sm:text-xs text-slate-400">لوحة تحكم الجرد الذكية</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-slate-400">الموظف الحالي:</span>
              <span className="text-sm font-semibold text-amber-400">{user.fullName}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 sm:px-4 sm:py-2 bg-slate-800/60 hover:bg-red-500/10 hover:text-red-400 text-slate-400 border border-slate-700/60 hover:border-red-500/20 rounded-xl transition-all duration-200 flex items-center gap-2 text-xs font-semibold cursor-pointer"
              title="تسجيل خروج"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">تسجيل خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 w-full flex-grow">
        
        {/* Dynamic Welcome and Clock banner */}
        <div className="bg-[#111827] border border-slate-800/60 rounded-2xl p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl"></div>

          <div className="z-10">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
              <Sparkles size={14} />
              <span>مرحباً بك مجدداً في نوبة عملك</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">أهلاً بك، {user.fullName}</h2>
            <p className="text-sm text-slate-400 mt-1">ابدأ تصوير كروت قطع الذهب الجديدة وسنقوم بفرزها وتصنيفها بالكامل تلقائياً.</p>
          </div>

          <div className="flex items-center gap-4 bg-[#1e293b]/40 border border-slate-800/80 px-4 py-3 rounded-xl min-w-[220px] justify-between z-10 self-start md:self-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-medium">{dateStr}</div>
                <div className="text-lg font-bold text-slate-100 font-mono tracking-wider mt-0.5">{time}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Big Action Launchers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => onNavigate('scan')}
            className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#0b0f19] rounded-2xl shadow-xl shadow-amber-500/5 hover:shadow-amber-500/10 transition-all duration-300 relative overflow-hidden active:scale-[0.98] cursor-pointer border border-amber-400/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl translate-x-12 -translate-y-12 transition-transform group-hover:scale-125"></div>
            <div className="w-14 h-14 bg-[#0b0f19] text-amber-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-amber-400/20 group-hover:scale-110 transition-transform">
              <Camera size={26} />
            </div>
            <span className="text-lg font-extrabold">📷 تصوير قطعة جديدة</span>
            <span className="text-xs text-amber-950/80 mt-1.5 font-medium">قراءة البراكيد وتحديد الوزن بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={onExport}
            className="group flex flex-col items-center justify-center p-6 bg-[#161f30] hover:bg-[#1e293b] border border-slate-800 hover:border-slate-700/80 text-slate-100 rounded-2xl shadow-xl transition-all duration-300 relative overflow-hidden active:scale-[0.98] cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-xl translate-x-12 -translate-y-12"></div>
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-emerald-500/10 group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={26} />
            </div>
            <span className="text-lg font-bold group-hover:text-amber-400 transition-colors">📊 تصدير الجرد إلى Excel</span>
            <span className="text-xs text-slate-400 mt-1.5 font-medium">استخراج ملف منظم بصفحات فرعية للأنواع</span>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="group flex flex-col items-center justify-center p-6 bg-[#161f30] hover:bg-[#1e293b] border border-slate-800 hover:border-slate-700/80 text-slate-100 rounded-2xl shadow-xl transition-all duration-300 relative overflow-hidden active:scale-[0.98] cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-xl translate-x-12 -translate-y-12"></div>
            <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-cyan-500/10 group-hover:scale-110 transition-transform">
              <History size={26} />
            </div>
            <span className="text-lg font-bold group-hover:text-amber-400 transition-colors">📋 سجل الجرد الكامل</span>
            <span className="text-xs text-slate-400 mt-1.5 font-medium">تعديل الأرقام، تصفية الفئات وحذف الأخطاء</span>
          </button>
        </div>

        {/* Dashboard Statistics KPI Cards */}
        <h3 className="text-sm font-extrabold text-slate-400 tracking-wider mb-3 uppercase">إحصائيات جرد اليوم</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">القطع المجردة اليوم</span>
              <span className="text-3xl font-extrabold font-mono text-amber-400 mt-1 block">{piecesTodayCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">إجمالي الجرد الكلي: {totalPieces} قطعة</span>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
              <Layers size={22} />
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">وزن الذهب المجرود اليوم</span>
              <span className="text-3xl font-extrabold font-mono text-rose-400 mt-1 block">{todayWeight.toFixed(2)} <span className="text-xs font-sans">غرام</span></span>
              <span className="text-[10px] text-slate-500 font-medium">الوزن الكلي: {totalWeight.toFixed(2)} غرام</span>
            </div>
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center">
              <Weight size={22} />
            </div>
          </div>

          <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-medium">نسبة الإنجاز اليومي</span>
              <span className="text-3xl font-extrabold font-mono text-emerald-400 mt-1 block">
                {totalPieces > 0 ? Math.round((piecesTodayCount / totalPieces) * 100) : 0}%
              </span>
              <span className="text-[10px] text-slate-500 font-medium">تم التحقق منها بنجاح</span>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        {/* Categories Progress Breakdown & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Categories Progress (7 columns) */}
          <div className="lg:col-span-7 bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <Layers size={18} className="text-amber-400" />
                <span>فرز الجرد حسب الفئات والأنواع</span>
              </h3>
              <span className="text-xs text-slate-400 font-medium">إجمالي {totalPieces} قطعة</span>
            </div>

            <div className="space-y-4">
              {categories.map((cat) => {
                const count = getCategoryCount(cat.name);
                const percent = getCategoryPercentage(cat.name);
                return (
                  <div key={cat.name} className="flex flex-col">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-semibold text-slate-200">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 font-mono">{count} قطعة</span>
                        <span className={`font-mono ${cat.text} bg-slate-800/50 px-1.5 py-0.5 rounded`}>({percent}%)</span>
                      </div>
                    </div>
                    {/* Beautiful Premium Progress Track */}
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${cat.color} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity (5 columns) */}
          <div className="lg:col-span-5 bg-[#111827] border border-slate-800/80 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
              <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>آخر القطع المضافة مؤخراً</span>
              </h3>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-0.5 transition-colors cursor-pointer"
              >
                <span>الكل</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {recentItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs leading-relaxed">
                  لا توجد أي قطع مسجلة اليوم.<br />إضغط على زر "📷 تصوير قطعة جديدة" للبدء بالجرد.
                </div>
              ) : (
                recentItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-[#161f30]/40 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {item.photoUrl ? (
                        <img 
                          src={item.photoUrl} 
                          alt="tag" 
                          className="w-10 h-10 object-cover rounded-lg border border-slate-700/80" 
                        />
                      ) : (
                        <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center font-bold text-xs">
                          {item.productType.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold font-mono text-slate-200"># {item.serialNumber}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span className="font-semibold text-amber-500">{item.productType}</span>
                          <span>•</span>
                          <span className="font-medium font-mono">{item.weight ? `${item.weight}غ` : 'بدون وزن'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-500 block">بواسطة</span>
                      <span className="text-[10px] font-semibold text-slate-300">{item.capturedBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
