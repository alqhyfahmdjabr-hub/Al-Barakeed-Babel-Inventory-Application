import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, Check, AlertTriangle, Scale, Hash, 
  HelpCircle, ChevronDown, CheckCircle2 
} from 'lucide-react';
import { OcrResult, InventoryItem } from '../types';

interface ReviewScreenProps {
  ocrResult: OcrResult;
  photoUrl: string;
  items: InventoryItem[];
  userName: string;
  onConfirm: (finalData: { serialNumber: string; productType: string; weight: number | null }) => void;
  onCancel: () => void;
}

export default function ReviewScreen({
  ocrResult,
  photoUrl,
  items,
  userName,
  onConfirm,
  onCancel
}: ReviewScreenProps) {
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [productType, setProductType] = useState<string>('أساور');
  const [weight, setWeight] = useState<string>('');
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Initialize fields with OCR results
  useEffect(() => {
    if (ocrResult.serialNumber) {
      setSerialNumber(ocrResult.serialNumber);
    } else {
      setSerialNumber('');
    }
    setProductType(ocrResult.productType || 'أساور');
    setWeight(ocrResult.weight ? String(ocrResult.weight) : '');
  }, [ocrResult]);

  // Real-time validation for duplicate serial numbers
  useEffect(() => {
    if (serialNumber) {
      const duplicateExists = items.some(
        item => item.serialNumber === serialNumber
      );
      setIsDuplicate(duplicateExists);
    } else {
      setIsDuplicate(false);
    }
  }, [serialNumber, items]);

  const categories = ['أساور', 'حلق', 'أخراص', 'سلسال صدر', 'أخرى'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!serialNumber) {
      setError('الرقم التسلسلي مطلوب للقطع.');
      return;
    }

    // Validate 4-5 digits
    if (!/^\d{4,5}$/.test(serialNumber)) {
      setError('رقم غير صالح. يجب أن يتكون الرقم التسلسلي من 4 أو 5 أرقام فقط.');
      return;
    }

    if (isDuplicate) {
      setError('هذا الرقم التسلسلي مسجل مسبقاً في النظام. لا يمكن جرد نفس القطعة مرتين.');
      return;
    }

    const parsedWeight = weight ? parseFloat(weight) : null;
    if (weight && isNaN(parsedWeight || 0)) {
      setError('الرجاء إدخال قيمة وزن صالحة (رقم عشري بالجرام).');
      return;
    }

    // Success! Trigger confirm animation and save
    setSuccess(true);
    setTimeout(() => {
      onConfirm({
        serialNumber,
        productType,
        weight: parsedWeight
      });
    }, 800);
  };

  return (
    <div id="review_container" className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col pb-12 relative">
      {/* Header */}
      <header className="px-4 py-4 border-b border-slate-800/80 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-slate-400 hover:text-amber-400 transition-colors text-sm font-semibold cursor-pointer"
          >
            <ArrowRight size={16} />
            <span>إلغاء وإعادة التصوير</span>
          </button>
          <span className="text-sm font-bold text-amber-400">مراجعة وتأكيد البيانات</span>
        </div>
      </header>

      {/* Main Form content */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-4 mt-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Captured Photo Preview (1/2 width on desktop) */}
        <div className="w-full md:w-5/12 flex flex-col">
          <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase">معاينة بطاقة الذهب</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden aspect-video md:aspect-[4/5] relative shadow-lg">
            <img 
              src={photoUrl} 
              alt="Captured Tag" 
              className="w-full h-full object-contain" 
            />
            {/* Visual scan line overlay to indicate OCR was done */}
            <div className="absolute top-2 right-2 bg-[#0b0f19]/80 border border-emerald-500/30 text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span>تم التحليل بالذكاء الاصطناعي</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center leading-relaxed">
            قارن الأرقام والوزن المكتوب على بطاقة الذهب بالصورة مع القيم المدخلة في النموذج لضمان دقة جرد 100%.
          </p>
        </div>

        {/* Right Side: Verification Form (7/12 width) */}
        <div className="w-full md:w-7/12 flex flex-col bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          
          <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-800/80 pb-3">تأكيد تفاصيل القطعة</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Serial Number Input */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Hash size={14} className="text-amber-500" />
                <span>الرقم التسلسلي (سيريال)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  pattern="\d*"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="مثال: 12345"
                  className={`w-full px-4 py-3 bg-[#1e293b]/60 border rounded-xl text-lg font-bold text-slate-100 font-mono tracking-widest placeholder:font-sans focus:outline-none focus:ring-1 ${
                    isDuplicate 
                      ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500 bg-red-500/5'
                      : 'border-slate-800 focus:ring-amber-500 focus:border-amber-500'
                  }`}
                  required
                />
              </div>

              {/* Warning/Status of serial */}
              {isDuplicate && (
                <div className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5 font-medium bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                  <AlertTriangle size={14} className="shrink-0 animate-bounce" />
                  <span>تنبيه: هذا الرقم مكرر ومسجل مسبقاً في الجرد!</span>
                </div>
              )}
              {!isDuplicate && serialNumber && (
                <div className="mt-1 text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 size={12} />
                  <span>الرقم فريد وجاهز للحفظ.</span>
                </div>
              )}
            </div>

            {/* Product Type (Category) Dropdown */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <HelpCircle size={14} className="text-amber-500" />
                <span>نوع المنتج والفرز</span>
              </label>
              <div className="relative">
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#1e293b]/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-sm font-semibold text-slate-200 focus:outline-none appearance-none cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#111827]">
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

            {/* Weight Input */}
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Scale size={14} className="text-amber-500" />
                <span>وزن القطعة (اختياري)</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="أدخل الوزن يدوياً أو مستخرج..."
                  className="w-full px-4 py-3 bg-[#1e293b]/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl text-md font-bold font-mono text-slate-100 placeholder:font-sans focus:outline-none"
                />
                <span className="absolute left-4 text-xs font-bold text-slate-500">غرام</span>
              </div>
            </div>

            {/* Form Validation Error message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-800/80">
              <button
                type="submit"
                disabled={success}
                className="w-2/3 h-12 bg-gradient-to-tr from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-[#0b0f19] rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95 transition-all"
              >
                <Check size={18} />
                <span>تأكيد وحفظ القطعة</span>
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                disabled={success}
                className="w-1/3 h-12 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                إلغاء وإعادة
              </button>
            </div>

          </form>

          {/* Success Overlay Animation on submit */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0b0f19] flex flex-col items-center justify-center text-center z-10"
              >
                <motion.div
                  initial={{ scale: 0.5, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-slate-900 shadow-xl shadow-emerald-500/20 mb-4"
                >
                  <Check size={32} strokeWidth={3} />
                </motion.div>
                <h4 className="text-lg font-extrabold text-emerald-400">تم الحفظ بنجاح!</h4>
                <p className="text-xs text-slate-400 mt-1">تمت إضافة القطعة ومزامنتها في ملف الجرد</p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">الرقم التسلسلي: {serialNumber}</p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
