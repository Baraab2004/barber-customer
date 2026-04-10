import emailjs from "@emailjs/browser";

const PUBLIC_KEY = "WyJ8eLp0fg3eNS2YB";
const SERVICE_ID = "service_eb7evrm";
const TEMPLATE_ID = "template_14dzx1e";

emailjs.init({
  publicKey: PUBLIC_KEY,
});

export async function sendBarberNotificationEmail(payload: {
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  service_name: string;
  is_home_service: boolean;
  address?: string | null;
}) {
  console.log("EmailJS config in use:", {
    serviceId: SERVICE_ID,
    templateId: TEMPLATE_ID,
    publicKey: PUBLIC_KEY,
  });

  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    {
      customer_name: payload.customer_name,
      customer_phone: payload.customer_phone,
      booking_date: payload.booking_date,
      booking_time: payload.booking_time,
      service_name: payload.service_name,
      booking_type: payload.is_home_service ? "خدمة منزلية" : "داخل الصالون",
      address: payload.is_home_service ? payload.address || "غير متوفر" : "داخل الصالون",
    },
    PUBLIC_KEY
  );
}
