import { TIME_SLOTS } from "@/lib/timeSlots";
import { Clock } from "lucide-react";

interface TimePickerProps {
  selected: string | null;
  onSelect: (time: string) => void;
  bookedSlots: string[];
  isLoading: boolean;
  selectedDate?: Date;
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isPastTime(slotTime: string, selectedDate?: Date) {
  if (!selectedDate) return false;

  const now = new Date();

  if (!isSameDay(selectedDate, now)) return false;

  const [hours, minutes] = slotTime.split(":").map(Number);
  const slotDate = new Date(selectedDate);
  slotDate.setHours(hours, minutes, 0, 0);

  return slotDate <= now;
}

export default function TimePicker({
  selected,
  onSelect,
  bookedSlots,
  isLoading,
  selectedDate,
}: TimePickerProps) {
  const bookedSet = new Set(
    bookedSlots
      .filter(Boolean)
      .map((t) => t.slice(0, 5))
  );

  const availableSlots = TIME_SLOTS.filter((slot) => {
    const isBooked = bookedSet.has(slot.time);
    const isPast = isPastTime(slot.time, selectedDate);
    return !isBooked && !isPast;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold text-[#1e3a5f]">اختر الوقت</h2>
        <Clock className="w-5 h-5 text-[#1e3a5f]" />
      </div>

      <p className="text-sm text-slate-500">
        يتم عرض الأوقات المتاحة فقط
      </p>

      {isLoading ? (
        <div className="text-slate-500">جاري التحميل...</div>
      ) : availableSlots.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-500">
          لا توجد أوقات متاحة لهذا اليوم
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {availableSlots.map((slot) => {
            const isSelected = selected === slot.time;

            return (
              <button
                key={slot.time}
                type="button"
                onClick={() => onSelect(slot.time)}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all focus:outline-none ${
                  isSelected
                    ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-800 hover:border-[#1e3a5f]/40 hover:bg-slate-50"
                }`}
              >
                <span>{slot.display}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
