import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './cart-item.entity';
import { ProductService } from '../product/product.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem) private readonly repo: Repository<CartItem>,
    private readonly products: ProductService, // must expose findById(productId)
  ) {}

  async findBySession(sessionId: string) {
    if (!sessionId) return [];
    const items = await this.repo.find({ where: { sessionId }, order: { id: 'ASC' } });
    // Attach Orgill image URLs if available
    return await Promise.all(items.map(async (item) => {
      let orgillImages: string[] = [];
      let title: string | null = null;
      let onlineTitleDescription: string | null = null;
      let brandName: string | null = null;
      try {
        const unified = await this.products.getUnifiedProduct(String(item.productId));
        if (unified) {
          orgillImages = unified.images || [];
          title = unified.title || null;
          onlineTitleDescription = unified.title || null;
          brandName = unified.brand || null;
        }
      } catch (e) {}
      // Always include price_snapshot (snake_case) for frontend compatibility
      return {
        ...item,
        price_snapshot: item.priceSnapshot, // snake_case alias for frontend
        orgillImages,
        title,
        onlineTitleDescription,
        brandName,
      };
    }));
  }

  async upsertItem(opts: { sessionId: string; productId: number | string; qty: number }) {
    const { sessionId, productId, qty } = opts;
    // Use unified product logic for price (Orgill or CounterPoint)
    let priceSnapshot = '0';
    try {
      const unified = await this.products.getUnifiedProduct(String(productId));
      priceSnapshot = String(unified?.price ?? 0);
    } catch (e) {}

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
