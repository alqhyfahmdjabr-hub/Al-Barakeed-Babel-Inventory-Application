import React, { useState } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, UserCheck, ChevronLeft, KeyRound, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ users, onLoginSuccess }: LoginScreenProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setPin('');
    setError(null);
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setError(null);
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmitPin = async (completedPin: string) => {
    if (!selectedUser) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUser.username,
          pin: completedPin,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'رمز PIN غير صحيح. يرجى المحاولة مجدداً.');
        setPin(''); // Reset pin on error
        // Add a subtle vibration for mobile devices if supported
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم. يرجى التأكد من تشغيل النظام.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (pin.length === 4) {
      handleSubmitPin(pin);
    }
  }, [pin]);

  return (
    <div id="login_container" className="min-h-screen flex flex-col justify-center items-center px-4 bg-gradient-to-b from-[#0b0f19] to-[#111827] text-white">
      {/* Header and Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10 border border-amber-400/20">
          <span className="text-3xl font-extrabold text-[#0b0f19] tracking-wider">بابل</span>
        </div>
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500">
          نظام بابل لجرد الذهب والمجوهرات
        </h1>
        <p className="text-gray-400 text-sm mt-2 font-light">
          Babylon Gold & Jewelry Inventory System (BGJIS)
        </p>
      </motion.div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#161f30] rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden p-6 relative">
        <AnimatePresence mode="wait">
          {!selectedUser ? (
            /* USER SELECTION SCREEN */
            <motion.div
              key="user-select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <h2 className="text-lg font-bold text-center text-slate-200 mb-6 border-b border-slate-800/80 pb-3">
                الرجاء اختيار اسم الموظف للبدء
              </h2>

              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex flex-col items-center justify-center p-4 bg-[#1e293b]/60 hover:bg-[#1e293b] border border-slate-800 hover:border-amber-500/40 rounded-xl transition-all duration-200 group active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center mb-2 border border-slate-700 transition-colors">
                      <UserCheck size={18} />
                    </div>
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-amber-300">
                      {user.username}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 capitalize">
                      {user.role === 'admin' ? 'مدير النظام' : 'موظف جرد'}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* PIN ENTRY SCREEN */
            <motion.div
              key="pin-entry"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              {/* Back button */}
              <button
                onClick={() => setSelectedUser(null)}
                className="self-start flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors text-sm mb-4"
              >
                <ChevronLeft size={16} />
                <span>تغيير الموظف</span>
              </button>

              <div className="text-center mb-4">
                <p className="text-xs text-slate-400">مرحباً بك،</p>
                <p className="text-lg font-bold text-amber-400">{selectedUser.username}</p>
                <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <KeyRound size={12} />
                  <span>الرجاء إدخال رمز PIN الخاص بك</span>
                </p>
              </div>

              {/* Pin Dots */}
              <div className="flex gap-4 my-6">
                {[0, 1, 2, 3].map(index => (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                      pin.length > index
                        ? 'bg-amber-500 border-amber-500 scale-110 shadow-lg shadow-amber-500/30'
                        : 'border-slate-600 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {/* Error Alert */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2 mb-4"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Numeric Pad */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                  <button
                    key={num}
                    onClick={() => handleKeyPress(num)}
                    disabled={loading}
                    className="h-14 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-xl font-bold text-slate-100 rounded-xl flex items-center justify-center active:bg-amber-500 active:text-[#0b0f19] active:scale-95 transition-all cursor-pointer font-mono"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="h-14 text-sm text-slate-400 hover:text-white rounded-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                >
                  مسح
                </button>
                <button
                  onClick={() => handleKeyPress('0')}
                  disabled={loading}
                  className="h-14 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/50 text-xl font-bold text-slate-100 rounded-xl flex items-center justify-center active:bg-amber-500 active:text-[#0b0f19] active:scale-95 transition-all cursor-pointer font-mono"
                >
                  0
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="h-14 text-sm text-slate-400 hover:text-white rounded-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                >
                  حذف
                </button>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-[#161f30]/80 flex flex-col items-center justify-center rounded-2xl">
                  <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm text-amber-400">جاري التحقق من الرمز...</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Instructions */}
      <div className="mt-8 text-center text-slate-500 text-xs max-w-xs leading-relaxed">
        أول مرة هنا؟ اختر الموظف وأدخل رمز PIN الخاص به. الرموز التجريبية للموظفين تبدأ من <span className="font-mono text-amber-500/80">1111</span> وحتى <span className="font-mono text-amber-500/80">9999</span>، والرمز العام للمدير <span className="font-mono text-amber-500/80">1234</span>.
      </div>
    </div>
  );
}
