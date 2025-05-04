import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

export interface IBid {
  user: IUser['_id'];
  amount: number;
  timestamp: Date;
}

export interface IListing extends Document {
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  endDate: Date;
  expiresAt?: Date;
  status: 'active' | 'ended' | 'cancelled';
  seller: IUser['_id'];
  bids: IBid[];
  images: string[];
  category: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  startingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'ended', 'cancelled'],
    default: 'active',
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bids: [bidSchema],
  images: [{
    type: String,
  }],
  category: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export const Listing = mongoose.model<IListing>('Listing', listingSchema); 