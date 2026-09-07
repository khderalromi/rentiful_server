class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // استدعاء مشيّد الكلاس الأصلي Error وتمرير رسالة الخطأ له
        this.statusCode = statusCode;
        // إذا كان الكود يبدأ بـ 4 (مثل 400 أو 404) فالحالة fail (خطأ من العميل)، وإذا كان 500 فالحالة error (خطأ سيرفر)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // نحدد أن هذا الخطأ "تشغيلي" (Operational Error)، يعني خطأ متوقع يمكن التعامل معه وليس عطلاً فادحاً في السيرفر
        this.isOperational = true;
        // للحفاظ على تتبع الأخطاء (Stack Trace) ونظافته دون إظهار سطر استدعاء هذا الكلاس نفسه بداخل الـ Stack
        Error.captureStackTrace(this, this.constructor);
    }
}
export default AppError;
//# sourceMappingURL=appError.js.map