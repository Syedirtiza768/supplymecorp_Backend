import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { CartService } from './cart.service';

type AddDto = { productId: string; qty?: number };

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  private sessionId(req: any): string {
    return (req.headers['x-session-id'] as string) || '';
  }

  @Get()
  async index(@Req() req: any) {
    const sid = this.sessionId(req);
    const items = await this.cart.findBySession(sid);
    return { items };
  }

  @Post('items')
  async add(@Req() req: any, @Body() dto: AddDto) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'no session id' };

    const qty = Math.max(1, dto.qty ?? 1);
    await this.cart.upsertItem({ sessionId: sid, productId: dto.productId, qty });
    return { ok: true };
  }

  @Put('items/:productId')
  async update(@Req() req: any, @Body() dto: { qty: number }, @Param('productId') productId: string) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'no session id' };

    const qty = Math.max(1, dto.qty ?? 1);
    await this.cart.updateQuantity(sid, productId, qty);
    return { ok: true };
  }

  @Delete('items/:productId')
  async remove(@Req() req: any, @Param('productId') productId: string) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'no session id' };

    await this.cart.removeItem(sid, productId);
    return { ok: true };
  }

  @Delete()
  async clear(@Req() req: any) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'no session id' };

    await this.cart.clearCart(sid);
    return { ok: true };
  }
}
