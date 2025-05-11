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
    const { fullDetails } = req.query;
    console.log(`getListingById çağrıldı - ID: ${req.params.id}, fullDetails: ${fullDetails}`);
    
    let populateOptions = {
      owner: 'name companyInfo',
      category: 'name'
    };
    
    // Tam detay isteniyorsa, teklif veren kullanıcıları daha detaylı getir
    if (fullDetails === 'true') {
      console.log("Tam detay modu aktif - tüm kullanıcı bilgileri dahil edilecek");
      populateOptions.owner = 'name email phone address companyInfo';
      populateOptions['bids.user'] = 'name email phone address companyInfo';
      populateOptions['bids.bidder'] = 'name email phone address companyInfo';
    } else {
      populateOptions['bids.user'] = 'name companyInfo.companyName';
      populateOptions['bids.bidder'] = 'name companyInfo.companyName';
    }
    
    // Populate işlemini dinamik olarak yapılandır
    const populateArray = Object.keys(populateOptions).map(path => ({
      path,
      select: populateOptions[path]
    }));
    
    console.log("Populate konfigürasyonu:", JSON.stringify(populateArray, null, 2));
    
    const listing = await Listing.findById(req.params.id).populate(populateArray);
    
    if (!listing) {
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // Debug için - populate işlemi doğru çalışıyor mu kontrol
    const bidCount = listing.bids ? listing.bids.length : 0;
    console.log(`İlan yüklendi - ID: ${listing._id}, Teklif sayısı: ${bidCount}`);
    
    if (fullDetails === 'true' && bidCount > 0) {
      console.log("Tam detay modunda bid bilgileri kontrol ediliyor");
      // Kabul edilmiş teklifleri kontrol et
      const acceptedBids = listing.bids.filter(bid => bid.status === 'accepted' || bid.isApproved === true);
      
      if (acceptedBids.length > 0) {
        console.log(`${acceptedBids.length} kabul edilmiş teklif bulundu.`);
        
        // Tüm kabul edilmiş teklifleri detaylı olarak logla
        acceptedBids.forEach(bid => {
          console.log(`Kabul edilmiş teklif bilgileri, ID: ${bid._id}`);
          
          if (bid.bidder) {
            if (typeof bid.bidder === 'object') {
              console.log("Teklif veren bilgileri (bidder):", {
                name: bid.bidder.name,
                email: bid.bidder.email || 'Yok',
                phone: bid.bidder.phone || 'Yok',
                address: bid.bidder.address || 'Yok',
                hasCompanyInfo: bid.bidder.companyInfo ? true : false
              });
            } else {
              console.log("Teklif veren (bidder) referans olarak geliyor:", bid.bidder);
            }
          }
          
          if (bid.user) {
            if (typeof bid.user === 'object') {
              console.log("Teklif veren bilgileri (user):", {
                name: bid.user.name,
                email: bid.user.email || 'Yok',
                phone: bid.user.phone || 'Yok',
                address: bid.user.address || 'Yok',
                hasCompanyInfo: bid.user.companyInfo ? true : false
              });
            } else {
              console.log("Teklif veren (user) referans olarak geliyor:", bid.user);
            }
          }
        });
      }
    }
    
    res.json(listing);
  } catch (error) {
    console.error('İlan detayı hatası:', error);
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
    const { price, amount } = req.body;
    
    console.log('Teklif verilmeye çalışılıyor:');
    console.log('Request body:', req.body);
    console.log('İlan ID:', req.params.id);
    console.log('User ID:', req.user._id);
    
    // Her iki alanı da kontrol ederek teklifin hangi parametre ile geldiğini anlayalım
    const bidAmount = amount !== undefined ? amount : price;
    
    console.log('İşlenecek teklif miktarı:', bidAmount);
    
    if (bidAmount === undefined) {
      console.log('HATA: Teklif miktarı belirtilmemiş!');
      return res.status(400).json({ message: 'Teklif miktarı (price veya amount) belirtilmelidir' });
    }
    
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      console.log('HATA: İlan bulunamadı!');
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    console.log('İlan bilgileri:', {
      id: listing._id,
      title: listing.title,
      status: listing.status,
      currentPrice: listing.currentPrice,
      expiresAt: listing.expiresAt,
      bidsCount: listing.bids ? listing.bids.length : 0
    });
    
    // İlan aktif mi kontrol et
    if (listing.status !== 'active') {
      console.log(`HATA: İlan aktif değil, durumu: ${listing.status}`);
      return res.status(400).json({ message: 'Bu ilan aktif değil, teklif verilemez' });
    }
    
    // Süresi dolmuş mu kontrol et
    if (new Date(listing.expiresAt) < new Date()) {
      console.log('HATA: İlanın süresi dolmuş!');
      listing.status = 'expired';
      await listing.save();
      return res.status(400).json({ message: 'Bu ilanın süresi dolmuş, teklif verilemez' });
    }
    
    // Firma onaylanmış mı kontrol et
    const user = await User.findById(req.user._id);
    if (!user.isApproved) {
      console.log('HATA: Firma onaylanmamış!');
      return res.status(403).json({ message: 'Firma onaylanmadı. Teklif vermek için firma onayı gerekiyor.' });
    }
    
    // Kendi ilanına teklif vermeye çalışıyor mu kontrol et
    if (listing.owner.toString() === req.user._id.toString()) {
      console.log('HATA: Kullanıcı kendi ilanına teklif vermeye çalışıyor!');
      return res.status(400).json({ message: 'Kendi ilanınıza teklif veremezsiniz' });
    }
    
    const currentLowestBid = listing.getCurrentLowestBid();
    console.log('Mevcut en düşük teklif:', currentLowestBid);
    
    // İlk teklif için maksimum fiyat kontrolü
    if (!currentLowestBid && bidAmount > listing.initialMaxPrice) {
      console.log(`HATA: Teklif (${bidAmount}), başlangıç maksimum fiyatından (${listing.initialMaxPrice}) yüksek!`);
      return res.status(400).json({ 
        message: `Teklif, başlangıç maksimum fiyatından (${listing.initialMaxPrice}) yüksek olamaz` 
      });
    }
    
    // Mevcut tekliften en az %5 düşük olmalı
    if (currentLowestBid && bidAmount > currentLowestBid.amount * 0.95) {
      console.log(`HATA: Teklif (${bidAmount}), mevcut en düşük tekliften (${currentLowestBid.amount * 0.95}) düşük değil!`);
      return res.status(400).json({ 
        message: `Teklifiniz, mevcut en düşük tekliften (${currentLowestBid.amount}) en az %5 daha düşük olmalıdır` 
      });
    }
    
    // Yeni bir teklif geldiğinde tüm mevcut tekliflerin durumunu sıfırla
    // Hiçbir koşula bağlı olmadan - herhangi bir yeni teklif, tüm mevcut teklifleri geçersiz kılacak
    if (listing.bids && listing.bids.length > 0) {
      console.log('Yeni teklif geldi, mevcut teklifler kontrol ediliyor...');
      
      // Yeni teklif tutarı, daha önceki tüm tekliflerin durumlarını belirleyecek
      listing.bids.forEach(bid => {
        // Teklif tutarını belirle (amount veya price kullan)
        const bidAmount = bid.amount !== undefined ? bid.amount : bid.price;
        
        if (bidAmount !== undefined) {
          // Yeni teklif gelenden daha pahalı olan teklifleri otomatik reddet
          if (bidAmount > price) {
            console.log(`Teklif ${bid._id} otomatik reddediliyor (${bidAmount} > ${price})`);
            bid.status = 'rejected'; // Daha yüksek teklifleri otomatik reddet
            bid.isApproved = false;
          } 
          // Yeni teklifle aynı veya daha düşük ise pending yap
          else if (bidAmount >= price) {
            console.log(`Teklif ${bid._id} beklemede (${bidAmount} >= ${price})`);
            bid.status = 'pending';
            bid.isApproved = false;
          }
        }
      });
      
      // Değişiklikleri kaydedelim
      await listing.save();
      console.log('Tüm tekliflerin durumları güncellendi ve kaydedildi.');
    }
    
    // Teklifi ekle
    console.log(`Teklif ekleniyor: User=${req.user._id}, Amount=${bidAmount}`);
    const success = listing.placeBid(req.user._id, bidAmount);
    
    if (!success) {
      console.log('HATA: Teklif eklenemedi!');
      return res.status(400).json({ message: 'Teklif kriterlere uygun değil' });
    }
    
    console.log('Listing güncelleniyor...');
    await listing.save();
    
    // Kullanıcı bilgilerini dahil ederek güncel teklif bilgisini döndür
    console.log('Güncellenmiş ilanı getirme...');
    const updatedListing = await Listing.findById(req.params.id)
      .populate('bids.user', 'name companyInfo.companyName')
      .populate('bids.bidder', 'name companyInfo.companyName')
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name');
    
    const newBid = updatedListing.bids[updatedListing.bids.length - 1];
    console.log('Yeni teklif:', newBid);
    
    // Socket.io ile teklif bildirimi gönder
    if (global.io) {
      console.log('Socket.io üzerinden bildirim gönderiliyor...');
      global.io.emit('bidUpdate', { 
        listing: updatedListing,
        bid: newBid
      });
    }
    
    console.log('Teklif başarılı, yanıt dönülüyor...');
    res.json({ 
      message: 'Teklif başarıyla verildi', 
      listing: updatedListing,
      bid: newBid
    });
  } catch (error) {
    console.error('Teklif verme sırasında hata oluştu:', error);
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
      listing.winner = winningBid.user;
    } else {
      listing.status = 'cancelled';
    }
    
    await listing.save();
    
    // Güncellenmiş ilanı populate et
    const updatedListing = await Listing.findById(listing._id)
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name')
      .populate('bids.user', 'name companyInfo.companyName')
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
    const listings = await Listing.find({ 'bids.user': req.user._id })
      .populate('owner', 'name companyInfo.companyName')
      .populate('category', 'name')
      .sort({ 'bids.timestamp': -1 });
    
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Teklifi kabul et
exports.acceptBid = async (req, res) => {
  try {
    const listingId = req.params.id;
    const bidId = req.params.bidId;
    
    // İlanı ve teklifleri bul
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // İlan sahibi mi kontrol et
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    // Teklifi bul
    const bidIndex = listing.bids.findIndex(bid => bid._id.toString() === bidId);
    
    if (bidIndex === -1) {
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    
    const bid = listing.bids[bidIndex];
    
    // Teklif zaten onaylanmış mı kontrol et
    if (bid.status === 'accepted') {
      return res.status(400).json({ message: 'Bu teklif zaten kabul edilmiş' });
    }
    
    // Teklif zaten reddedilmiş mi kontrol et
    if (bid.status === 'rejected') {
      return res.status(400).json({ message: 'Bu teklif zaten reddedilmiş' });
    }
    
    // Teklifin en düşük teklif olup olmadığını kontrol et
    const lowestBid = listing.getCurrentLowestBid();
    
    if (!lowestBid) {
      return res.status(400).json({ message: 'İlanda geçerli teklif bulunamadı' });
    }
    
    // Onaylanmak istenen teklif en düşük teklif değilse hata döndür
    if (lowestBid._id.toString() !== bidId) {
      return res.status(400).json({ 
        message: 'Sadece en düşük teklifi onaylayabilirsiniz. Bu teklif en düşük teklif değil.' 
      });
    }
    
    // Tüm tekliflerin durumlarını güncelle
    const lowestPrice = lowestBid.amount !== undefined ? lowestBid.amount : lowestBid.price;
    
    listing.bids.forEach(existingBid => {
      // Teklif tutarını belirle (amount veya price kullan)
      const bidAmount = existingBid.amount !== undefined ? existingBid.amount : existingBid.price;
      
      if (existingBid._id.toString() !== bidId) {
        // Daha yüksek fiyat teklifleri otomatik olarak reddedilir
        if (bidAmount > lowestPrice) {
          existingBid.status = 'rejected';
          existingBid.isApproved = false;
        } 
        // Eşit veya daha düşük fiyat teklifleri (çok nadir bir durum) beklemede olur
        else {
          existingBid.status = 'pending';
          existingBid.isApproved = false;
        }
      }
    });
    
    // Seçilen teklifi kabul et
    listing.bids[bidIndex].status = 'accepted';
    listing.bids[bidIndex].isApproved = true;
    
    await listing.save();
    
    // Güncellenmiş ilanı tam detaylarla populate yaparak döndür
    const updatedListing = await Listing.findById(listing._id)
      .populate('owner', 'name email phone address companyInfo')
      .populate('category', 'name')
      .populate({
        path: 'bids.user',
        select: 'name email phone address companyInfo'
      })
      .populate({
        path: 'bids.bidder',
        select: 'name email phone address companyInfo'
      });
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      // Güvenlik için kullanıcı bilgilerini filtreleyerek gönder
      const filteredListing = {
        ...updatedListing.toObject(),
        bids: updatedListing.bids.map(bid => ({
          ...bid,
          user: typeof bid.user === 'object' ? {
            _id: bid.user._id,
            name: bid.user.name,
            companyInfo: bid.user.companyInfo ? {
              companyName: bid.user.companyInfo.companyName
            } : undefined
          } : bid.user,
          bidder: typeof bid.bidder === 'object' ? {
            _id: bid.bidder._id,
            name: bid.bidder.name,
            companyInfo: bid.bidder.companyInfo ? {
              companyName: bid.bidder.companyInfo.companyName
            } : undefined
          } : bid.bidder
        }))
      };
      
      global.io.emit('bidUpdate', { 
        listing: filteredListing,
        message: 'Bir teklif kabul edildi'
      });
    }
    
    res.json(updatedListing);
  } catch (error) {
    console.error('Teklif kabul hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

// Teklifi reddet
exports.rejectBid = async (req, res) => {
  try {
    const listingId = req.params.id;
    const bidId = req.params.bidId;
    
    // İlanı ve teklifleri bul
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // İlan sahibi mi kontrol et
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    // Teklifi bul
    const bidIndex = listing.bids.findIndex(bid => bid._id.toString() === bidId);
    
    if (bidIndex === -1) {
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    
    const bid = listing.bids[bidIndex];
    
    // Teklif zaten onaylanmış mı kontrol et
    if (bid.status === 'accepted') {
      return res.status(400).json({ message: 'Bu teklif zaten kabul edilmiş ve reddedilemez' });
    }
    
    // Teklif zaten reddedilmiş mi kontrol et
    if (bid.status === 'rejected') {
      return res.status(400).json({ message: 'Bu teklif zaten reddedilmiş' });
    }
    
    // Teklifin en düşük teklif olup olmadığını kontrol et
    const lowestBid = listing.getCurrentLowestBid();
    
    if (!lowestBid) {
      return res.status(400).json({ message: 'İlanda geçerli teklif bulunamadı' });
    }
    
    // Reddedilmek istenen teklif en düşük teklif değilse hata döndür
    if (lowestBid._id.toString() !== bidId) {
      return res.status(400).json({ 
        message: 'Sadece en düşük teklifi reddedebilirsiniz. Bu teklif en düşük teklif değil.' 
      });
    }
    
    // Tüm tekliflerin durumlarını güncelle
    const lowestPrice = lowestBid.amount !== undefined ? lowestBid.amount : lowestBid.price;
    
    listing.bids.forEach(existingBid => {
      // Teklif tutarını belirle (amount veya price kullan)
      const bidAmount = existingBid.amount !== undefined ? existingBid.amount : existingBid.price;
      
      if (existingBid._id.toString() !== bidId) {
        // Daha yüksek fiyat teklifleri otomatik olarak reddedilir
        if (bidAmount > lowestPrice) {
          existingBid.status = 'rejected';
          existingBid.isApproved = false;
        } 
        // Eşit veya daha düşük fiyat teklifleri (çok nadir bir durum) beklemede olur
        else {
          existingBid.status = 'pending';
          existingBid.isApproved = false;
        }
      }
    });
    
    // Seçilen teklifi reddet
    listing.bids[bidIndex].status = 'rejected';
    listing.bids[bidIndex].isApproved = false;
    
    await listing.save();
    
    // Güncellenmiş ilanı tam detaylarla populate yaparak döndür
    const updatedListing = await Listing.findById(listing._id)
      .populate('owner', 'name email phone address companyInfo')
      .populate('category', 'name')
      .populate({
        path: 'bids.user',
        select: 'name email phone address companyInfo'
      })
      .populate({
        path: 'bids.bidder',
        select: 'name email phone address companyInfo'
      });
    
    // Socket.io ile bildirim gönder
    if (global.io) {
      // Güvenlik için kullanıcı bilgilerini filtreleyerek gönder
      const filteredListing = {
        ...updatedListing.toObject(),
        bids: updatedListing.bids.map(bid => ({
          ...bid,
          user: typeof bid.user === 'object' ? {
            _id: bid.user._id,
            name: bid.user.name,
            companyInfo: bid.user.companyInfo ? {
              companyName: bid.user.companyInfo.companyName
            } : undefined
          } : bid.user,
          bidder: typeof bid.bidder === 'object' ? {
            _id: bid.bidder._id,
            name: bid.bidder.name,
            companyInfo: bid.bidder.companyInfo ? {
              companyName: bid.bidder.companyInfo.companyName
            } : undefined
          } : bid.bidder
        }))
      };
      
      global.io.emit('bidUpdate', { 
        listing: filteredListing,
        message: 'Bir teklif reddedildi'
      });
    }
    
    res.json(updatedListing);
  } catch (error) {
    console.error('Teklif reddetme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};