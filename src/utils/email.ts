import nodemailer from 'nodemailer';

const sendEmail = async (options: { email: any; subject: any; message: any; }) => {
  // 1) إنشاء الـ Transporter (المولد الموصل)
  const transporter = nodemailer.createTransport({
    host: String(process.env.EMAIL_HOST),
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  } as nodemailer.TransportOptions);

  // 2) تحديد خيارات الإرسال (Email Options)
  const mailOptions = {
    from: `Medical Center Management <${process.env.EMAIL_FROM}>`,
    to: options.email,        // البريد المستهدف
    subject: options.subject,  // عنوان الرسالة
    text: options.message      // نص الرسالة (ويمكن استخدام html لاحقاً)
    // html: ...
  };

  // 3) إرسال الإيميل فعلياً
  // دالة sendMail تعيد Promise بشكل تلقائي، لذا نستخدم await
  await transporter.sendMail(mailOptions);
};

export default sendEmail;