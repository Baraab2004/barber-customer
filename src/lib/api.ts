import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  runTransaction,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { getDemoBarbers, getDemoBookings, getDemoServices, setDemoBookings } from "@/lib/demo-data";
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

export async function getBarbers(): Promise<Barber[]> {
  if (!isFirebaseConfigured || !db) return getDemoBarbers().filter((b) => b.is_active !== false);
  const snap = await getDocs(query(collection(db, "barbers"), where("is_active", "!=", false)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Barber));
}

export async function getServices(): Promise<Service[]> {
  if (!isFirebaseConfigured || !db) return getDemoServices();
  const snap = await getDocs(collection(db, "services"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));
}

export async function getBookedSlots(barberId: string, date: string): Promise<string[]> {
  if (!isFirebaseConfigured || !db) {
    return getDemoBookings()
      .filter((b) => b.barber_id === barberId && b.booking_date === date && b.status === "confirmed")
      .map((b) => b.booking_time);
  }
  const q = query(
    collection(db, "bookings"),
    where("barber_id", "==", barberId),
    where("booking_date", "==", date),
    where("status", "==", "confirmed"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => (d.data().booking_time as string) || "");
}

function buildBookingId(barberId: string, date: string, time: string) {
  const normalizedTime = time.slice(0, 5).replace(":", "-");
  return `${barberId}_${date}_${normalizedTime}`;
}

export async function createBooking(payload: BookingInsert) {
  const normalizedTime = payload.booking_time.slice(0, 5);

  const finalPayload = {
    ...payload,
    booking_time: normalizedTime,
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
        b.booking_time.slice(0, 5) === finalPayload.booking_time &&
        b.status === "confirmed"
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
    });

    setDemoBookings(current);
    return;
  }

  const bookingRef = doc(db, "bookings", bookingId);

  await runTransaction(db, async (transaction) => {
    const existingSnap = await transaction.get(bookingRef);

    if (existingSnap.exists()) {
      const error = new Error("SLOT_ALREADY_BOOKED");
      error.name = "SlotAlreadyBooked";
      throw error;
    }

    transaction.set(bookingRef, {
      ...finalPayload,
      status: "confirmed" ,
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
      current[idx] = { ...current[idx], status: "cancelled", updated_at: new Date().toISOString() };
      setDemoBookings(current);
    }
    return;
  }
  await updateDoc(doc(db, "bookings", id), { status: "cancelled", updated_at: serverTimestamp() });
}

export async function seedFirebaseIfEmpty() {
  if (!isFirebaseConfigured || !db) return;
  const [barbersSnap, servicesSnap] = await Promise.all([
    getDocs(collection(db, "barbers")),
    getDocs(collection(db, "services")),
  ]);

  if (barbersSnap.empty) {
    await Promise.all(getDemoBarbers().map(({ id, ...barber }) => addDoc(collection(db, "barbers"), barber)));
  }
  if (servicesSnap.empty) {
    await Promise.all(getDemoServices().map(({ id, ...service }) => addDoc(collection(db, "services"), service)));
  }
}

export async function getBooking(id: string) {
  if (!isFirebaseConfigured || !db) {
    return getDemoBookings().find((b) => b.id === id) ?? null;
  }
  const snap = await getDoc(doc(db, "bookings", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null;
}