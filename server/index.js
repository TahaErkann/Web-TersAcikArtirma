require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

// Çevresel değişkenleri yükle
console.log('Çevre değişkenleri yükleniyor...');
const envPath = path.resolve(__dirname, '.env');
console.log('.env dosya yolu:', envPath);
dotenv.config({ path: envPath }); 

// .env dosyasını doğrudan okuyalım
try {
  if (fs.existsSync(envPath)) {
    console.log('.env dosyası bulundu');
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('.env içeriğinin ilk 20 karakteri:', envContent.substring(0, 20));
    
    // Manuel olarak değerleri okutalım
    const envLines = envContent.split('\n');
    const envValues = {};
    envLines.forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && !key.startsWith('#')) {
          envValues[key] = value;
          process.env[key] = value;
        }
      }
    });
    
    console.log('Okunan değerler:', Object.keys(envValues));
  } else {
    console.log('.env dosyası bulunamadı!');
  }
} catch (error) {
  console.error('.env dosyasını okurken hata:', error);
}

console.log('MONGODB_URI:', process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.substring(0, 30) + '...' : 'Tanımsız');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Tanımlı' : 'Tanımsız');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',  // Tüm kaynaklara izin ver
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB Bağlantı Seçenekleri
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4 // IPv4 kullan
};

// MongoDB Bağlantısı
const dbUri = process.env.MONGODB_URI;
console.log('MongoDB bağlantısı kuruluyor:', dbUri ? dbUri.substring(0, 30) + '...' : 'Tanımsız');

if (!dbUri) {
  console.error('HATA: MONGODB_URI tanımlı değil! Bağlantı yapılamaz.');
  console.error('MONGODB_URI tanımlı mı kontrol et! process.env içeriği:', Object.keys(process.env));
} else {
  mongoose.connect(dbUri, mongooseOptions)
    .then(() => {
      console.log('MongoDB bağlantısı başarılı');
    })
    .catch(err => {
      console.error('MongoDB bağlantı hatası:', err);
    });
}

// MongoDB bağlantı durumu izleyicileri
mongoose.connection.on('connected', () => {
  console.log('Mongoose bağlantısı kuruldu');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose bağlantı hatası:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose bağlantısı kesildi');
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose bağlantısı kapatıldı');
  process.exit(0);
});

// Rotaları içe aktar
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/categories', require('./routes/categories'));

// Socket.io
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı');
  
  // Kullanıcı kimlik doğrulama
  socket.on('authenticate', (data) => {
    try {
      const { token } = data;
      if (token) {
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.join(`user_${decoded.userId}`);
        console.log(`Kullanıcı kimlik doğrulandı: ${decoded.userId}`);
        socket.emit('authenticated', { success: true });
      }
    } catch (error) {
      console.error('Kimlik doğrulama hatası:', error);
      socket.emit('authenticated', { success: false, error: 'Kimlik doğrulama hatası' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Bir kullanıcı ayrıldı');
  });
  
  // Teklif güncelleme event'i
  socket.on('newBid', (data) => {
    io.emit('bidUpdate', data);
  });
  
  // İlan süresi güncelleme event'i
  socket.on('expiryUpdate', (data) => {
    io.emit('listingExpiry', data);
  });
  
  // Yeni ilan oluşturulma event'i
  socket.on('newListing', (data) => {
    io.emit('listingCreated', data);
  });
  
  // İlan güncelleme event'i
  socket.on('updateListing', (data) => {
    io.emit('listingUpdated', data);
  });

  // İlan silme event'i
  socket.on('deleteListing', (data) => {
    io.emit('listingDeleted', data);
  });
  
  // Kategori güncelleme event'i
  socket.on('categoryUpdate', (data) => {
    io.emit('categoryChanged', data);
  });
});

// Global SocketIO nesnesi
global.io = io;

// Üretim ortamında statik dosyaları sunma
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// 404 durumu için
app.use((req, res) => {
  res.status(404).json({ message: 'Sayfa bulunamadı' });
});

// Global hata yakalayıcı
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Sunucu hatası', error: err.message });
});

// Port
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 