import { Listing, IListing } from '../models/Listing';
import { io } from '../socket';
import mongoose from 'mongoose';
import User from '../models/User';

export const listingService = {
  async createListing(listingData: any): Promise<IListing> {
    const listing = new Listing({
      ...listingData,
      currentPrice: listingData.startingPrice
    });
    await listing.save();
    io.emit('newListing', listing);
    return listing;
  },

  async getListingById(id: string): Promise<IListing | null> {
    if (id === 'active' || !mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(`Geçersiz ilan ID: ${id}`);
    }
    
    return await Listing.findById(id)
      .populate('seller', 'username email')
      .populate('bids.user', 'username email');
  },

  async getAllListings(filter = {}): Promise<IListing[]> {
    return await Listing.find(filter)
      .populate('seller', 'username')
      .sort({ createdAt: -1 });
  },

  async getActiveListings(): Promise<IListing[]> {
    return await this.getAllListings({ status: 'active' });
  },

  async getListingsByUser(userId: string): Promise<IListing[]> {
    return await this.getAllListings({ seller: userId });
  },

  async placeBid(listingId: string, userId: string, amount: number): Promise<IListing> {
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      throw new Error('İlan bulunamadı');
    }
    
    if (listing.status !== 'active') {
      throw new Error('Bu ilan artık aktif değil');
    }
    
    if (new Date(listing.endDate) < new Date()) {
      throw new Error('Bu ilan için süre dolmuştur');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }
    
    if (amount >= listing.currentPrice) {
      throw new Error('Teklif mevcut fiyattan düşük olmalıdır');
    }
    
    // Teklif ekle
    const newBid = {
      user: userId,
      amount,
      timestamp: new Date()
    };
    
    listing.bids.push(newBid);
    listing.currentPrice = amount;
    await listing.save();

    // Gerçek zamanlı bildirim gönder
    io.emit('bidPlaced', { 
      listingId, 
      bid: newBid 
    });
    
    return listing;
  },

  async updateListingStatus(listingId: string, status: 'active' | 'ended' | 'cancelled'): Promise<IListing | null> {
    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { status },
      { new: true }
    );
    
    if (listing) {
      io.emit('listingStatusUpdated', { listingId, status });
    }
    
    return listing;
  },

  async updateListing(listingId: string, updateData: Partial<IListing>): Promise<IListing | null> {
    const listing = await Listing.findByIdAndUpdate(
      listingId,
      updateData,
      { new: true }
    );
    
    if (listing) {
      io.emit('listingUpdated', listing);
    }
    
    return listing;
  },

  async deleteListing(listingId: string): Promise<boolean> {
    const result = await Listing.findByIdAndDelete(listingId);
    
    if (result) {
      io.emit('listingDeleted', listingId);
      return true;
    }
    
    return false;
  }
}; 