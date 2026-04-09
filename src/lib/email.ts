import emailjs from "@emailjs/browser";

emailjs.init({
  publicKey: "WyJ8eLp0fg3eNS2YB",
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
    serviceId: "service_eb7evrm",
    templateId: "template_ar4ajnk",
    publicKey: "-INSB9tSvgBaD5XWa",
  });

  return emailjs.send("service_eb7evrm", "template_ar4ajnk", {
    customer_name: payload.customer_name,
    customer_phone: payload.customer_phone,
    booking_date: payload.booking_date,
    booking_time: payload.booking_time,
    service_name: payload.service_name,
    booking_type: payload.is_home_service ? "خدمة منزلية" : "داخل الصالون",
    address: payload.is_home_service ? payload.address || "غير متوفر" : "داخل الصالون",
  });
}