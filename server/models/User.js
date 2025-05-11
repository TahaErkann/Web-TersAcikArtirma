const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const UserSchema = new Schema({
  // googleId artık zorunlu değil ama veritabanındaki indeks için tutuyoruz
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  // Bireysel kullanıcı bilgileri
  phone: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  // Firma bilgileri
  companyInfo: {
    companyName: {
      type: String
    },
    address: {
      type: String
    },
    city: {
      type: String
    },
    phone: {
      type: String
    },
    taxNumber: {
      type: String
    },
    description: {
      type: String
    }
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isRejected: {
    type: Boolean,
    default: false
  },
  rejectionReason: {
    type: String
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

// Şifre karşılaştırma metodu
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Kayıt öncesi şifre hashleme
UserSchema.pre('save', async function(next) {
  // Şifre değişmediyse hash işlemini atlama
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', UserSchema); 