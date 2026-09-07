import mongoose from 'mongoose';
import { Document } from 'mongoose';

export interface ILocation extends Document {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [Longitude, Latitude]
  };
  createdAt: Date;
  updatedAt: Date;
}
const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, 'يرجى إدخال عنوان العقار']
  },
  city: {
    type: String,
    required: [true, 'يرجى إدخال اسم المدينة']
  },
  state: {
    type: String,
    required: [true, 'يرجى إدخال الولاية أو المحافظة']
  },
  country: {
    type: String,
    required: [true, 'يرجى إدخال الدولة']
  },
  postalCode: {
    type: String,
    required: [true, 'يرجى إدخال الرمز البريدي']
  },
  // 🗺️ هذا هو الجزء الخاص بـ Mapbox والإحداثيات الجغرافية (GeoJSON)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    // الترتيب العالمي المعياري في GeoJSON هو: [خط الطول Longitude، دائرة العرض Latitude]
    coordinates: {
      type: [Number], // مصفوفة أرقام [lng, lat]
      required: [true, 'يجب توفير الإحداثيات الجغرافية للخريطة']
    }
  }
}, {
  timestamps: true // لتسجيل وقت الإنشاء والتحديث تلقائياً
});

// هذا الفهرس ضروري جداً عندما تريد لاحقاً البحث عن العقارات القريبة من نقطة معينة على خريطة Mapbox
locationSchema.index({ location: '2dsphere' });

const Location = mongoose.model('Location', locationSchema);
export default Location;