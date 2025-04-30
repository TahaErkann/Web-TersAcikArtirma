const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BidSchema = new Schema({
  bidder: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// İlan içindeki her bir ürün için şema
const ListingItemSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
});

const ListingSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Ürün listesi - detaylı bilgi için
  items: [ListingItemSchema],
  // Toplam miktar bilgisi - geriye dönük uyumluluk için
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  initialMaxPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number
  },
  images: [{
    type: String
  }],
  bids: [BidSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Teklif verme fonksiyonu
ListingSchema.methods.placeBid = function(userId, price) {
  const currentLowestBid = this.getCurrentLowestBid();
  
  // Eğer mevcut teklif yoksa veya yeni teklif mevcut tekliften en az %5 düşük ise
  if (!currentLowestBid || price <= currentLowestBid.price * 0.95) {
    this.bids.push({
      bidder: userId,
      price: price
    });
    
    this.currentPrice = price;
    this.expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 saat ekle
    
    return true;
  }
  
  return false;
};

// En düşük teklifi getiren fonksiyon
ListingSchema.methods.getCurrentLowestBid = function() {
  if (this.bids.length === 0) {
    return null;
  }
  
  return this.bids.reduce((lowest, bid) => {
    return (bid.price < lowest.price) ? bid : lowest;
  }, this.bids[0]);
};

module.exports = mongoose.model('Listing', ListingSchema); 