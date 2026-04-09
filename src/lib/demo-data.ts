import type { Barber, Booking, Service } from "@/lib/app-types";

const BARBERS_KEY = "barbershop_barbers";
const SERVICES_KEY = "barbershop_services";
const BOOKINGS_KEY = "barbershop_bookings";

const defaultBarbers: Barber[] = [
  {
    id: "barber-1",
    name: "أحمد الشمري",
    phone: "0501234567",
    speciality: "قص شعر كلاسيكي",
    is_active: true,
    experience: "5 سنوات",
    created_at: new Date().toISOString(),
  },
  {
    id: "barber-2",
    name: "محمد العتيبي",
    phone: "0507654321",
    speciality: "تصفيف لحية",
    is_active: true,
    experience: "7 سنوات",
    created_at: new Date().toISOString(),
  },
  {
    id: "barber-3",
    name: "خالد القحطاني",
    phone: "0509876543",
    speciality: "صبغة وعناية",
    is_active: true,
    experience: "4 سنوات",
    created_at: new Date().toISOString(),
  },
];

const defaultServices: Service[] = [
  {
    id: "service-1",
    name: "قص شعر",
    description: "قص شعر احترافي مع تصفيف",
    price: 50,
    duration_minutes: 40,
    created_at: new Date().toISOString(),
  },
  {
    id: "service-2",
    name: "حلاقة لحية",
    description: "تشذيب وتصفيف اللحية",
    price: 30,
    duration_minutes: 30,
    created_at: new Date().toISOString(),
  },
  {
    id: "service-3",
    name: "صبغة شعر",
    description: "صبغة شعر بألوان متعددة",
    price: 120,
    duration_minutes: 60,
    created_at: new Date().toISOString(),
  },
  {
    id: "service-4",
    name: "عناية بالبشرة",
    description: "تنظيف وترطيب البشرة",
    price: 80,
    duration_minutes: 45,
    created_at: new Date().toISOString(),
  },
  {
    id: "service-5",
    name: "باكج كامل",
    description: "قص شعر + لحية + عناية بالبشرة",
    price: 150,
    duration_minutes: 90,
    created_at: new Date().toISOString(),
  },
];

function read<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getDemoBarbers() {
  return read(BARBERS_KEY, defaultBarbers);
}

export function getDemoServices() {
  return read(SERVICES_KEY, defaultServices);
}

export function getDemoBookings() {
  return read<Booking[]>(BOOKINGS_KEY, []);
}

export function setDemoBookings(bookings: Booking[]) {
  write(BOOKINGS_KEY, bookings);
}
