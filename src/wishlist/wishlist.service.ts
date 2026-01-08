import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './wishlist-item.entity';
import { ProductService } from '../product/product.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem) private readonly repo: Repository<WishlistItem>,
    private readonly products: ProductService,
  ) {}

  async findBySession(sessionId: string) {
    if (!sessionId) return [];
    try {
      const items = await this.repo.find({ 
        where: { sessionId }, 
        order: { createdAt: 'DESC' } 
      });
      
      // Attach product details from Orgill/CounterPoint
      return await Promise.all(items.map(async (item) => {
        let orgillImages: string[] = [];
        let title: string | null = null;
        let onlineTitleDescription: string | null = null;
        let brandName: string | null = null;
        let currentPrice: string | null = null;
        
        try {
          const unified = await this.products.getUnifiedProduct(String(item.productId));
          if (unified) {
            orgillImages = unified.images || [];
            title = unified.title || null;
            onlineTitleDescription = unified.title || null;
            brandName = unified.brand || null;
            currentPrice = String(unified.price || 0);
          }
        } catch (e) {
          console.error(`Error fetching product ${item.productId}:`, e.message);
        }
        
        return {
          ...item,
          price_snapshot: item.priceSnapshot,
          orgillImages,
          title,
          onlineTitleDescription,
          brandName,
          currentPrice,
        };
      }));
    } catch (error) {
      console.error('Failed to fetch wishlist items:', error);
      return [];
    }
  }

  async addItem(opts: { sessionId: string; productId: number | string }) {
    const { sessionId, productId } = opts;
    
    // Get current price as snapshot
    let priceSnapshot = '0';
    try {
      const unified = await this.products.getUnifiedProduct(String(productId));
      priceSnapshot = String(unified?.price ?? 0);
    } catch (e) {
      console.error(`Error fetching price for product ${productId}:`, e);
    }

    try {
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(WishlistItem)
        .values({ sessionId, productId: String(productId), priceSnapshot })
        .onConflict('(session_id,product_id) DO NOTHING')
        .execute();
      
      return { success: true };
    } catch (e) {
      console.error('Error adding to wishlist:', e);
      return { success: false, error: 'Failed to add to wishlist' };
    }
  }

  async removeItem(sessionId: string, productId: string) {
    if (!sessionId) return { success: false, error: 'No session ID' };
    
    try {
      await this.repo.delete({ sessionId, productId });
      return { success: true };
    } catch (e) {
      console.error('Error removing from wishlist:', e);
      return { success: false, error: 'Failed to remove from wishlist' };
    }
  }

  async clearWishlist(sessionId: string) {
    if (!sessionId) return { success: false, error: 'No session ID' };
    
    try {
      await this.repo.delete({ sessionId });
      return { success: true };
    } catch (e) {
      console.error('Error clearing wishlist:', e);
      return { success: false, error: 'Failed to clear wishlist' };
    }
  }

  async isInWishlist(sessionId: string, productId: string): Promise<boolean> {
    if (!sessionId) return false;
    
    const count = await this.repo.count({
      where: { sessionId, productId }
    });
    
    return count > 0;
  }

  async getWishlistCount(sessionId: string): Promise<number> {
    if (!sessionId) return 0;
    
    return await this.repo.count({ where: { sessionId } });
  }
}
