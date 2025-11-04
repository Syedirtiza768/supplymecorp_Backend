import { Body, Controller, Delete, Get, Param, Post, Put, Req } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  private sessionId(req: any): string {
    return (req.headers['x-session-id'] as string) || '';
  }

  @Get('product/:productId')
  async getProductReviews(@Param('productId') productId: string) {
    const reviews = await this.reviewService.getReviewsByProduct(productId);
    return { reviews };
  }

  @Get('product/:productId/average')
  async getAverageRating(@Param('productId') productId: string) {
    const data = await this.reviewService.getAverageRating(productId);
    return data;
  }

  @Get('product/:productId/user')
  async getUserReview(@Req() req: any, @Param('productId') productId: string) {
    const sid = this.sessionId(req);
    if (!sid) return { review: null };

    const review = await this.reviewService.getUserReview(sid, productId);
    return { review };
  }

  @Post()
  async addReview(@Req() req: any, @Body() dto: CreateReviewDto) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'No session ID' };

    const result = await this.reviewService.addReview(sid, dto);
    return { ok: result.success, error: result.error, review: result.review };
  }

  @Put(':id')
  async updateReview(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'No session ID' };

    const result = await this.reviewService.updateReview(sid, id, dto);
    return { ok: result.success, error: result.error, review: result.review };
  }

  @Delete(':id')
  async deleteReview(@Req() req: any, @Param('id') id: string) {
    const sid = this.sessionId(req);
    if (!sid) return { ok: false, error: 'No session ID' };

    const result = await this.reviewService.deleteReview(sid, id);
    return { ok: result.success, error: result.error };
  }
}
