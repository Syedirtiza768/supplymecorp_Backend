import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { WishlistService } from './wishlist.service';

type AddDto = { productId: string };

@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlist: WishlistService) {}

  private sessionId(req: any): string {
    return (req.headers['x-session-id'] as string) || '';
  }

  @Get()
  async index(@Req() req: any) {
    try {
      const sid = this.sessionId(req);
      const items = await this.wishlist.findBySession(sid);
      return { items };
    } catch (error) {
      console.error('Wishlist index error:', error);
      return { items: [] };
    }
  }

  @Get('count')
  async count(@Req() req: any) {
    const sid = this.sessionId(req);
    const count = await this.wishlist.getWishlistCount(sid);
    return { count };
  }

  @Get('check/:productId')
  async check(@Req() req: any, @Param('productId') productId: string) {
    const sid = this.sessionId(req);
    const isInWishlist = await this.wishlist.isInWishlist(sid, productId);
    return { isInWishlist };
  }

  @Post('items')
  async add(@Req() req: any, @Body() dto: AddDto) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'no session id' };

    const result = await this.wishlist.addItem({ 
      sessionId: sid, 
      productId: dto.productId 
    });
    
    return { ok: result.success, error: result.error };
  }

  @Delete('items/:productId')
  async remove(@Req() req: any, @Param('productId') productId: string) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'no session id' };

    const result = await this.wishlist.removeItem(sid, productId);
    return { ok: result.success, error: result.error };
  }

  @Delete()
  async clear(@Req() req: any) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'no session id' };

    const result = await this.wishlist.clearWishlist(sid);
    return { ok: result.success, error: result.error };
  }
}
