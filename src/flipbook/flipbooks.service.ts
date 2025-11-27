import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flipbook } from './entities/flipbook.entity';
import { FlipbookPage } from './entities/flipbook-page.entity';
import { FlipbookHotspot } from './entities/flipbook-hotspot.entity';
import { CreateFlipbookDto } from './dto/create-flipbook.dto';
import { UpdateFlipbookDto } from './dto/update-flipbook.dto';
import { HotspotDto } from './dto/hotspot.dto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as PDFDocument from 'pdfkit';
import axios from 'axios';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class FlipbooksService {
  constructor(
    @InjectRepository(Flipbook)
    private readonly flipbookRepository: Repository<Flipbook>,
    @InjectRepository(FlipbookPage)
    private readonly pageRepository: Repository<FlipbookPage>,
    @InjectRepository(FlipbookHotspot)
    private readonly hotspotRepository: Repository<FlipbookHotspot>,
  ) {}

  /**
   * Create a new flipbook or return existing one
   */
  async createOrFindFlipbook(dto: CreateFlipbookDto): Promise<Flipbook> {
    // Use a slugified version of the title as the ID
    const slug = dto.title.replace(/[^a-zA-Z0-9-]/g, '-');
    let flipbook = await this.flipbookRepository.findOne({
      where: { id: slug },
      relations: ['pages'],
    });

    if (!flipbook) {
      flipbook = this.flipbookRepository.create({ ...dto, id: slug });
      await this.flipbookRepository.save(flipbook);
    }

    return flipbook;
  }

  /**
   * Get all flipbooks
   */
  async findAllFlipbooks(): Promise<Flipbook[]> {
    return await this.flipbookRepository.find({
      relations: ['pages', 'pages.hotspots'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get flipbook by ID
   */
  async findFlipbookById(id: string): Promise<Flipbook> {
    const flipbook = await this.flipbookRepository.findOne({
      where: { id },
      relations: ['pages', 'pages.hotspots'],
    });

    if (!flipbook) {
      throw new NotFoundException(`Flipbook with ID ${id} not found`);
    }

    return flipbook;
  }

  /**
   * Get all pages for a flipbook
   */
  async findPagesByFlipbookId(flipbookId: string): Promise<FlipbookPage[]> {
    // Ensure flipbook exists first
    try {
      let flipbook = await this.flipbookRepository.findOne({
        where: { id: flipbookId },
      });

      if (!flipbook) {
        // Create flipbook if it doesn't exist
        flipbook = this.flipbookRepository.create({
          id: flipbookId,
          title: flipbookId,
        });
        await this.flipbookRepository.save(flipbook);
      }
    } catch (error) {
      // Ignore duplicate key error - flipbook already exists
      if (error.code !== '23505') {
        throw error;
      }
    }

    return await this.pageRepository.find({
      where: { flipbookId },
      relations: ['hotspots'],
      order: { pageNumber: 'ASC' },
    });
  }

  /**
   * Upload and create a new page
   */
  async uploadPage(
    flipbookId: string,
    file: any,
    pageNumber?: number,
  ): Promise<FlipbookPage> {
    // Verify flipbook exists
    await this.findFlipbookById(flipbookId);

    // Auto-assign page number if not provided
    if (!pageNumber) {
      const lastPage = await this.pageRepository.findOne({
        where: { flipbookId },
        order: { pageNumber: 'DESC' },
      });
      pageNumber = lastPage ? lastPage.pageNumber + 1 : 1;
    }

    // Check if page number already exists
    let page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
    });

    // Save file to public/uploads/flipbooks
    const uploadsDir = path.join(process.cwd(), '..', 'supplymecorp', 'public', 'uploads', 'flipbooks', flipbookId);
    await mkdir(uploadsDir, { recursive: true });

    const filename = `page-${pageNumber}${path.extname(file.originalname)}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, file.buffer);

    const imageUrl = `/uploads/flipbooks/${flipbookId}/${filename}`;

    if (page) {
      // Update existing page
      page.imageUrl = imageUrl;
    } else {
      // Create new page record
      page = this.pageRepository.create({
        flipbookId,
        pageNumber,
        imageUrl,
      });
    }

    return await this.pageRepository.save(page);
  }

  /**
   * Get page with hotspots
   */
  async getPageWithHotspots(
    flipbookId: string,
    pageNumber: number,
  ): Promise<{ page: FlipbookPage; hotspots: FlipbookHotspot[] }> {
    // Ensure flipbook exists first
    try {
      let flipbook = await this.flipbookRepository.findOne({
        where: { id: flipbookId },
      });

      if (!flipbook) {
        // Create flipbook if it doesn't exist
        flipbook = this.flipbookRepository.create({
          id: flipbookId,
          title: flipbookId,
        });
        await this.flipbookRepository.save(flipbook);
      }
    } catch (error) {
      // Ignore duplicate key error - flipbook already exists
      if (error.code !== '23505') {
        throw error;
      }
    }

    const page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
      relations: ['hotspots'],
    });

    if (!page) {
      const fallback = this.getStaticPageImage(pageNumber);
      if (fallback) {
        const staticPage = this.pageRepository.create({
          flipbookId,
          pageNumber,
          imageUrl: `/images/flipbook/${fallback.filename}`,
        });
        await this.pageRepository.save(staticPage);

        return { page: staticPage, hotspots: [] };
      }

      throw new NotFoundException(
        `Page ${pageNumber} not found in flipbook ${flipbookId}`,
      );
    }

    return { page, hotspots: page.hotspots || [] };
  }

  /**
   * Update hotspots for a page (atomic replacement)
   */
  async updatePageHotspots(
    flipbookId: string,
    pageNumber: number,
    dtos: HotspotDto[],
  ): Promise<FlipbookHotspot[]> {
    const page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
    });

    if (!page) {
      throw new NotFoundException(
        `Page ${pageNumber} not found in flipbook ${flipbookId}`,
      );
    }

    // Delete all existing hotspots for this page
    await this.hotspotRepository.delete({ page: { id: page.id } });

    // Create new hotspots from DTOs
    const hotspots = dtos.map((dto) => {
      // Remove id from dto as we're creating new records
      const { id, ...hotspotData } = dto;
      return this.hotspotRepository.create({
        ...hotspotData,
        page,
      });
    });

    // Save all hotspots
    return await this.hotspotRepository.save(hotspots);
  }

  /**
   * Delete a page
   */
  async deletePage(flipbookId: string, pageNumber: number): Promise<void> {
    const page = await this.pageRepository.findOne({
      where: { flipbookId, pageNumber },
    });

    if (!page) {
      throw new NotFoundException(
        `Page ${pageNumber} not found in flipbook ${flipbookId}`,
      );
    }

    await this.pageRepository.remove(page);
  }

  /**
   * Delete a flipbook
   */
  async deleteFlipbook(id: string): Promise<void> {
    const flipbook = await this.findFlipbookById(id);
    await this.flipbookRepository.remove(flipbook);
  }

  /**
   * Update a flipbook
   */
  async updateFlipbook(id: string, dto: UpdateFlipbookDto): Promise<Flipbook> {
    const flipbook = await this.findFlipbookById(id);
    
    if (dto.title) flipbook.title = dto.title;
    if (dto.description !== undefined) flipbook.description = dto.description;
    if (dto.isFeatured !== undefined) flipbook.isFeatured = dto.isFeatured;

    return await this.flipbookRepository.save(flipbook);
  }

  /**
   * Toggle featured status (only one flipbook can be featured at a time)
   */
  async toggleFeatured(id: string): Promise<Flipbook> {
    const flipbook = await this.findFlipbookById(id);
    
    if (!flipbook.isFeatured) {
      // Unfeatured all other flipbooks first
      await this.flipbookRepository.update({ isFeatured: true }, { isFeatured: false });
      flipbook.isFeatured = true;
    } else {
      flipbook.isFeatured = false;
    }

    return await this.flipbookRepository.save(flipbook);
  }

  /**
   * Get the currently featured flipbook
   */
  async getFeaturedFlipbook(): Promise<Flipbook | null> {
    return await this.flipbookRepository.findOne({
      where: { isFeatured: true },
      relations: ['pages', 'pages.hotspots'],
    });
  }

  private getStaticPageImage(pageNumber: number) {
    const staticDir = path.join(
      process.cwd(),
      '..',
      'supplymecorp',
      'public',
      'images',
      'flipbook',
    );
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];

    for (const ext of extensions) {
      const filename = `${pageNumber}.${ext}`;
      const candidate = path.join(staticDir, filename);
      if (fs.existsSync(candidate)) {
        return { filename, path: candidate };
      }
    }

    return null;
  }

  /**
   * Generate PDF from flipbook pages
   */
  async generatePDF(flipbookId: string): Promise<Buffer> {
    const flipbook = await this.findFlipbookById(flipbookId);
    const pages = await this.findPagesByFlipbookId(flipbookId);

    if (!pages || pages.length === 0) {
      throw new BadRequestException('Flipbook has no pages to export');
    }

    return new Promise(async (resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        autoFirstPage: false,
        margin: 0,
      });

      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        // Sort pages by page number
        const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

        for (const page of sortedPages) {
          let imageBuffer: Buffer;

          // Download image from URL
          if (page.imageUrl.startsWith('http')) {
            const response = await axios.get(page.imageUrl, {
              responseType: 'arraybuffer',
            });
            imageBuffer = Buffer.from(response.data);
          } else {
            // Local file path
            const imagePath = path.join(process.cwd(), '..', 'supplymecorp', 'public', page.imageUrl);
            if (!fs.existsSync(imagePath)) {
              console.warn(`Image not found: ${imagePath}`);
              continue;
            }
            imageBuffer = fs.readFileSync(imagePath);
          }

          // Add page in letter size (can be adjusted based on your needs)
          // You can also dynamically set size based on image dimensions
          doc.addPage({
            size: 'LETTER', // or [width, height] for custom size
            margin: 0,
          });

          // Fit image to page
          doc.image(imageBuffer, 0, 0, {
            fit: [doc.page.width, doc.page.height],
            align: 'center',
            valign: 'center',
          });
        }

        doc.end();
      } catch (error) {
        doc.end();
        reject(error);
      }
    });
  }

}

