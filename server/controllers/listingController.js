const Listing = require('../models/Listing');
const User = require('../models/User');

// Tüm ilanları getir
exports.getAllListings = async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = { status: 'active' };
    
    if (category) {
      query.category = category;
    }
    
    if (status && req.user && req.user.isAdmin) {
      query.status = status;
    }
    
    const listings = await Listing.find(query)
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Sadece aktif ilanları getir
exports.getActiveListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: 'active' })
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// İlan detayı getir
exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('owner', 'name companyInfo')
      .populate('category', 'name')
      .populate('bids.bidder', 'name companyInfo.companyName');
    
    if (!listing) {
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // Eski veritabanı kayıtları için items alanını oluştur
    if (!listing.items || !Array.isArray(listing.items) || listing.items.length === 0) {
      // Eğer quantity ve unit alanları varsa, bunları kullanarak bir öğe oluştur
      if (listing.quantity !== undefined && listing.unit) {
        listing.items = [{
          name: listing.title || 'Ürün',
          quantity: listing.quantity,
          unit: listing.unit,
          description: listing.description || ''
        }];
        
        // Eğer gerçek bir veritabanı kaydıysa, güncelle
        if (!req.query.noUpdate) {
          try {
            await Listing.findByIdAndUpdate(listing._id, { items: listing.items });
            console.log(`İlan güncellendi ${listing._id}: items alanı eklendi`);
          } catch (updateError) {
            console.error('İlan güncellenirken hata:', updateError);
          }
        }
      } else {
        listing.items = []; // Bilgi yoksa boş dizi
      }
    }
    
    res.json(listing);
  } catch (error) {
    console.error('İlan detayı getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Yeni ilan oluştur
exports.createListing = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      quantity, 
      unit, 
      initialMaxPrice, 
      images,
      items,
      location,
      expiresAt
    } = req.body;
    
    // Kullanıcı onaylanmış mı kontrol et
    const user = await User.findById(req.user._id);
    if (!user.isApproved) {
      return res.status(403).json({ message: 'Firma onaylanmadı. İlan oluşturmak için firma onayı gerekiyor.' });
    }
    
    // İlan verilerini hazırla
    let listingData = {
      title,
      description,
      category,
      owner: req.user._id,
      initialMaxPrice,
      currentPrice: initialMaxPrice,
      images: images || [],
      location: location || '',
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 6 * 60 * 60 * 1000) // Parametre gelmediyse 6 saat sonra
    };
    
    // İlan öğelerini (items) kontrol et ve ekle
    if (items && Array.isArray(items) && items.length > 0) {
      // Öğeleri doğrula ve dönüştür
      const validItems = items.map(item => ({
        name: item.name || title, // İsim yoksa ilan başlığını kullan
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'Adet',
        description: item.description || ''
      }));
      
      // Toplam miktarı hesapla (geriye dönük uyumluluk için)
      const totalQuantity = validItems.reduce((sum, item) => sum + item.quantity, 0);
      
      listingData.items = validItems;
      listingData.quantity = totalQuantity;
      listingData.unit = validItems[0].unit;
    } else {
      // İlan öğeleri gönderilmemişse, quantity ve unit kullanarak bir öğe oluştur
      const defaultItem = {
        name: title, // İlan başlığını kullan
        quantity: quantity || 1,
        unit: unit || 'Adet',
        description: description || ''
      };
      
      listingData.items = [defaultItem];
      listingData.quantity = quantity || 1;
      listingData.unit = unit || 'Adet';
    }
    
    const newListing = new Listing(listingData);
    await newListing.save();
    
    // İlanı populate et ve socket üzerinden gönder
    const populatedListing = await Listing.findById(newListing._id)
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name');
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      global.io.emit('listingCreated', populatedListing);
    }
    
    res.status(201).json({ message: 'İlan başarıyla oluşturuldu', listing: newListing });
  } catch (error) {
    console.error('İlan oluşturma hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// İlan güncelle
exports.updateListing = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      quantity, 
      unit,
      initialMaxPrice,
      images 
    } = req.body;
    
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // İlanın sahibi mi kontrol et
    if (listing.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    // Teklifler varsa güncelleme yapılmasın
    if (listing.bids.length > 0) {
      return res.status(400).json({ message: 'Bu ilana teklif verilmiş, artık güncellenemez' });
    }
    
    listing.title = title || listing.title;
    listing.description = description || listing.description;
    listing.category = category || listing.category;
    listing.quantity = quantity || listing.quantity;
    listing.unit = unit || listing.unit;
    
    if (initialMaxPrice) {
      listing.initialMaxPrice = initialMaxPrice;
      listing.currentPrice = initialMaxPrice;
    }
    
    if (images) {
      listing.images = images;
    }
    
    await listing.save();
    
    // Güncellenmiş ilanı populate et
    const updatedListing = await Listing.findById(listing._id)
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name');
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      global.io.emit('listingUpdated', updatedListing);
    }
    
    res.json({ message: 'İlan başarıyla güncellendi', listing });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// İlan sil
exports.deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // İlanın sahibi mi veya admin mi kontrol et
    if (listing.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    // Teklifler varsa silme işlemi yapılmasın (sadece iptal edilebilir)
    if (listing.bids.length > 0 && !req.user.isAdmin) {
      return res.status(400).json({ message: 'Bu ilana teklif verilmiş, artık silinemez. İlanı iptal edebilirsiniz.' });
    }
    
    const listingId = req.params.id;
    await Listing.findByIdAndDelete(listingId);
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      global.io.emit('listingDeleted', { listingId });
    }
    
    res.json({ message: 'İlan başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// İlanı iptal et
exports.cancelListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // İlanın sahibi mi kontrol et
    if (listing.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    listing.status = 'cancelled';
    await listing.save();
    
    // Güncellenmiş ilanı populate et
    const updatedListing = await Listing.findById(listing._id)
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name');
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      global.io.emit('listingUpdated', updatedListing);
    }
    
    res.json({ message: 'İlan başarıyla iptal edildi', listing });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// İlana teklif ver
exports.placeBid = async (req, res) => {
  try {
    const { price } = req.body;
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // İlan aktif mi kontrol et
    if (listing.status !== 'active') {
      return res.status(400).json({ message: 'Bu ilan aktif değil, teklif verilemez' });
    }
    
    // Süresi dolmuş mu kontrol et
    if (new Date(listing.expiresAt) < new Date()) {
      listing.status = 'expired';
      await listing.save();
      return res.status(400).json({ message: 'Bu ilanın süresi dolmuş, teklif verilemez' });
    }
    
    // Firma onaylanmış mı kontrol et
    const user = await User.findById(req.user._id);
    if (!user.isApproved) {
      return res.status(403).json({ message: 'Firma onaylanmadı. Teklif vermek için firma onayı gerekiyor.' });
    }
    
    // Kendi ilanına teklif vermeye çalışıyor mu kontrol et
    if (listing.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Kendi ilanınıza teklif veremezsiniz' });
    }
    
    const currentLowestBid = listing.getCurrentLowestBid();
    
    // İlk teklif için maksimum fiyat kontrolü
    if (!currentLowestBid && price > listing.initialMaxPrice) {
      return res.status(400).json({ 
        message: `Teklif, başlangıç maksimum fiyatından (${listing.initialMaxPrice}) yüksek olamaz` 
      });
    }
    
    // Mevcut tekliften en az %5 düşük olmalı
    if (currentLowestBid && price > currentLowestBid.price * 0.95) {
      return res.status(400).json({ 
        message: `Teklifiniz, mevcut en düşük tekliften (${currentLowestBid.price}) en az %5 daha düşük olmalıdır` 
      });
    }
    
    // Teklifi ekle
    const success = listing.placeBid(req.user._id, price);
    
    if (!success) {
      return res.status(400).json({ message: 'Teklif kriterlere uygun değil' });
    }
    
    await listing.save();
    
    // Kullanıcı bilgilerini dahil ederek güncel teklif bilgisini döndür
    const updatedListing = await Listing.findById(req.params.id)
      .populate('bids.bidder', 'name companyInfo.companyName')
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name');
    
    const newBid = updatedListing.bids[updatedListing.bids.length - 1];
    
    // Socket.io ile teklif bildirimi gönder
    if (global.io) {
      global.io.emit('bidUpdate', { 
        listing: updatedListing,
        bid: newBid
      });
    }
    
    res.json({ 
      message: 'Teklif başarıyla verildi', 
      listing: updatedListing,
      bid: newBid
    });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// İlanı tamamla (alıcı tarafından onaylama)
exports.completeListing = async (req, res) => {
  try {
    const { accept } = req.body;
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // İlanın sahibi mi kontrol et
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    // İlan aktif mi ve teklifler var mı kontrol et
    if (listing.status !== 'active' || listing.bids.length === 0) {
      return res.status(400).json({ message: 'Bu ilan aktif değil veya henüz teklif yok' });
    }
    
    if (accept) {
      const winningBid = listing.getCurrentLowestBid();
      listing.status = 'completed';
      listing.winner = winningBid.bidder;
    } else {
      listing.status = 'cancelled';
    }
    
    await listing.save();
    
    // Güncellenmiş ilanı populate et
    const updatedListing = await Listing.findById(listing._id)
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name')
      .populate('bids.bidder', 'name companyInfo.companyName')
      .populate('winner', 'name companyInfo.companyName');
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      global.io.emit('listingUpdated', updatedListing);
    }
    
    const message = accept 
      ? 'İlan başarıyla tamamlandı ve teklif kabul edildi' 
      : 'İlan iptal edildi ve teklifler reddedildi';
    
    res.json({ message, listing });
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Kullanıcının kendi ilanlarını getir
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user._id })
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Kullanıcının teklif verdiği ilanları getir
exports.getMyBids = async (req, res) => {
  try {
    const listings = await Listing.find({ 'bids.bidder': req.user._id })
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name')
      .sort({ 'bids.createdAt': -1 });
    
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
}; 