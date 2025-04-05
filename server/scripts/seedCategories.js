const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../models/Category');

// Çevresel değişkenleri yükle
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Eklenecek kategoriler
const categories = [
  {
    name: 'Hırdavat/Nalbur',
    description: 'İş aletleri, donanım malzemeleri ve ev tamir ürünleri',
    icon: 'https://cdn-icons-png.flaticon.com/512/2947/2947656.png'
  },
  {
    name: 'Elektrik',
    description: 'Elektrik malzemeleri, kablolar, aydınlatma ve elektrik donanımları',
    icon: 'https://cdn-icons-png.flaticon.com/512/2947/2947969.png'
  },
  {
    name: 'Oto Parça',
    description: 'Otomobil ve araç parçaları, aksesuar ve yedek parçalar',
    icon: 'https://cdn-icons-png.flaticon.com/512/3774/3774278.png'
  },
  {
    name: 'Ahşap',
    description: 'Ahşap ürünler, kereste ve mobilya malzemeleri',
    icon: 'https://cdn-icons-png.flaticon.com/512/2537/2537535.png'
  },
  {
    name: 'Boya',
    description: 'İç ve dış cephe boyaları, tinerler, fırçalar ve boya ekipmanları',
    icon: 'https://cdn-icons-png.flaticon.com/512/1648/1648768.png'
  },
  {
    name: 'Tesisat',
    description: 'Su tesisatı, sıhhi tesisat malzemeleri ve ekipmanları',
    icon: 'https://cdn-icons-png.flaticon.com/512/1791/1791961.png'
  },
  {
    name: 'Giyim',
    description: 'Tekstil ürünleri, kumaşlar ve giyim malzemeleri',
    icon: 'https://cdn-icons-png.flaticon.com/512/863/863684.png'
  },
  {
    name: 'Gıda',
    description: 'Gıda hammaddeleri, katkı maddeleri ve ambalaj malzemeleri',
    icon: 'https://cdn-icons-png.flaticon.com/512/1147/1147805.png'
  },
  {
    name: 'Kırtasiye',
    description: 'Ofis ve kırtasiye malzemeleri, yazı gereçleri',
    icon: 'https://cdn-icons-png.flaticon.com/512/2541/2541988.png'
  },
  // Yeni eklenen kategoriler
  {
    name: 'İnşaat Malzemeleri',
    description: 'Çimento, kum, tuğla, beton, demir, çelik gibi inşaat için temel malzemeler',
    icon: 'https://cdn-icons-png.flaticon.com/512/1669/1669341.png'
  },
  {
    name: 'Tarım ve Bahçecilik',
    description: 'Tohum, fide, gübre, sulama ekipmanları, tarımsal ekipmanlar',
    icon: 'https://cdn-icons-png.flaticon.com/512/862/862039.png'
  },
  {
    name: 'Medikal ve Laboratuvar',
    description: 'Tıbbi malzemeler, laboratuvar ekipmanları, test kitleri, koruyucu ekipmanlar',
    icon: 'https://cdn-icons-png.flaticon.com/512/2376/2376100.png'
  },
  {
    name: 'Temizlik ve Hijyen',
    description: 'Kurumsal temizlik malzemeleri, dezenfektanlar, hijyen ürünleri',
    icon: 'https://cdn-icons-png.flaticon.com/512/995/995053.png'
  }
];

// MongoDB'ye bağlan
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('MongoDB bağlantısı başarılı');
  
  try {
    // Mevcut kategorileri kontrol et
    for (const category of categories) {
      const existingCategory = await Category.findOne({ name: category.name });
      
      if (existingCategory) {
        console.log(`"${category.name}" kategorisi zaten mevcut, güncelleniyor...`);
        
        // Mevcut kategoriyi güncelle
        await Category.findByIdAndUpdate(existingCategory._id, {
          description: category.description,
          icon: category.icon,
          isActive: true
        });
      } else {
        console.log(`"${category.name}" kategorisi oluşturuluyor...`);
        
        // Yeni kategori oluştur
        const newCategory = new Category(category);
        await newCategory.save();
      }
    }
    
    console.log('Kategori ekleme işlemi başarıyla tamamlandı');
    process.exit(0);
  } catch (error) {
    console.error('Kategori ekleme hatası:', error);
    process.exit(1);
  }
})
.catch((err) => {
  console.error('MongoDB bağlantı hatası:', err);
  process.exit(1);
}); 