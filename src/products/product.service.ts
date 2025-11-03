import { Injectable } from '@nestjs/common';
import { UnifiedProductDto } from './dto/unified-product.dto';
import { OrgillRepository } from './orgill.repository';
import { CounterPointClient } from './counterpoint.client';
import { extractOrgillAttributes } from './utils/orgill-attributes';

@Injectable()
export class ProductService {
  constructor(
    private readonly orgillRepo: OrgillRepository,
    private readonly cp: CounterPointClient,
  ) {}

  async getUnifiedProduct(sku: string): Promise<UnifiedProductDto | null> {
    const [orgill, cp] = await Promise.all([
      this.orgillRepo.findBySku(sku),
      this.cp.getItemBySku(sku),
    ]);

    if (!orgill && !cp) return null;

    const images = [
      orgill?.image1,
      orgill?.image2,
      orgill?.image3,
      orgill?.image4,
    ].filter(Boolean);

    const documents = [orgill?.doc1, orgill?.doc2, orgill?.doc3]
      .filter(Boolean)
      .map((name: string) => ({ name, url: undefined }));

    const attributes = orgill ? extractOrgillAttributes(orgill) : [];

    return {
      sku: (orgill?.sku ?? cp?.ITEM_NO ?? sku)?.toString(),
      upc: (cp?.BARCOD ?? orgill?.upc_code) ?? null,

      brand: orgill?.brand_name ?? cp?.PROF_ALPHA_3 ?? null,
      model: orgill?.model_number ?? cp?.PROF_ALPHA_4 ?? null,

      title:
        orgill?.online_title_description ??
        orgill?.category_title_description ??
        cp?.DESCR ??
        null,

      longDescription: orgill?.online_long_description ?? null,
      shortDescription:
        orgill?.online_title_description ??
        cp?.DESCR ??
        null,

      category: cp?.CATEG_COD ?? null,
      subcategory: cp?.SUBCAT_COD ?? null,

      price: typeof cp?.PRC_1 === 'number' ? cp.PRC_1 : (cp?.PREF_UNIT_PRC_1 ?? null),
      unit: cp?.STK_UNIT ?? cp?.PREF_UNIT_NAM ?? null,
      weight: typeof cp?.WEIGHT === 'number' ? cp.WEIGHT : null,
      taxable: cp?.IS_TXBL === 'Y' ? true : cp?.IS_TXBL === 'N' ? false : null,

      ecommerceFlags: {
        isEcomm: cp?.IS_ECOMM_ITEM === 'Y',
        discountable: (cp?.IS_DISCNTBL === 'Y') && (cp?.ECOMM_ITEM_IS_DISCNTBL === 'Y'),
      },

      images,
      documents,
      attributes,
      raw: {
        orgill: orgill ?? undefined,
        counterpoint: cp ?? undefined,
      },
    };
  }
}
