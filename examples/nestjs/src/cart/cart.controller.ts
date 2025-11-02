import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';

class AddDto { productId!: string; qty?: number }

@Controller('cart')
export class CartController {
  private cartByUser: Record<string, any> = {};

  @Get()
  get(@Req() req: any) {
    const uid = req.user?.id ?? 'anon';
    return this.cartByUser[uid] ?? { items: [], totalQty: 0, subtotal: 0 };
  }

  @Post()
  add(@Req() req: any, @Body() body: AddDto) {
    const uid = req.user?.id ?? 'anon';
    const qty = Math.max(1, body?.qty ?? 1);
    const productId = String(body.productId);
    const cart = this.cartByUser[uid] ?? { items: [], totalQty: 0, subtotal: 0 };
    const idx = cart.items.findIndex((x: any) => x.productId === productId);
    if (idx >= 0) {
      cart.items[idx].qty += qty;
    } else {
      cart.items.push({ key: productId, productId, title: 'Item '+productId, qty, unitPrice: 0, lineTotal: 0 });
    }
    cart.totalQty = cart.items.reduce((s: number, x: any) => s + x.qty, 0);
    cart.subtotal = cart.items.reduce((s: number, x: any) => s + (x.unitPrice * x.qty), 0);
    this.cartByUser[uid] = cart;
    return cart;
  }
}

export default CartController;
