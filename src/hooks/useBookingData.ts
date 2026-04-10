import { useQuery } from "@tanstack/react-query";
import {
  getAllConfirmedBookings,
  getBarbers,
  getBookedSlots,
  getServices,
  searchBookingsByPhone,
} from "@/lib/api";

export function useBarbers() {
  return useQuery({
    queryKey: ["barbers"],
    queryFn: getBarbers,
  });
}

export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
}

export function useBookedSlots(
  barberId: string | null,
  date: string | null,
  requestedDuration: number | null
) {
  return useQuery({
    queryKey: ["booked-slots", barberId, date, requestedDuration],
    queryFn: async () => {
      if (!barberId || !date || !requestedDuration) return [];
      return getBookedSlots(barberId, date, requestedDuration);
    },
    enabled: !!barberId && !!date && !!requestedDuration,
    refetchInterval: 5000,
  });
}

export function useMyBookings(search: string) {
  return useQuery({
    queryKey: ["my-bookings", search],
    queryFn: async () => {
      if (!search) return [];
      return searchBookingsByPhone(search);
    },
    enabled: !!search,
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useAllBookings() {
  return useQuery({
    queryKey: ["dashboard-bookings"],
    queryFn: getAllConfirmedBookings,
    refetchInterval: 5000,
  });
}
