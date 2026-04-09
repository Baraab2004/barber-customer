import type { Barber, Service } from "@/lib/app-types";
import { TIME_SLOTS } from "@/lib/timeSlots";
import { CreditCard, MapPin, User, Phone, Scissors, Clock, Calendar, Store, Home } from "lucide-react";

interface BookingSummaryProps {
  service: Service;
  barber: Barber;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  isHomeService: boolean;
  address: string;
  onConfirm: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function BookingSummary({
  service,
  barber,
  date,
  time,
  customerName,
  customerPhone,
  isHomeService,
  address,
  onConfirm,
  onBack,
  isSubmitting,
}: BookingSummaryProps) {
  const timeDisplay = TIME_SLOTS.find((t) => t.time === time)?.display || time;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold gold-text">ملخص الحجز</h2>

      <div className="card-luxury p-6 space-y-4">
        <SummaryRow
          icon={<User className="w-5 h-5 text-primary" />}
          label="الاسم"
          value={customerName}
        />

        <SummaryRow
          icon={<Phone className="w-5 h-5 text-primary" />}
          label="الهاتف"
          value={customerPhone}
        />

        <SummaryRow
          icon={<Scissors className="w-5 h-5 text-primary" />}
          label="الخدمة"
          value={service.name}
        />

        <SummaryRow
          icon={<Calendar className="w-5 h-5 text-primary" />}
          label="التاريخ"
          value={date}
        />

        <SummaryRow
          icon={<Clock className="w-5 h-5 text-primary" />}
          label="الوقت"
          value={timeDisplay}
        />

        <SummaryRow
          icon={
            isHomeService ? (
              <Home className="w-5 h-5 text-primary" />
            ) : (
              <Store className="w-5 h-5 text-primary" />
            )
          }
          label="نوع الحجز"
          value={isHomeService ? "خدمة منزلية" : "داخل الصالون"}
        />


        {isHomeService && (
          <SummaryRow
            icon={<MapPin className="w-5 h-5 text-primary" />}
            label="العنوان"
            value={address}
          />
        )}

        <div className="border-t border-border pt-4 flex items-center justify-between">
          <span className="text-muted-foreground">الإجمالي</span>
          <span className="text-2xl font-bold gold-text">{service.price} ريال</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 gold-gradient text-primary-foreground font-bold py-3 rounded-lg transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "جاري تأكيد الحجز..." : "تأكيد الحجز"}
        </button>

        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg border border-border text-foreground hover:border-primary/50 transition-all"
        >
          رجوع
        </button>
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-muted-foreground min-w-[90px]">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}