import type { Barber } from "@/lib/app-types";
import { User } from "lucide-react";

interface BarberPickerProps {
  barbers: Barber[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function BarberPicker({ barbers }: BarberPickerProps) {
  const mainBarber = barbers[0];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold gold-text">الحلاق</h2>

      <div className="card-luxury p-5 text-center">
        <div className="w-16 h-16 rounded-full gold-gradient mx-auto flex items-center justify-center mb-3">
          <User className="w-8 h-8 text-primary-foreground" />
        </div>

        <h3 className="font-bold text-foreground text-lg">
          {mainBarber?.name ?? "الحلاق الرئيسي"}
        </h3>

        <p className="text-muted-foreground text-sm mt-1">
          {mainBarber?.speciality ?? "جميع الحجوزات تتم لدى الحلاق الرئيسي"}
        </p>
      </div>
    </div>
  );
}