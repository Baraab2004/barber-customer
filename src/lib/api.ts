import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  runTransaction,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import {
  getDemoBarbers,
  getDemoBookings,
  getDemoServices,
  setDemoBookings,
} from "@/lib/demo-data";
import type { Barber, Booking, BookingInsert, Service } from "@/lib/app-types";

function mapBookingRelations(bookings: Booking[], barbers: Barber[], services: Service[]) {
  return bookings.map((booking) => ({
    ...booking,
    barbers: { name: barbers.find((b) => b.id === booking.barber_id)?.name ?? "غير محدد" },
    services: {
      name: services.find((s) => s.id === booking.service_id)?.name ?? "غير محدد",
      price: services.find((s) => s.id === booking.service_id)?.price ?? 0,
    },
  }));
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addMinutes(time: string, duration: number) {
  return minutesToTime(timeToMinutes(time) + duration);
}

export function hasTimeOverlap(
  startA: string,
  durationA: number,
  startB: string,
  durationB: number
) {
  const aStart = timeToMinutes(startA);
  const aEnd = aStart + durationA;

  const bStart = timeToMinutes(startB);
  const bEnd = bStart + durationB;

  return aStart < bEnd && bStart < aEnd;
}

function buildBookingId(barberId: string, date: string, time: string) {
  const normalizedTime = time.slice(0, 5).replace(":", "-");
  return `${barberId}_${date}_${normalizedTime}`;
}

async function getServiceDuration(serviceId: string): Promise<number> {
  const fallbackServices = getDemoServices();
  const fallbackService = fallbackServices.find((s) => s.id === serviceId);
  const fallbackDuration = Number(fallbackService?.duration ?? 30);

  if (!isFirebaseConfigured || !db) {
    return fallbackDuration;
  }

  const serviceSnap = await getDoc(doc(db, "services", serviceId));
  if (!serviceSnap.exists()) return fallbackDuration;

  const data = serviceSnap.data() as Service;
  return Number(data.duration ?? 30);
}

function getActiveBookingDuration(booking: Partial<Booking>) {
  return Number(booking.duration ?? 30);
}

function isBookingActiveForAvailability(booking: Partial<Booking>) {
  return booking.status === "confirmed" || booking.status === "in_progress";
}

export async function getBarbers(): Promise<Barber[]> {
  if (!isFirebaseConfigured || !db) {
    return getDemoBarbers().filter((b) => b.is_active !== false);
  }

  const snap = await getDocs(
    query(collection(db, "barbers"), where("is_active", "!=", false))
  );

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Barber));
}

export async function getServices(): Promise<Service[]> {
  if (!isFirebaseConfigured || !db) return getDemoServices();

  const snap = await getDocs(collection(db, "services"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
}

export async function getBookedSlots(barberId: string, date: string): Promise<string[]> {
  const allCandidateSlots: string[] = [];

  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 10) {
      allCandidateSlots.push(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      );
    }
  }

  const collectBlockedSlots = (bookings: Partial<Booking>[]) => {
    const blocked = new Set<string>();

    bookings
      .filter(
        (b) =>
          b.barber_id === barberId &&
          b.booking_date === date &&
          isBookingActiveForAvailability(b) &&
          typeof b.booking_time === "string"
      )
      .forEach((booking) => {
        const duration = getActiveBookingDuration(booking);

        allCandidateSlots.forEach((slot) => {
          if (hasTimeOverlap(slot, 10, booking.booking_time as string, duration)) {
            blocked.add(slot);
          }
        });
      });

    return Array.from(blocked).sort((a, b) => a.localeCompare(b));
  };

  if (!isFirebaseConfigured || !db) {
    return collectBlockedSlots(getDemoBookings());
  }

  const q = query(
    collection(db, "bookings"),
    where("barber_id", "==", barberId),
    where("booking_date", "==", date)
  );

  const snap = await getDocs(q);
  const bookings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Booking));
  return collectBlockedSlots(bookings);
}

export async function createBooking(payload: BookingInsert) {
  const normalizedTime = payload.booking_time.slice(0, 5);
  const duration = await getServiceDuration(payload.service_id);
  const end_time = addMinutes(normalizedTime, duration);

  const finalPayload = {
    ...payload,
    booking_time: normalizedTime,
    duration,
    end_time,
  };

  const bookingId = buildBookingId(
    finalPayload.barber_id,
    finalPayload.booking_date,
    finalPayload.booking_time
  );

  if (!isFirebaseConfigured || !db) {
    const current = getDemoBookings();

    const exists = current.some(
      (b) =>
        b.barber_id === finalPayload.barber_id &&
        b.booking_date === finalPayload.booking_date &&
        isBookingActiveForAvailability(b) &&
        hasTimeOverlap(
          finalPayload.booking_time,
          duration,
          b.booking_time.slice(0, 5),
          getActiveBookingDuration(b)
        )
    );

    if (exists) {
      const error = new Error("SLOT_ALREADY_BOOKED");
      error.name = "SlotAlreadyBooked";
      throw error;
    }

    current.push({
      id: bookingId,
      ...finalPayload,
      status: "confirmed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Booking);

    setDemoBookings(current);
    return;
  }

  const dayBookingsQuery = query(
    collection(db, "bookings"),
    where("barber_id", "==", finalPayload.barber_id),
    where("booking_date", "==", finalPayload.booking_date)
  );

  await runTransaction(db, async (transaction) => {
    const dayBookingsSnap = await transaction.get(dayBookingsQuery);

    const exists = dayBookingsSnap.docs.some((bookingDoc) => {
      const booking = bookingDoc.data() as Booking;

      if (!isBookingActiveForAvailability(booking)) return false;
      if (typeof booking.booking_time !== "string") return false;

      return hasTimeOverlap(
        finalPayload.booking_time,
        duration,
        booking.booking_time.slice(0, 5),
        getActiveBookingDuration(booking)
      );
    });

    if (exists) {
      const error = new Error("SLOT_ALREADY_BOOKED");
      error.name = "SlotAlreadyBooked";
      throw error;
    }

    const bookingRef = doc(db, "bookings", bookingId);

    transaction.set(bookingRef, {
      ...finalPayload,
      status: "confirmed",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  });
}

export async function getAllConfirmedBookings() {
  const [barbers, services] = await Promise.all([getBarbers(), getServices()]);

  if (!isFirebaseConfigured || !db) {
    const bookings = getDemoBookings()
      .filter((b) => {
        if (b.status === "confirmed") return true;

        if (b.status === "in_progress") {
          if (!b.service_ends_at) return false;
          return new Date(b.service_ends_at).getTime() > Date.now();
        }

        return false;
      })
      .sort((a, b) =>
        `${a.booking_date} ${a.booking_time}`.localeCompare(
          `${b.booking_date} ${b.booking_time}`
        )
      );

    return mapBookingRelations(bookings, barbers, services);
  }

  const snap = await getDocs(collection(db, "bookings"));
  const bookings = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Booking))
    .filter((b) => {
      if (b.status === "confirmed") return true;

      if (b.status === "in_progress") {
        if (!b.service_ends_at) return false;
        return new Date(b.service_ends_at).getTime() > Date.now();
      }

      return false;
    })
    .sort((a, b) =>
      `${a.booking_date} ${a.booking_time}`.localeCompare(
        `${b.booking_date} ${b.booking_time}`
      )
    );

  return mapBookingRelations(bookings, barbers, services);
}

export async function searchBookingsByPhone(search: string) {
  const [barbers, services] = await Promise.all([getBarbers(), getServices()]);

  const searchValue = search.trim().toLowerCase();

  if (!isFirebaseConfigured || !db) {
    const bookings = getDemoBookings()
      .filter((b) => {
        const matchesSearch =
          b.customer_phone.includes(searchValue) ||
          b.customer_name.toLowerCase().includes(searchValue);

        if (!matchesSearch) return false;

        if (b.status === "confirmed") return true;

        if (b.status === "in_progress") {
          if (!b.service_ends_at) return false;
          return new Date(b.service_ends_at).getTime() > Date.now();
        }

        return false;
      })
      .sort((a, b) =>
        `${a.booking_date} ${a.booking_time}`.localeCompare(
          `${b.booking_date} ${b.booking_time}`
        )
      );

    return mapBookingRelations(bookings, barbers, services);
  }

  const snap = await getDocs(collection(db, "bookings"));

  const bookings = snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Booking))
    .filter((b) => {
      const matchesSearch =
        b.customer_phone.includes(searchValue) ||
        b.customer_name.toLowerCase().includes(searchValue);

      if (!matchesSearch) return false;

      if (b.status === "confirmed") return true;

      if (b.status === "in_progress") {
        if (!b.service_ends_at) return false;
        return new Date(b.service_ends_at).getTime() > Date.now();
      }

      return false;
    })
    .sort((a, b) =>
      `${a.booking_date} ${a.booking_time}`.localeCompare(
        `${b.booking_date} ${b.booking_time}`
      )
    );

  return mapBookingRelations(bookings, barbers, services);
}

export async function cancelBooking(id: string) {
  if (!isFirebaseConfigured || !db) {
    const current = getDemoBookings();
    const idx = current.findIndex((b) => b.id === id);

    if (idx >= 0) {
      current[idx] = {
        ...current[idx],
        status: "cancelled",
        updated_at: new Date().toISOString(),
      };
      setDemoBookings(current);
    }
    return;
  }

  await updateDoc(doc(db, "bookings", id), {
    status: "cancelled",
    updated_at: serverTimestamp(),
  });
}

export async function seedFirebaseIfEmpty() {
  if (!isFirebaseConfigured || !db) return;

  const [barbersSnap, servicesSnap] = await Promise.all([
    getDocs(collection(db, "barbers")),
    getDocs(collection(db, "services")),
  ]);

  if (barbersSnap.empty) {
    await Promise.all(
      getDemoBarbers().map(({ id, ...barber }) =>
        addDoc(collection(db, "barbers"), barber)
      )
    );
  }

  if (servicesSnap.empty) {
    await Promise.all(
      getDemoServices().map(({ id, ...service }) =>
        addDoc(collection(db, "services"), service)
      )
    );
  }
}

export async function getBooking(id: string) {
  if (!isFirebaseConfigured || !db) {
    return getDemoBookings().find((b) => b.id === id) ?? null;
  }

  const snap = await getDoc(doc(db, "bookings", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null;
}
