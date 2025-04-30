/**
 * İlanlar için migrasyon scripti
 * 
 * Bu script, eski veritabanı kayıtlarını yeni şemaya uygun hale getirir.
 * Özellikle items alanı olmayan ilanlar için items alanı oluşturur.
 * 
 * Kullanım: 
 * node scripts/migrateListings.js
 */

const mongoose = require('mongoose');
const Listing = require('../models/Listing');
require('dotenv').config();

/**
 * MongoDB bağlantısı kur
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Veritabanı bağlantısı başarılı');
    return true;
  } catch (error) {
    console.error('Veritabanı bağlantı hatası:', error);
    return false;
  }
};

/**
 * İlan kayıtlarını migrate et
 */
const migrateListings = async () => {
  try {
    // Items alanı olmayan ilanları bul
    const listings = await Listing.find({
      $or: [
        { items: { $exists: false } },
        { items: { $size: 0 } },
        { items: null }
      ]
    });
    
    console.log(`Toplam ${listings.length} adet güncellenecek ilan bulundu`);
    
    // Sayaçlar
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    
    // Her bir ilanı işle
    for (const listing of listings) {
      try {
        // Gerekli bilgiler var mı kontrol et
        if (listing.quantity !== undefined && listing.unit) {
          // Yeni items alanı oluştur
          const items = [{
            name: listing.title || 'Ürün',
            quantity: listing.quantity,
            unit: listing.unit,
            description: listing.description || ''
          }];
          
          // Veritabanını güncelle
          await Listing.findByIdAndUpdate(listing._id, { items });
          
          console.log(`İlan güncellendi: ${listing._id} (${listing.title})`);
          updated++;
        } else {
          console.log(`İlan atlandı (eksik bilgi): ${listing._id} (${listing.title})`);
          skipped++;
        }
      } catch (error) {
        console.error(`İlan güncellenirken hata: ${listing._id}`, error);
        failed++;
      }
    }
    
    // Özet bilgileri göster
    console.log('\nMigrasyon tamamlandı:');
    console.log(`- Toplam İlan: ${listings.length}`);
    console.log(`- Güncellenen: ${updated}`);
    console.log(`- Atlanan: ${skipped}`);
    console.log(`- Başarısız: ${failed}`);
    
  } catch (error) {
    console.error('Migrasyon sırasında hata oluştu:', error);
  } finally {
    // Bağlantıyı kapat
    try {
      await mongoose.connection.close();
      console.log('Veritabanı bağlantısı kapatıldı');
    } catch (err) {
      console.error('Veritabanı bağlantısı kapatılırken hata:', err);
    }
  }
};

// Ana fonksiyon
const main = async () => {
  const connected = await connectDB();
  if (connected) {
    try {
      await migrateListings();
      console.log('İşlem tamamlandı!');
      process.exit(0);
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      process.exit(1);
    }
  } else {
    console.error('Veritabanına bağlanılamadı, işlem iptal edildi.');
    process.exit(1);
  }
};

// Scripti çalıştır
main(); 