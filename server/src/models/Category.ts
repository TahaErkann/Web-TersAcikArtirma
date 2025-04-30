import mongoose, { Document, Schema } from 'mongoose';

// Kategori için interface tanımı
export interface ICategory extends Document {
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Kategori için şema tanımı
const CategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
  icon: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Model oluşturma ve dışa aktarma
export const Category = mongoose.model<ICategory>('Category', CategorySchema); 