import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CalendarPlus,
  ListChecks,
  Home,
  LayoutDashboard,
  CalendarDays,
  Clock3,
  Phone,
  User,
  Scissors,
} from "lucide-react";
import Header from "@/components/Header";
import ServicePicker from "@/components/ServicePicker";
import DatePickerSection from "@/components/DatePickerSection";
import TimePicker from "@/components/TimePicker";
import MyBookings from "@/components/MyBookings";
import Dashboard from "@/components/Dashboard";
import { useBarbers, useBookedSlots, useServices } from "@/hooks/useBookingData";
import { createBooking, seedFirebaseIfEmpty } from "@/lib/api";
import { sendBarberNotificationEmail } from "@/lib/email";

type Tab = "book" | "bookings" | "dashboard";

export default function Index() {
  const [emailError, setEmailError] = useState("");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("book");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isHomeService, setIsHomeService] = useState(false);
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedDate || !selectedTime) return;

    const now = new Date();

    const isSameSelectedDay =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();

    if (!isSameSelectedDay) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    if (selectedDateTime <= now) {
      setSelectedTime(null);
    }
  }, [selectedDate, selectedTime]);

  useEffect(() => {
    seedFirebaseIfEmpty().catch(() => undefined);
  }, []);

  const { data: barbers = [] } = useBarbers();
  const { data: services = [] } = useServices();

  const fixedBarberId = "3jDqLF465cERvos3MWVx";

  const dateStr = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(
        selectedDate.getDate()
      ).padStart(2, "0")}`
    : null;

const { data: bookedSlots = [], isLoading: slotsLoading } = useBookedSlots(
  fixedBarberId,
  dateStr,
  selectedDuration || null
);
  const service = services.find((s) => s.id === selectedService);
  const selectedDuration = Number(service?.duration ?? 0);
  useEffect(() => {
  if (!selectedTime || !service) return;

  // إذا الوقت الحالي صار محجوز بعد تغيير الخدمة
  if (bookedSlots.includes(selectedTime)) {
    setSelectedTime(null);
  }
}, [selectedService, bookedSlots]);
  const barber = barbers.find((b) => b.id === fixedBarberId) ?? barbers[0];

  const resetForm = () => {
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setCustomerName("");
    setCustomerPhone("");
    setPhoneError("");
    setIsHomeService(false);
    setAddress("");
    setEmailError("");
  };

  const handleConfirm = async () => {
    setEmailError("");

    if (!selectedService || !dateStr || !selectedTime || !service || !barber) return;

    if (phoneError || !customerPhone) {
      toast.error("يرجى إدخال رقم هاتف صحيح");
      return;
    }

    if (!customerName.trim()) {
      toast.error("يرجى إدخال الاسم");
      return;
    }

    if (isHomeService && !address.trim()) {
      toast.error("يرجى إدخال العنوان للخدمة المنزلية");
      return;
    }

    setIsSubmitting(true);

    const bookingPayload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      barber_id: fixedBarberId,
      service_id: selectedService,
      booking_date: dateStr,
      booking_time: selectedTime,
      is_home_service: isHomeService,
      address: isHomeService ? address : null,
      payment_method: "visa" as const,
    };

    try {
      await createBooking(bookingPayload);

      let emailSent = false;

      try {
        const emailResponse = await sendBarberNotificationEmail({
          customer_name: bookingPayload.customer_name,
          customer_phone: bookingPayload.customer_phone,
          booking_date: bookingPayload.booking_date,
          booking_time: bookingPayload.booking_time,
          service_name: service?.name || "غير محدد",
          is_home_service: bookingPayload.is_home_service,
          address: bookingPayload.address,
        });

        console.log("EmailJS response:", emailResponse);

        if (emailResponse?.status === 200 && emailResponse?.text === "OK") {
          emailSent = true;
          setEmailError("");
        } else {
          console.error("Unexpected EmailJS response:", emailResponse);
        }
      } catch (emailError: any) {
        console.error("EmailJS full error:", emailError);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["booked-slots"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] }),
      ]);

      if (!emailSent) {
        setEmailError("تم الحجز بنجاح، لكن تعذر إرسال إشعار الإيميل.");
        toast.warning("تم الحجز، لكن تعذر إرسال إشعار الإيميل", {
          duration: 10000,
        });
      }

      toast.success("تم الحجز بنجاح");
      resetForm();
      setTab("bookings");
    } catch (error: any) {
      if (error?.message === "SLOT_ALREADY_BOOKED" || error?.name === "SlotAlreadyBooked") {
        toast.error("هذا الموعد محجوز بالفعل، يرجى اختيار وقت آخر");
      } else {
        console.error("Booking error:", error);
        toast.error("حدث خطأ أثناء الحجز");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    !!selectedService &&
    !!selectedDate &&
    !!selectedTime &&
    customerName.trim() !== "" &&
    customerPhone.trim() !== "" &&
    !phoneError &&
    (!isHomeService || address.trim() !== "");

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <Header />

      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-[#eef4fb] to-[#dbe7f4]">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1400&q=80')",
          }}
        />
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full border border-[#1e3a5f]/15 bg-white/80 px-4 py-2 text-sm font-medium text-[#1e3a5f] shadow-sm backdrop-blur">
              حجز سريع وسهل
            </span>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1e3a5f] md:text-5xl">
                احجز موعدك بسهولة
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
                أدخل بياناتك، اختر اليوم والوقت المناسب، ثم اختر الخدمة وأكمل الحجز مباشرة.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  setTab("book");
                  resetForm();
                }}
                className="rounded-xl bg-[#1e3a5f] px-6 py-3 font-bold text-white shadow-md transition hover:bg-[#16324f]"
              >
                ابدأ الحجز
              </button>

              <button
                onClick={() => setTab("bookings")}
                className="rounded-xl border border-[#1e3a5f]/20 bg-white px-6 py-3 font-bold text-[#1e3a5f] shadow-sm transition hover:bg-slate-50"
              >
                عرض حجوزاتي
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={() => {
              setTab("book");
              resetForm();
            }}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 font-bold transition-all ${
              tab === "book"
                ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md"
                : "border-slate-200 bg-white text-[#1e3a5f] hover:border-[#1e3a5f]/30"
            }`}
          >
            <CalendarPlus className="w-5 h-5" />
            حجز جديد
          </button>

          <button
            onClick={() => setTab("bookings")}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 font-bold transition-all ${
              tab === "bookings"
                ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md"
                : "border-slate-200 bg-white text-[#1e3a5f] hover:border-[#1e3a5f]/30"
            }`}
          >
            <ListChecks className="w-5 h-5" />
            حجوزاتي
          </button>

          <button
            onClick={() => setTab("dashboard")}
            className={`flex items-center justify-center gap-2 rounded-2xl border px-5 py-4 font-bold transition-all ${
              tab === "dashboard"
                ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md"
                : "border-slate-200 bg-white text-[#1e3a5f] hover:border-[#1e3a5f]/30"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            الداشبورد
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-14 pt-8">
        {tab === "dashboard" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <Dashboard />
          </div>
        ) : tab === "bookings" ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
            <MyBookings />
          </div>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-[#1e3a5f]">حجز جديد</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    عبّي البيانات بالترتيب التالي ثم أكد الحجز مباشرة
                  </p>
                </div>

                <div className="space-y-8 animate-fade-in">
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-[#1e3a5f]">بيانات العميل</h3>
                      <p className="text-sm text-slate-500">أدخل اسمك ورقم الهاتف أولًا</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">الاسم الكامل</label>
                        <input
                          type="text"
                          placeholder="أدخل الاسم الكامل"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">رقم الهاتف</label>
                        <input
                          type="tel"
                          placeholder="05xxxxxxxx"
                          value={customerPhone}
                          onChange={(e) => {
                            const onlyNumbers = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setCustomerPhone(onlyNumbers);

                            if (onlyNumbers.length === 0) {
                              setPhoneError("");
                            } else if (!/^05\d{8}$/.test(onlyNumbers)) {
                              setPhoneError("رقم غير صحيح");
                            } else {
                              setPhoneError("");
                            }
                          }}
                          className={`w-full rounded-2xl border px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                            phoneError
                              ? "border-red-400 bg-red-50 focus:ring-red-100"
                              : "border-slate-200 bg-slate-50 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/10"
                          }`}
                        />
                        {phoneError && <p className="mt-2 text-sm text-red-500">{phoneError}</p>}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isHomeService}
                            onChange={(e) => setIsHomeService(e.target.checked)}
                            className="h-5 w-5 accent-[#1e3a5f]"
                          />
                          <Home className="w-5 h-5 text-[#1e3a5f]" />
                          <span className="font-medium text-slate-800">خدمة منزلية</span>
                        </label>

                        {isHomeService && (
                          <input
                            type="text"
                            placeholder="أدخل العنوان الكامل"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/10"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#1e3a5f]">التاريخ</h3>
                      <p className="text-sm text-slate-500">اختر اليوم المناسب لك</p>
                    </div>
                    <DatePickerSection selected={selectedDate} onSelect={setSelectedDate} />
                  </div>

                 {/* الخدمة أول */}
<div className="space-y-4">
  <div>
    <h3 className="text-lg font-bold text-[#1e3a5f]">الخدمة</h3>
    <p className="text-sm text-slate-500">اختر الخدمة التي تريد حجزها</p>
  </div>
  <ServicePicker
    services={services}
    selected={selectedService}
    onSelect={setSelectedService}
  />
</div>

{/* الوقت بعد الخدمة */}
<div className="space-y-4">
  <div>
    <h3 className="text-lg font-bold text-[#1e3a5f]">الوقت</h3>
    <p className="text-sm text-slate-500">
      اختر الساعة المناسبة من المواعيد المتاحة
    </p>
  </div>
  <TimePicker
    selected={selectedTime}
    onSelect={setSelectedTime}
    bookedSlots={bookedSlots}
    isLoading={slotsLoading}
    selectedDate={selectedDate}
  />
</div>
                </div>

                {emailError && (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {emailError}
                  </div>
                )}

                <div className="mt-8">
                  <button
                    onClick={handleConfirm}
                    disabled={!isFormValid || isSubmitting}
                    className="w-full rounded-2xl bg-[#1e3a5f] py-4 font-bold text-white transition hover:bg-[#16324f] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSubmitting ? "جاري تأكيد الحجز..." : "تأكيد الحجز"}
                  </button>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#1e3a5f]">ملخص سريع</h3>
                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-start gap-3 rounded-2xl bg-[#f4f7fb] p-4">
                    <User className="mt-0.5 h-5 w-5 text-[#1e3a5f]" />
                    <div>
                      <p className="font-semibold text-slate-800">الاسم</p>
                      <p className="text-slate-500">{customerName || "لم يتم الإدخال بعد"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-[#f4f7fb] p-4">
                    <Phone className="mt-0.5 h-5 w-5 text-[#1e3a5f]" />
                    <div>
                      <p className="font-semibold text-slate-800">الهاتف</p>
                      <p className="text-slate-500">{customerPhone || "لم يتم الإدخال بعد"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-[#f4f7fb] p-4">
                    <CalendarDays className="mt-0.5 h-5 w-5 text-[#1e3a5f]" />
                    <div>
                      <p className="font-semibold text-slate-800">التاريخ</p>
                      <p className="text-slate-500">{dateStr || "لم يتم الاختيار بعد"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-[#f4f7fb] p-4">
                    <Clock3 className="mt-0.5 h-5 w-5 text-[#1e3a5f]" />
                    <div>
                      <p className="font-semibold text-slate-800">الوقت</p>
                      <p className="text-slate-500">{selectedTime || "لم يتم الاختيار بعد"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-[#f4f7fb] p-4">
                    <Scissors className="mt-0.5 h-5 w-5 text-[#1e3a5f]" />
                    <div>
                      <p className="font-semibold text-slate-800">الخدمة</p>
                      <p className="text-slate-500">{service?.name || "لم يتم الاختيار بعد"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-[#1e3a5f] p-6 text-white shadow-sm">
                <h3 className="text-lg font-bold">ملاحظات الحجز</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li>يرجى التأكد من صحة رقم الهاتف قبل تأكيد الحجز.</li>
                  <li>اختر التاريخ والوقت المناسبين قبل إتمام العملية.</li>
                  <li>عند اختيار خدمة منزلية، تأكد من كتابة العنوان كاملًا.</li>
                </ul>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
