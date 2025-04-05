const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const { authenticateToken, isApprovedCompany } = require('../middleware/auth');

// Tüm ilanları getir (genel erişim)
router.get('/', listingController.getAllListings);

// İlan detayını getir (genel erişim)
router.get('/:id', listingController.getListingById);

// Yeni ilan oluştur (onaylı firmalar)
router.post('/', authenticateToken, isApprovedCompany, listingController.createListing);

// İlan güncelle (ilan sahibi)
router.put('/:id', authenticateToken, listingController.updateListing);

// İlan sil (ilan sahibi veya admin)
router.delete('/:id', authenticateToken, listingController.deleteListing);

// İlanı iptal et (ilan sahibi)
router.put('/:id/cancel', authenticateToken, listingController.cancelListing);

// İlana teklif ver (onaylı firmalar)
router.post('/:id/bid', authenticateToken, isApprovedCompany, listingController.placeBid);

// İlanı tamamla/reddet (ilan sahibi)
router.put('/:id/complete', authenticateToken, listingController.completeListing);

// Kullanıcının kendi ilanlarını getir
router.get('/user/mylistings', authenticateToken, listingController.getMyListings);

// Kullanıcının teklif verdiği ilanları getir
router.get('/user/mybids', authenticateToken, listingController.getMyBids);

module.exports = router; 