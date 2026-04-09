import { Scissors } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        
        {/* الشعار */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f] text-white shadow-sm">
            <Scissors className="h-5 w-5" />
          </div>

          <div className="flex flex-col leading-tight">
            <h1 className="text-xl font-extrabold text-[#1e3a5f]">
              صالون الأناقة
            </h1>
            <span className="text-xs text-slate-500">
              حجز المواعيد
            </span>
          </div>
        </div>

        {/* ممكن تضيف أزرار لاحقًا هون */}
        <div className="hidden sm:block text-sm text-slate-500">
          مرحباً بك 👋
        </div>

      </div>
    </header>
  );
}