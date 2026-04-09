export interface Barber {
  id: string;
  name: string;
  phone?: string | null;
  speciality?: string | null;
  avatar_url?: string | null;
  is_active?: boolean;
  experience?: string | null;
  created_at?: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  created_at?: string;
}

export interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  is_home_service: boolean;
  address?: string | null;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;

  service_started_at?: string;
  service_ends_at?: string;

  barbers?: {
    name: string;
  };

  services?: {
    name: string;
    price: number;
  };
}
export type BookingStatus = |"pending"| "confirmed"| "in_progress"| "completed"| "cancelled";
export interface BookingInsert {
  customer_name: string;
  customer_phone: string;
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  is_home_service: boolean;
  address?: string | null;
  payment_method?: "visa" | "cash";
}
