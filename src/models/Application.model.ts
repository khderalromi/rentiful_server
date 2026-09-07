import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    applicationDate: {
      type: Date,
      default: Date.now,
      //required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled", "completed"],
      default: "pending",
      //required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    lease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lease",
      default: null, // في البداية، لا يوجد عقد مرتبط بالطلب
    },
  },
  {
    timestamps: true, // يضيف حقول createdAt و updatedAt تلقائياً
  },
);


applicationSchema.pre('save', async function(this:any) {
  // this تشير إلى وثيقة الحجز الحالية التي يحاول المستخدم إنشاءها
  
  // نقوم بالبحث عن أي حجز موجود مسبقاً لنفس الطبيب في نفس التاريخ والوقت، وبحالة مؤكدة
  const existingApplication = await this.constructor.findOne({
    tenant: this.tenant,
    property: this.property,
    status: 'confirmed'
  });

  if (existingApplication) {
    throw new Error('هذا الطلب محجوز مسبقاً، يرجى اختيار عقار آخر.');  }

});


const Application = mongoose.model("Application", applicationSchema);
export default Application;
