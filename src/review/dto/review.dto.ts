import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  userName?: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReviewResponseDto {
  id: string;
  sessionId: string;
  productId: string;
  rating: number;
  comment: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AverageRatingDto {
  productId: string;
  averageRating: number;
  totalReviews: number;
}
