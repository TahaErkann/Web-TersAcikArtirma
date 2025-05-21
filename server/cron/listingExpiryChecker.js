const Listing = require('../models/Listing');
const notificationService = require('../services/notificationService');

/**
 * İlanların süresini kontrol eden ve süresi dolmuş olanları güncelleyip
 * bildirim gönderen fonksiyon. Bu fonksiyon belirli aralıklarla
 * çalıştırılmalıdır.
 */
const checkListingExpiry = async () => {
  try {
    console.log('İlan sürelerini kontrol ediyor...');
    
    // Şu anki tarih
    const now = new Date();
    
    // Süresi dolmuş ama durumu active olan ilanları bul
    const expiredListings = await Listing.find({
      status: 'active',
      expiresAt: { $lt: now }
    }).populate('owner', 'name');
    
    console.log(`${expiredListings.length} adet süresi dolmuş aktif ilan bulundu`);
    
    // Her bir ilan için işlem yap
    for (const listing of expiredListings) {
      console.log(`İlan işleniyor: ${listing._id} - ${listing.title}`);
      
      // İlan durumunu expired olarak güncelle
      listing.status = 'expired';
      
      // En düşük teklifi bul ve kazanan olarak belirle
      const lowestBid = listing.getCurrentLowestBid();
      if (lowestBid && lowestBid.user) {
        listing.winner = lowestBid.user;
        console.log(`Kazanan belirlendi: ${lowestBid.user}`);
      }
      
      // İlanı kaydet
      await listing.save();
      
      // Güncellenmiş ilanı populate et
      const updatedListing = await Listing.findById(listing._id)
        .populate('owner', 'name')
        .populate('winner', 'name')
        .populate('category', 'name');
      
      // Socket.io ile güncelleme gönder
      if (global.io) {
        global.io.emit('listingExpiry', updatedListing);
      }
      
      // İlan sahibine bildirim gönder
      try {
        await notificationService.createNotification(
          listing.owner._id.toString(),
          'expiry',
          'İlan Süresi Doldu',
          `"${listing.title}" ilanınızın süresi doldu.${lowestBid ? ' En düşük teklif kazanan olarak belirlendi.' : ''}`,
          listing._id
        );
        console.log(`İlan sahibine süre dolma bildirimi gönderildi: ${listing.owner._id}`);
      } catch (notifError) {
        console.error('İlan sahibine bildirim gönderilirken hata:', notifError);
      }
      
      // Kazanan teklif sahibine bildirim gönder
      if (lowestBid && lowestBid.user) {
        try {
          await notificationService.createNotification(
            lowestBid.user.toString(),
            'winner',
            'Tebrikler! Teklif Kazandınız',
            `"${listing.title}" ilanında verdiğiniz teklif kabul edildi.`,
            listing._id,
            lowestBid._id
          );
          console.log(`Kazanan teklif sahibine bildirim gönderildi: ${lowestBid.user}`);
        } catch (notifError) {
          console.error('Kazanan teklif sahibine bildirim gönderilirken hata:', notifError);
        }
      }
    }
    
    console.log('İlan süresi kontrol işlemi tamamlandı');
    return { checked: expiredListings.length, updated: expiredListings.length };
  } catch (error) {
    console.error('İlan süresi kontrol hatası:', error);
    throw error;
  }
};

module.exports = { checkListingExpiry }; 