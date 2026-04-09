import { useEffect, useState } from "react";
import { useAllBookings } from "@/hooks/useBookingData";
import { TIME_SLOTS } from "@/lib/timeSlots";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  CreditCard,
  MapPin,
  RefreshCw,
} from "lucide-react";

function getRemainingTime(endAt?: string) {
  if (!endAt) return null;

  const diff = new Date(endAt).getTime() - Date.now();

  if (diff <= 0) return "انتهى الوقت";

  const minutes = Math.floor(diff / 1000 / 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function Dashboard() {
  const { data: bookings = [], isLoading, refetch } = useAllBookings();
  const [, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeDisplay = (time: string) => {
    const t = time.slice(0, 5);
    return TIME_SLOTS.find((s) => s.time === t)?.display || time;
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const todayBookings = bookings.filter((b) => b.booking_date === todayStr);
  const upcomingBookings = bookings.filter((b) => b.booking_date > todayStr);

  return (
    <div className="space-y-6">
      
      {/* العنوان */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-[#1e3a5f]">
          لوحة التحكم
        </h2>

        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-[#1e3a5f] hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="حجوزات اليوم" value={todayBookings.length} />
        <StatCard label="حجوزات قادمة" value={upcomingBookings.length} />
        <StatCard label="الإجمالي" value={bookings.length} />
      </div>

      {isLoading && (
        <p className="text-slate-500 text-center py-8">جاري التحميل...</p>
      )}

      {todayBookings.length > 0 && (
        <Section title="حجوزات اليوم">
          {todayBookings.map((b) => (
            <BookingCard key={b.id} booking={b} getTimeDisplay={getTimeDisplay} />
          ))}
        </Section>
      )}

      {upcomingBookings.length > 0 && (
        <Section title="الحجوزات القادمة">
          {upcomingBookings.map((b) => (
            <BookingCard key={b.id} booking={b} getTimeDisplay={getTimeDisplay} />
          ))}
        </Section>
      )}

      {bookings.length === 0 && !isLoading && (
        <p className="text-slate-500 text-center py-12">
          لا توجد حجوزات حالياً
        </p>
      )}
    </div>
  );
}

/* ================== STAT CARD ================== */
function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-3xl font-extrabold text-[#1e3a5f]">{value}</p>
      <p className="text-slate-500 text-sm mt-1">{label}</p>
    </div>
  );
}

/* ================== SECTION ================== */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-[#1e3a5f] border-b border-slate-200 pb-2">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/* ================== BOOKING CARD ================== */
function BookingCard({
  booking,
  getTimeDisplay,
}: {
  booking: any;
  getTimeDisplay: (t: string) => string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-base font-bold text-[#1e3a5f]">تفاصيل الحجز</h4>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow
          icon={<User className="w-5 h-5 text-[#1e3a5f]" />}
          label="العميل"
          value={booking.customer_name}
          bold
        />

        <InfoRow
          icon={<Phone className="w-5 h-5 text-[#1e3a5f]" />}
          label="الهاتف"
          value={booking.customer_phone}
        />

        <InfoRow
          icon={<Calendar className="w-5 h-5 text-[#1e3a5f]" />}
          label="التاريخ"
          value={booking.booking_date}
        />

        <InfoRow
          icon={<Clock className="w-5 h-5 text-[#1e3a5f]" />}
          label="الوقت"
          value={getTimeDisplay(booking.booking_time)}
        />

        <InfoRow
          icon={<Scissors className="w-5 h-5 text-[#1e3a5f]" />}
          label="الخدمة"
          value={booking.services?.name}
        />

        <InfoRow
          icon={<CreditCard className="w-5 h-5 text-[#1e3a5f]" />}
          label="السعر"
          value={`${booking.services?.price} ريال`}
          highlight
        />

        {booking.is_home_service && (
          <InfoRow
            icon={<MapPin className="w-5 h-5 text-[#1e3a5f]" />}
            label="العنوان"
            value={booking.address || "—"}
          />
        )}
      </div>

      {booking.status === "in_progress" && booking.service_ends_at && (
        <div className="mt-4 rounded-2xl border border-[#1e3a5f]/20 bg-[#eef4fb] px-4 py-3">
          <p className="text-sm text-slate-500">الوقت المتبقي لانتهاء الخدمة</p>
          <p className="text-xl font-bold text-[#1e3a5f]">
            {getRemainingTime(booking.service_ends_at)}
          </p>
        </div>
      )}
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<
    string,
    { label: string; className: string }
  > = {
    confirmed: {
      label: "مؤكد",
      className: "bg-blue-50 text-blue-700 border border-blue-200",
    },
    in_progress: {
      label: "قيد التنفيذ",
      className: "bg-[#eef4fb] text-[#1e3a5f] border border-[#c9daee]",
    },
    completed: {
      label: "مكتمل",
      className: "bg-green-50 text-green-700 border border-green-200",
    },
    cancelled: {
      label: "ملغي",
      className: "bg-red-50 text-red-700 border border-red-200",
    },
  };

  const current = statusMap[status] || {
    label: status,
    className: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

/* ================== INFO ROW ================== */
function InfoRow({
  icon,
  label,
  value,
  bold,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-slate-500 text-sm">{label}:</span>

      <span
        className={`${
          bold ? "font-bold text-lg text-slate-900" : "text-slate-800"
        } ${highlight ? "text-[#1e3a5f] font-bold" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}