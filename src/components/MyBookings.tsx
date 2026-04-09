import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar, Clock, User, Scissors, Phone, X, Search } from "lucide-react";
import { TIME_SLOTS } from "@/lib/timeSlots";
import { cancelBooking } from "@/lib/api";
import { useMyBookings } from "@/hooks/useBookingData";

function getRemainingTime(endAt?: string) {
  if (!endAt) return null;

  const diff = new Date(endAt).getTime() - Date.now();

  if (diff <= 0) return "انتهى الوقت";

  const minutes = Math.floor(diff / 1000 / 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function MyBookings() {
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [, setNow] = useState(Date.now());

  const { data: bookings, isLoading, refetch } = useMyBookings(searchValue);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (search.trim()) setSearchValue(search.trim());
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelBooking(id);
      toast.success("تم إلغاء الحجز بنجاح");
      refetch();
    } catch {
      toast.error("حدث خطأ أثناء الإلغاء");
    }
  };

  const getTimeDisplay = (time: string) => {
    const t = time.slice(0, 5);
    return TIME_SLOTS.find((s) => s.time === t)?.display || time;
  };

  return (
    <div className="space-y-6">
      
      {/* العنوان */}
      <h2 className="text-2xl font-extrabold text-[#1e3a5f]">حجوزاتي</h2>

      {/* البحث */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="ابحث برقم الهاتف"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
        />

        <button
          onClick={handleSearch}
          className="flex items-center gap-2 rounded-2xl bg-[#1e3a5f] px-5 py-3 font-bold text-white transition hover:bg-[#16324f]"
        >
          <Search className="w-4 h-4" />
          بحث
        </button>
      </div>

      {/* loading */}
      {isLoading && <p className="text-slate-500">جاري البحث...</p>}

      {/* no results */}
      {searchValue && bookings && bookings.length === 0 && (
        <p className="text-center text-slate-500 py-8">لا توجد حجوزات</p>
      )}

      {/* النتائج */}
      {bookings && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">

                <div className="space-y-3 w-full">

                  {/* الاسم */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#1e3a5f]" />
                    <span className="font-bold text-slate-900">
                      {booking.customer_name}
                    </span>
                  </div>

                  {/* الهاتف */}
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#1e3a5f]" />
                    <span className="text-slate-500">
                      {booking.customer_phone}
                    </span>
                  </div>

                  {/* الخدمة */}
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-[#1e3a5f]" />
                    <span className="text-slate-800">
                      {booking.services?.name}
                    </span>
                    <span className="text-[#1e3a5f] font-bold">
                      ({booking.services?.price} ريال)
                    </span>
                  </div>

                  {/* التاريخ والوقت */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#1e3a5f]" />
                      <span className="text-slate-800">
                        {booking.booking_date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#1e3a5f]" />
                      <span className="text-slate-800">
                        {getTimeDisplay(booking.booking_time)}
                      </span>
                    </div>
                  </div>

                  {/* العداد */}
                  {booking.status === "in_progress" && booking.service_ends_at && (
                    <div className="mt-3 rounded-2xl border border-[#1e3a5f]/20 bg-[#eef4fb] px-4 py-3">
                      <p className="text-sm text-slate-500">
                        الوقت المتبقي لانتهاء الخدمة
                      </p>
                      <p className="text-xl font-bold text-[#1e3a5f]">
                        {getRemainingTime(booking.service_ends_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* زر إلغاء */}
                {booking.status === "confirmed" && (
                  <button
                    onClick={() => handleCancel(booking.id)}
                    className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}