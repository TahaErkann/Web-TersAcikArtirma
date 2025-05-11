/**
 * Teklif kabul etme controllerı - detaylı kullanıcı bilgileriyle populasyon yaparak
 */
const Listing = require('../models/Listing');

/**
 * Teklifi kabul et - özel ve detaylı kullanıcı bilgileriyle
 */
const acceptBid = async (req, res) => {
  try {
    console.log(`Teklif kabul ediliyor - Listing ID: ${req.params.id}, Bid ID: ${req.params.bidId}`);
    
    const listingId = req.params.id;
    const bidId = req.params.bidId;
    
    // İlanı ve teklifleri bul
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      console.log("İlan bulunamadı:", listingId);
      return res.status(404).json({ message: 'İlan bulunamadı' });
    }
    
    // İlan sahibi mi kontrol et
    if (listing.owner.toString() !== req.user._id.toString()) {
      console.log("Yetki hatası - İlan sahibi değil:", req.user._id);
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    // Teklifi bul
    const bidIndex = listing.bids.findIndex(bid => bid._id.toString() === bidId);
    
    if (bidIndex === -1) {
      console.log("Teklif bulunamadı:", bidId);
      return res.status(404).json({ message: 'Teklif bulunamadı' });
    }
    
    const bid = listing.bids[bidIndex];
    console.log("Teklif bulundu:", {
      id: bid._id,
      status: bid.status,
      user: typeof bid.user === 'string' ? bid.user : 'object'
    });
    
    // Teklif zaten onaylanmış mı kontrol et
    if (bid.status === 'accepted') {
      console.log("Teklif zaten kabul edilmiş");
      return res.status(400).json({ message: 'Bu teklif zaten kabul edilmiş' });
    }
    
    // Teklif zaten reddedilmiş mi kontrol et
    if (bid.status === 'rejected') {
      console.log("Teklif zaten reddedilmiş");
      return res.status(400).json({ message: 'Bu teklif zaten reddedilmiş' });
    }
    
    // Teklifin en düşük teklif olup olmadığını kontrol et
    console.log("En düşük teklif kontrolü yapılıyor...");
    const lowestBid = listing.getCurrentLowestBid();
    
    if (!lowestBid) {
      console.log("İlanda geçerli teklif bulunamadı");
      return res.status(400).json({ message: 'İlanda geçerli teklif bulunamadı' });
    }
    
    // Onaylanmak istenen teklif en düşük teklif değilse hata döndür
    if (lowestBid._id.toString() !== bidId) {
      console.log(`En düşük teklif kontrolü başarısız: İstenen teklif ${bidId}, en düşük teklif ${lowestBid._id}`);
      return res.status(400).json({ 
        message: 'Sadece en düşük teklifi onaylayabilirsiniz. Bu teklif en düşük teklif değil.' 
      });
    }
    
    console.log("En düşük teklif kontrolü başarılı, yüksek teklifleri reddediyorum...");
    
    // Tüm tekliflerin durumlarını güncelle
    const lowestPrice = lowestBid.amount !== undefined ? lowestBid.amount : lowestBid.price;
    
    listing.bids.forEach(existingBid => {
      // Teklif tutarını belirle (amount veya price kullan)
      const bidAmount = existingBid.amount !== undefined ? existingBid.amount : existingBid.price;
      
      if (existingBid._id.toString() !== bidId) {
        // Daha yüksek fiyat teklifleri otomatik olarak reddedilir
        if (bidAmount > lowestPrice) {
          console.log(`Yüksek teklif ${existingBid._id} reddediliyor (${bidAmount} > ${lowestPrice})`);
          existingBid.status = 'rejected';
          existingBid.isApproved = false;
        } 
        // Eşit veya daha düşük fiyat teklifleri (çok nadir bir durum) beklemede olur
        else {
          console.log(`Diğer teklif ${existingBid._id} beklemede (${bidAmount} <= ${lowestPrice})`);
          existingBid.status = 'pending';
          existingBid.isApproved = false;
        }
      }
    });
    
    // Teklifi kabul et
    listing.bids[bidIndex].status = 'accepted';
    listing.bids[bidIndex].isApproved = true;
    
    console.log("Teklif kabul edildi, kaydediliyor...");
    await listing.save();
    
    // Güncellenmiş ilanı tam detaylarla populate yaparak döndür
    console.log("Detaylı kullanıcı bilgileriyle yükleniyor...");
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
    
    // Teklifler içinden kabul edilmiş olanı bul
    const acceptedBid = updatedListing.bids.find(b => b._id.toString() === bidId);
    if (acceptedBid) {
      console.log("Kabul edilen teklif bilgileri:", {
        id: acceptedBid._id,
        status: acceptedBid.status,
        bidderInfo: typeof acceptedBid.bidder === 'object' ? {
          id: acceptedBid.bidder._id,
          name: acceptedBid.bidder.name,
          hasEmail: !!acceptedBid.bidder.email,
          hasPhone: !!acceptedBid.bidder.phone,
          hasAddress: !!acceptedBid.bidder.address,
          companyInfo: acceptedBid.bidder.companyInfo ? Object.keys(acceptedBid.bidder.companyInfo) : []
        } : "bidder is not an object",
        userInfo: typeof acceptedBid.user === 'object' ? {
          id: acceptedBid.user._id,
          name: acceptedBid.user.name,
          hasEmail: !!acceptedBid.user.email,
          hasPhone: !!acceptedBid.user.phone,
          hasAddress: !!acceptedBid.user.address,
          companyInfo: acceptedBid.user.companyInfo ? Object.keys(acceptedBid.user.companyInfo) : []
        } : "user is not an object"
      });
    }
    
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
    
    console.log("Teklif kabul işlemi başarılı");
    res.json(updatedListing);
  } catch (error) {
    console.error('Teklif kabul hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
};

module.exports = acceptBid; 