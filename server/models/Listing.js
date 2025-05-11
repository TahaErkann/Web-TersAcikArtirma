const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Teklif şeması - hem yeni teklif formatını (user/amount) hem de eski formatı (bidder/price) destekle
const BidSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  bidder: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  amount: {
    type: Number
  },
  price: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  }
}, { timestamps: true });

// Şema kaydedilmeden önce, bidder/price ve user/amount alanlarının uyumlu olmasını sağla
BidSchema.pre('save', function(next) {
  // Eğer bidder varsa ama user yoksa, bidder'ı user'a kopyala
  if (this.bidder && !this.user) {
    this.user = this.bidder;
  }
  // Eğer user varsa ama bidder yoksa, user'ı bidder'a kopyala
  else if (this.user && !this.bidder) {
    this.bidder = this.user;
  }
  
  // Eğer price varsa ama amount yoksa, price'ı amount'a kopyala
  if (this.price !== undefined && this.amount === undefined) {
    this.amount = this.price;
  }
  // Eğer amount varsa ama price yoksa, amount'ı price'a kopyala
  else if (this.amount !== undefined && this.price === undefined) {
    this.price = this.amount;
  }
  
  next();
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
  try {
    console.log(`placeBid - UserId: ${userId}, Price: ${price}`);
    
    // Mevcut en düşük teklifi bul
    const currentLowestBid = this.getCurrentLowestBid();
    console.log('placeBid - Mevcut en düşük teklif:', currentLowestBid);
    
    // Eğer hiç teklif yoksa
    if (!currentLowestBid) {
      console.log('İlk teklif veriliyor...');
      // Hem eski hem de yeni formatta teklif ekle
      const newBid = {
        user: userId,
        bidder: userId,
        amount: price,
        price: price,
        timestamp: new Date(),
        status: 'pending',
        isApproved: false,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 saat geçerli
      };
      
      console.log('placeBid - Eklenen yeni teklif:', newBid);
      this.bids.push(newBid);
      
      this.currentPrice = price;
      this.expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 saat ekle
      
      return true;
    }
    
    // Mevcut en düşük teklifin tutarını belirle (amount veya price kullan)
    const currentLowestPrice = currentLowestBid.amount !== undefined 
      ? currentLowestBid.amount 
      : (currentLowestBid.price !== undefined ? currentLowestBid.price : Number.MAX_VALUE);
    
    console.log(`Mevcut en düşük teklif tutarı: ${currentLowestPrice}, Yeni teklif: ${price}`);
    
    // Minimum teklif tutarını hesapla - mevcut en düşük teklifin %5 altı
    const minimumRequiredDiscount = currentLowestPrice * 0.95;
    console.log(`Minimum gereken teklif tutarı (mevcut * 0.95): ${minimumRequiredDiscount}`);
    
    // Yeni teklif, mevcut en düşük tekliften en az %5 düşük mü?
    if (price <= minimumRequiredDiscount) {
      console.log('Yeni teklif yeterince düşük, kabul ediliyor...');
      
      // Hem eski hem de yeni formatta teklif ekle
      const newBid = {
        user: userId,
        bidder: userId,
        amount: price,
        price: price,
        timestamp: new Date(),
        status: 'pending',
        isApproved: false,
        expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 saat geçerli
      };
      
      console.log('placeBid - Eklenen yeni teklif:', newBid);
      this.bids.push(newBid);
      
      this.currentPrice = price;
      this.expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 saat ekle
      
      return true;
    }
    
    console.log(`Teklif reddedildi: Yeni teklif (${price}), minimum gereken tutardan (${minimumRequiredDiscount}) yüksek!`);
    return false;
  } catch (error) {
    console.error('placeBid fonksiyonunda hata:', error);
    return false;
  }
};

// En düşük teklifi getiren fonksiyon
ListingSchema.methods.getCurrentLowestBid = function() {
  try {
    if (!this.bids || this.bids.length === 0) {
      return null;
    }
    
    // Hem price hem de amount alanlarını kontrol et
    return this.bids.reduce((lowest, bid) => {
      // Önce tekliflerin geçerli bir değeri olduğundan emin ol
      const bidAmount = bid.amount !== undefined ? bid.amount : bid.price;
      const lowestAmount = lowest.amount !== undefined ? lowest.amount : lowest.price;
      
      if (bidAmount === undefined && lowestAmount === undefined) {
        return lowest; // İkisi de tanımsızsa, ilkini döndür
      }
      
      if (bidAmount === undefined) {
        return lowest; // Eğer yeni teklifte tutar yoksa, mevcut en düşüğü döndür
      }
      
      if (lowestAmount === undefined) {
        return bid; // Eğer mevcut en düşükte tutar yoksa, yeni teklifi döndür
      }
      
      // İkisinde de tutar varsa, karşılaştır
      return (bidAmount < lowestAmount) ? bid : lowest;
    }, this.bids[0]);
  } catch (error) {
    console.error('getCurrentLowestBid fonksiyonunda hata:', error);
    return null;
  }
};

module.exports = mongoose.model('Listing', ListingSchema);