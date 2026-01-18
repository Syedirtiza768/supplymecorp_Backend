import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { ProductService } from '../product/product.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);
  
  constructor(
    @InjectRepository(CartItem) private readonly repo: Repository<CartItem>,
    private readonly products: ProductService,
  ) {}

  async findBySession(sessionId: string) {
    if (!sessionId) return [];
    
    try {
      const items = await this.repo.find({ 
        where: { sessionId }, 
        order: { id: 'ASC' } 
      });
      
      if (items.length === 0) return [];
      
      // Batch fetch all product data in parallel (uses cache, much faster)
      const productIds = items.map(item => String(item.productId));
      const startTime = Date.now();
      
      const productDataPromises = items.map(async (item) => {
        try {
          const unified = await this.products.getUnifiedProduct(String(item.productId));
          return {
            productId: item.productId,
            data: unified,
          };
        } catch (e) {
          this.logger.warn(`Failed to fetch product ${item.productId}: ${e.message}`);
          return {
            productId: item.productId,
            data: null,
          };
        }
      });
      
      const productDataResults = await Promise.all(productDataPromises);
      const productDataMap = new Map(
        productDataResults.map(r => [r.productId, r.data])
      );
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Fetched ${items.length} cart products in ${duration}ms (avg ${Math.round(duration / items.length)}ms/item)`);
      
      // Enrich cart items with product data
      return items.map((item) => {
        const unified = productDataMap.get(item.productId);
        
        return {
          ...item,
          price_snapshot: item.priceSnapshot, // snake_case alias for frontend
          orgillImages: unified?.images || [],
          title: unified?.title || null,
          onlineTitleDescription: unified?.title || null,
          brandName: unified?.brand || null,
          availability: unified?.availability || null,
          price: unified?.price || parseFloat(item.priceSnapshot) || 0,
        };
      });
    } catch (error) {
      this.logger.error('Failed to fetch cart items:', error);
      return [];
    }
  }

  async upsertItem(opts: { sessionId: string; productId: number | string; qty: number }) {
    const { sessionId, productId, qty } = opts;
    
    // Fetch price once (will be cached)
    let priceSnapshot = '0';
    try {
      const unified = await this.products.getUnifiedProduct(String(productId));
      priceSnapshot = String(unified?.price ?? 0);
    } catch (e) {
      this.logger.warn(`Could not fetch price for product ${productId}: ${e.message}`);
    }

    await this.repo
      .createQueryBuilder()
      .insert()
      .into(CartItem)
      .values({ sessionId, productId: String(productId), qty, priceSnapshot })
      .onConflict('(session_id,product_id) DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty, updated_at = NOW()')
      .execute();
  }

  async updateQuantity(sessionId: string, productId: string, qty: number) {
    if (!sessionId) return;
    await this.repo.update({ sessionId, productId }, { qty });
  }

  async removeItem(sessionId: string, productId: string) {
    if (!sessionId) return;
    await this.repo.delete({ sessionId, productId });
  }

  async clearCart(sessionId: string) {
    if (!sessionId) return;
    await this.repo.delete({ sessionId });
  }
}
