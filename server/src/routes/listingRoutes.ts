import express from 'express';
import { authenticateUser as auth } from '../middleware/auth';
import { Listing } from '../models/Listing';
import { Category } from '../models/Category';
import mongoose from 'mongoose';

const router = express.Router();

// İlan durumunu kontrol et ve güncelle
const checkAndUpdateListingStatus = async (listing) => {
  if (listing.status === 'active') {
    const now = new Date();
    
    // Son teklif kontrolü
    if (listing.bids && listing.bids.length > 0) {
      // En son teklifi al
      const latestBid = listing.bids.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })[0];
      
      // Son tekliften bu yana 6 saat geçti mi kontrol et
      const latestBidTime = new Date(latestBid.createdAt);
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      const bidExpiryTime = new Date(latestBidTime.getTime() + sixHoursInMs);
      
      if (now > bidExpiryTime) {
        console.log(`Son teklifin süresi doldu, ilan güncelleniyor: ${listing._id}`);
        listing.status = 'ended';
        await listing.save();
        return listing;
      }
    }
    
    // Hiç teklif yoksa veya teklif süresi dolmamışsa,
    // normal bitiş tarihini kontrol et
    const endDate = new Date(listing.endDate);
    
    if (now > endDate) {
      console.log(`İlan süresi doldu, güncelleniyor: ${listing._id}`);
      listing.status = 'ended';
      await listing.save();
    }
  }
  return listing;
};

// Tüm ilanları getir
router.get('/', async (req, res) => {
  try {
    // Sorgu parametrelerini al
    const { status, category, owner } = req.query;
    
    // Filtre oluştur
    const filter: any = {};
    
    // Status filtresi
    if (status) {
      filter.status = status;
    }
    
    // Kategori filtresi
    if (category) {
      filter.category = category;
    }
    
    // Sahip filtresi
    if (owner) {
      filter.seller = owner;
    }
    
    const listings = await Listing.find(filter)
      .populate('seller', 'username email')
      .populate('category', 'name')
      .sort({ createdAt: -1 });
      
    // İlanların durumlarını kontrol et ve güncelle
    const updatedListings = await Promise.all(
      listings.map(listing => checkAndUpdateListingStatus(listing))
    );
      
    return res.json(updatedListings);
  } catch (err) {
    console.error('İlanları getirme hatası:', err);
    return res.status(500).json({ error: 'İlanları getirme hatası' });
  }
});

// Yeni ilan oluştur
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      startingPrice,
      initialMaxPrice,
      endDate,
      expiresAt,
      location,
      items,
      images,
      unit,
      quantity
    } = req.body;

    // Gerekli alanları kontrol et
    if (!title || !description || !category || !startingPrice) {
      return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun' });
    }

    // Kategori ID'sinin geçerli olup olmadığını kontrol et
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ error: 'Geçersiz kategori ID' });
    }

    // Kategorinin veritabanında var olup olmadığını kontrol et
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: 'Belirtilen kategori bulunamadı' });
    }

    // Bitiş tarihini kontrol et ve şu anki tarihten sonra olmasını sağla
    let parsedEndDate = new Date(endDate);
    if (isNaN(parsedEndDate.getTime()) || parsedEndDate <= new Date()) {
      // Varsayılan olarak 1 hafta sonra
      parsedEndDate = new Date();
      parsedEndDate.setDate(parsedEndDate.getDate() + 7);
    }

    // Başlangıç fiyatını sayıya dönüştür
    const numericStartingPrice = parseFloat(startingPrice.toString());
    if (isNaN(numericStartingPrice) || numericStartingPrice <= 0) {
      return res.status(400).json({ error: 'Geçerli bir başlangıç fiyatı girin' });
    }

    // Yeni ilan oluştur
    const listing = new Listing({
      title,
      description,
      category,
      startingPrice: numericStartingPrice,
      currentPrice: numericStartingPrice, // Başlangıçta aynı
      initialMaxPrice: initialMaxPrice || numericStartingPrice, // Eğer belirtilmemişse başlangıç fiyatını kullan
      endDate: parsedEndDate,
      expiresAt: expiresAt ? new Date(expiresAt) : parsedEndDate, // expiresAt belirtilmemişse endDate kullan
      location,
      items: items || [],
      images: images || [],
      unit: unit || 'Adet',
      quantity: quantity || 1,
      seller: req.user.id,
      status: 'active',
      bids: []
    });

    await listing.save();

    // Oluşturulan ilanı populate et ve geri döndür
    const populatedListing = await Listing.findById(listing._id)
      .populate('seller', 'username email')
      .populate('category', 'name');

    return res.status(201).json(populatedListing);
  } catch (err) {
    console.error('İlan oluşturma hatası:', err);
    return res.status(500).json({ error: 'İlan oluşturma hatası' });
  }
});

// ID'ye göre ilan detaylarını getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ID'nin geçerli olup olmadığını kontrol et
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz ilan ID' });
    }
    
    let listing = await Listing.findById(id)
      .populate('seller', 'username email')
      .populate('category', 'name')
      .populate({
        path: 'bids',
        populate: {
          path: 'user',
          select: 'username email'
        }
      });
      
    if (!listing) {
      return res.status(404).json({ error: 'İlan bulunamadı' });
    }
    
    // İlan durumunu kontrol et ve güncelle
    listing = await checkAndUpdateListingStatus(listing);
    
    return res.json(listing);
  } catch (err) {
    console.error('İlan detaylarını getirme hatası:', err);
    return res.status(500).json({ error: 'İlan detaylarını getirme hatası' });
  }
});

// ID'ye göre ilan güncelle
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // ID'nin geçerli olup olmadığını kontrol et
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz ilan ID' });
    }
    
    // İlanın var olup olmadığını kontrol et
    const listing = await Listing.findById(id);
    
    if (!listing) {
      return res.status(404).json({ error: 'İlan bulunamadı' });
    }
    
    // Sadece ilan sahibi güncelleyebilir
    if ((listing as any).seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    
    // Kategori güncellendi ise geçerliliğini kontrol et
    if (updates.category && !mongoose.Types.ObjectId.isValid(updates.category)) {
      return res.status(400).json({ error: 'Geçersiz kategori ID' });
    }
    
    // Bitiş tarihi güncellendi ise geçerliliğini kontrol et
    if (updates.endDate) {
      const parsedEndDate = new Date(updates.endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return res.status(400).json({ error: 'Geçerli bir bitiş tarihi girin' });
      }
      updates.endDate = parsedEndDate;
    }
    
    // Başlangıç fiyatı güncellendi ise geçerliliğini kontrol et
    if (updates.startingPrice) {
      const numericStartingPrice = parseFloat(updates.startingPrice.toString());
      if (isNaN(numericStartingPrice) || numericStartingPrice <= 0) {
        return res.status(400).json({ error: 'Geçerli bir başlangıç fiyatı girin' });
      }
      updates.startingPrice = numericStartingPrice;
    }
    
    // İlanı güncelle
    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate('seller', 'username email')
      .populate('category', 'name');
      
    return res.json(updatedListing);
  } catch (err) {
    console.error('İlan güncelleme hatası:', err);
    return res.status(500).json({ error: 'İlan güncelleme hatası' });
  }
});

// ID'ye göre ilan sil
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // ID'nin geçerli olup olmadığını kontrol et
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz ilan ID' });
    }
    
    // İlanın var olup olmadığını kontrol et
    const listing = await Listing.findById(id);
    
    if (!listing) {
      return res.status(404).json({ error: 'İlan bulunamadı' });
    }
    
    // Sadece ilan sahibi silebilir
    if ((listing as any).seller.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    
    await Listing.findByIdAndDelete(id);
    
    return res.json({ message: 'İlan başarıyla silindi' });
  } catch (err) {
    console.error('İlan silme hatası:', err);
    return res.status(500).json({ error: 'İlan silme hatası' });
  }
});

// İlana teklif ver
router.post('/:id/bid', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    // ID'nin geçerli olup olmadığını kontrol et
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Geçersiz ilan ID' });
    }
    
    // Teklif miktarını kontrol et
    if (!amount) {
      return res.status(400).json({ error: 'Teklif miktarı belirtilmelidir' });
    }
    
    const numericAmount = parseFloat(amount.toString());
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Geçerli bir teklif miktarı girin' });
    }
    
    // İlanın var olup olmadığını kontrol et
    const listing = await Listing.findById(id);
    
    if (!listing) {
      return res.status(404).json({ error: 'İlan bulunamadı' });
    }
    
    // İlanın aktif olup olmadığını kontrol et
    if (listing.status !== 'active') {
      return res.status(400).json({ error: 'Bu ilana artık teklif verilemez' });
    }
    
    // Bitiş tarihinin geçip geçmediğini kontrol et
    if (new Date() > new Date(listing.endDate)) {
      return res.status(400).json({ error: 'İlan süresi dolmuş, teklif verilemez' });
    }
    
    // Kendimize ait ilana teklif veremeyiz
    if ((listing as any).seller.toString() === req.user.id) {
      return res.status(400).json({ error: 'Kendi ilanınıza teklif veremezsiniz' });
    }
    
    // Teklif miktarı, mevcut fiyattan düşük olmalı (ters açık artırma)
    if (numericAmount >= listing.currentPrice) {
      return res.status(400).json({ error: 'Teklif miktarı mevcut fiyattan düşük olmalıdır' });
    }
    
    // 6 saat sonrası için son geçerlilik tarihi
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6);
    
    // Yeni teklifi ekle
    const bid = {
      user: req.user.id,
      amount: numericAmount,
      timestamp: new Date()
    };
    
    listing.bids.push(bid);
    
    // Güncel fiyatı güncelle
    listing.currentPrice = numericAmount;
    
    // İlanı güncelle
    await listing.save();
    
    // Güncellenmiş ilanı populate et ve geri döndür
    const updatedListing = await Listing.findById(id)
      .populate('seller', 'username email')
      .populate('category', 'name')
      .populate({
        path: 'bids',
        populate: {
          path: 'user',
          select: 'username email'
        }
      });
      
    return res.json(updatedListing);
  } catch (err) {
    console.error('Teklif verme hatası:', err);
    return res.status(500).json({ error: 'Teklif verme hatası' });
  }
});

// Aktif ilanları getir (son eklenenler önce)
router.get('/status/active', async (req, res) => {
  try {
    // Önce tüm "active" ilanları getir
    let activeListings = await Listing.find({ status: 'active' })
      .populate('seller', 'username email')
      .populate('category', 'name')
      .sort({ createdAt: -1 });
      
    // İlanların durumlarını kontrol et ve süresi dolmuş olanları güncelle
    activeListings = await Promise.all(
      activeListings.map(listing => checkAndUpdateListingStatus(listing))
    );
    
    // Sadece hala aktif olanları filtrele
    activeListings = activeListings.filter(listing => listing.status === 'active');
      
    return res.json(activeListings);
  } catch (err) {
    console.error('Aktif ilanları getirme hatası:', err);
    return res.status(500).json({ error: 'Aktif ilanları getirme hatası' });
  }
});

export default router; 