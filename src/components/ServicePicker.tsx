import type { Service } from "@/lib/app-types";
import { Check, Scissors } from "lucide-react";

interface ServicePickerProps {
  services: Service[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function ServicePicker({ services, selected, onSelect }: ServicePickerProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#1e3a5f]">اختر الخدمة</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {services.map((service) => {
          const isSelected = selected === service.id;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service.id)}
              className={`group relative overflow-hidden rounded-2xl border p-5 text-right transition-all duration-300 ${
                isSelected
                  ? "border-[#1e3a5f] bg-[#eef4fb] shadow-md"
                  : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#1e3a5f]/30 hover:shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        isSelected ? "bg-[#1e3a5f] text-white" : "bg-[#f4f7fb] text-[#1e3a5f]"
                      }`}
                    >
                      <Scissors className="h-5 w-5" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
                  </div>

                  <p className="text-sm leading-6 text-slate-500">
                    {service.description || "خدمة احترافية بجودة عالية"}
                  </p>

                  <div className="pt-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                        isSelected
                          ? "bg-[#1e3a5f] text-white"
                          : "bg-[#f4f7fb] text-[#1e3a5f]"
                      }`}
                    >
                    </span>
                  </div>
                </div>

                <div
                  className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all ${
                    isSelected
                      ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  <Check className="h-4 w-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}