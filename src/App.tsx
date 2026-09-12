import React, { useState, useEffect } from 'react';
import { User, InventoryItem, OcrResult, ActiveView } from './types';
import LoginScreen from './components/LoginScreen';
import DashboardScreen from './components/DashboardScreen';
import ScanScreen from './components/ScanScreen';
import ReviewScreen from './components/ReviewScreen';
import HistoryScreen from './components/HistoryScreen';
import SmartAssistant from './components/SmartAssistant';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('login');
  
  // States for active OCR scanning
  const [ocrResult, setOcrResult] = useState<OcrResult>({ serialNumber: null, productType: 'أساور', weight: null });
  const [photoUrl, setPhotoUrl] = useState<string>('');
  
  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-clear Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // Fetch all staff profiles
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Fetch registered items
  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  // Check saved session on boot
  useEffect(() => {
    fetchUsers();
    fetchItems();

    const savedUser = localStorage.getItem('bgjis_user_session');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setActiveView('dashboard');
      } catch (e) {
        localStorage.removeItem('bgjis_user_session');
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('bgjis_user_session', JSON.stringify(loggedInUser));
    showToast(`مرحباً بك يا ${loggedInUser.fullName}. تم تسجيل دخولك بنجاح.`, 'success');
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('bgjis_user_session');
    showToast('تم تسجيل الخروج بنجاح.', 'success');
    setActiveView('login');
  };

  const handleOcrSuccess = (result: OcrResult, imgUrl: string) => {
    setOcrResult(result);
    setPhotoUrl(imgUrl);
    setActiveView('confirm');
  };

  // Confirm and save a newly registered item
  const handleConfirmItem = async (finalData: { serialNumber: string; productType: string; weight: number | null }) => {
    if (!user) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: finalData.serialNumber,
          productType: finalData.productType,
          weight: finalData.weight,
          photoUrl: photoUrl,
          capturedBy: user.fullName
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast(`تم تسجيل القطعة رقم ${finalData.serialNumber} بنجاح.`, 'success');
        // Refresh items list
        fetchItems();
        // Redirect to dashboard
        setActiveView('dashboard');
      } else {
        showToast(data.error || 'فشل في حفظ القطعة. يرجى المحاولة لاحقاً.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالشبكة. تعذر حفظ البيانات.', 'error');
    }
  };

  // Delete a registered item from inventory
  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast('تمت إزالة القطعة بنجاح من سجل الجرد.', 'success');
        fetchItems();
      } else {
        showToast(data.error || 'فشل في إزالة القطعة.', 'error');
      }
    } catch (err) {
      showToast('خطأ في الاتصال بالشبكة.', 'error');
    }
  };

  // Download multi-sheet Excel
  const handleExportExcel = () => {
    try {
      // Use standard HTML download trigger for /api/export
      const link = document.createElement('a');
      link.href = '/api/export';
      link.setAttribute('download', 'Babil_Inventory.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('جاري بدء تحميل ملف Excel المنظم...', 'success');
    } catch (err) {
      showToast('فشل في تصدير الجرد لملف Excel.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 select-none">
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm max-w-sm w-[90%] md:w-auto ${
              toast.type === 'success'
                ? 'bg-[#10b981] text-[#0b0f19] border-emerald-400 font-bold'
                : 'bg-red-500 text-white border-red-400 font-bold'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span className="flex-grow text-right">{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="p-1 hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Application Layout Router with Route Animations */}
      <div className="w-full">
        {activeView === 'login' && (
          <LoginScreen users={users} onLoginSuccess={handleLoginSuccess} />
        )}

        {activeView === 'dashboard' && user && (
          <DashboardScreen
            user={user}
            items={items}
            onLogout={handleLogout}
            onNavigate={(view) => setActiveView(view)}
            onExport={handleExportExcel}
          />
        )}

        {activeView === 'scan' && (
          <ScanScreen
            onOcrSuccess={handleOcrSuccess}
            onNavigateBack={() => setActiveView('dashboard')}
          />
        )}

        {activeView === 'confirm' && (
          <ReviewScreen
            ocrResult={ocrResult}
            photoUrl={photoUrl}
            items={items}
            userName={user?.fullName || ''}
            onConfirm={handleConfirmItem}
            onCancel={() => setActiveView('scan')}
          />
        )}

        {activeView === 'history' && (
          <HistoryScreen
            items={items}
            onDelete={handleDeleteItem}
            onNavigateBack={() => setActiveView('dashboard')}
            onExport={handleExportExcel}
          />
        )}
      </div>

      {/* Global Smart Assistant Plugin (Gemini AI) */}
      <SmartAssistant />

    </div>
  );
}
