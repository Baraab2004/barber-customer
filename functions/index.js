const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendBarberNotification = onRequest({ cors: true }, async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      booking_date,
      booking_time,
      service_name,
      is_home_service,
      address,
    } = req.body;

    const html = `
      <div dir="rtl" style="font-family: Arial;">
        <h2>حجز جديد 💈</h2>
        <p><b>الاسم:</b> ${customer_name}</p>
        <p><b>الهاتف:</b> ${customer_phone}</p>
        <p><b>الخدمة:</b> ${service_name}</p>
        <p><b>التاريخ:</b> ${booking_date}</p>
        <p><b>الوقت:</b> ${booking_time}</p>
        <p><b>النوع:</b> ${is_home_service ? "منزلي" : "داخل الصالون"}</p>
        ${is_home_service ? `<p><b>العنوان:</b> ${address}</p>` : ""}
      </div>
    `;

    const result = await resend.emails.send({
      from: "Salon <onboarding@resend.dev>",
      to: ["alhayyatb@gmail.com"],
      subject: "حجز جديد",
      html,
    });

    res.json({ success: true, result });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: err.message });
  }
});