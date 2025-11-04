import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewItem } from './review-item.entity';
import { ProductService } from '../product/product.service';
import { CreateReviewDto, UpdateReviewDto, AverageRatingDto } from './dto/review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ReviewItem) private readonly repo: Repository<ReviewItem>,
    private readonly products: ProductService,
  ) {}

  async getReviewsByProduct(productId: string) {
    const reviews = await this.repo.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });

    return reviews.map(review => ({
      id: review.id,
      sessionId: review.sessionId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      userName: review.userName || 'Anonymous',
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));
  }

  async getUserReview(sessionId: string, productId: string) {
    const review = await this.repo.findOne({
      where: { sessionId, productId },
    });

    if (!review) return null;

    return {
      id: review.id,
      sessionId: review.sessionId,
      productId: review.productId,
      rating: review.rating,
      comment: review.comment,
      userName: review.userName || 'Anonymous',
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async addReview(sessionId: string, dto: CreateReviewDto) {
    if (!sessionId) {
      return { success: false, error: 'No session ID' };
    }

    // Check if user already reviewed this product
    const existing = await this.repo.findOne({
      where: { sessionId, productId: dto.productId },
    });

    if (existing) {
      return { success: false, error: 'You have already reviewed this product. Please edit your existing review.' };
    }

    try {
      const review = this.repo.create({
        sessionId,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment || '',
        userName: dto.userName || 'Anonymous',
      });

      const saved = await this.repo.save(review);

      return {
        success: true,
        review: {
          id: saved.id,
          sessionId: saved.sessionId,
          productId: saved.productId,
          rating: saved.rating,
          comment: saved.comment,
          userName: saved.userName,
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt,
        },
      };
    } catch (e) {
      console.error('Error adding review:', e);
      return { success: false, error: 'Failed to add review' };
    }
  }

  async updateReview(sessionId: string, reviewId: string, dto: UpdateReviewDto) {
    if (!sessionId) {
      return { success: false, error: 'No session ID' };
    }

    try {
      // Ensure the review belongs to this session
      const review = await this.repo.findOne({
        where: { id: reviewId, sessionId },
      });

      if (!review) {
        return { success: false, error: 'Review not found or you do not have permission to edit it' };
      }

      // Update fields
      if (dto.rating !== undefined) review.rating = dto.rating;
      if (dto.comment !== undefined) review.comment = dto.comment;

      const updated = await this.repo.save(review);

      return {
        success: true,
        review: {
          id: updated.id,
          sessionId: updated.sessionId,
          productId: updated.productId,
          rating: updated.rating,
          comment: updated.comment,
          userName: updated.userName,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        },
      };
    } catch (e) {
      console.error('Error updating review:', e);
      return { success: false, error: 'Failed to update review' };
    }
  }

  async deleteReview(sessionId: string, reviewId: string) {
    if (!sessionId) {
      return { success: false, error: 'No session ID' };
    }

    try {
      // Ensure the review belongs to this session
      const review = await this.repo.findOne({
        where: { id: reviewId, sessionId },
      });

      if (!review) {
        return { success: false, error: 'Review not found or you do not have permission to delete it' };
      }

      await this.repo.remove(review);
      return { success: true };
    } catch (e) {
      console.error('Error deleting review:', e);
      return { success: false, error: 'Failed to delete review' };
    }
  }

  async getAverageRating(productId: string): Promise<AverageRatingDto> {
    const reviews = await this.repo.find({
      where: { productId },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    return {
      productId,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
    };
  }

  async getReviewCount(productId: string): Promise<number> {
    return await this.repo.count({ where: { productId } });
  }
}
