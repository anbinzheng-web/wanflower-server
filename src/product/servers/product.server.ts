import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from 'shared/services/prisma.service';
import { 
  ProductListDto, ProductCreateDto, ProductUpdateDto, ProductDetailDto,
  ProductViewDto, ProductBatchDeleteDto, ProductBatchUpdateStatusDto,
  CategoryCreateDto, CategoryUpdateDto, CategoryListDto
} from '../dtos';
// 临时类型定义
type Prisma = any;
enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE', 
  DRAFT = 'DRAFT'
}

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // ================================
  // 产品查询相关方法
  // ================================

  /**
   * 获取产品列表（支持筛选、排序、分页）
   */
  async getProductList(query: ProductListDto) {
    const {
      page, page_size, price_order, sales_order, view_order,
      status, category_id, keyword, min_price, max_price
    } = query;

    // 构建查询条件
    const where: any = {
      deleted_at: null, // 排除已删除的产品
    };

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 分类筛选
    if (category_id) {
      where.category_id = category_id;
    }

    // 关键词搜索
    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { short_desc: { contains: keyword, mode: 'insensitive' } },
        { sku: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // 价格范围筛选
    if (min_price !== undefined || max_price !== undefined) {
      where.price = {};
      if (min_price !== undefined) where.price.gte = min_price;
      if (max_price !== undefined) where.price.lte = max_price;
    }

    // 构建排序条件
    const orderBy: any[] = [];
    
    if (price_order) {
      orderBy.push({ price: price_order });
    }
    if (sales_order) {
      orderBy.push({ sales_count: sales_order });
    }
    if (view_order) {
      orderBy.push({ view_count: view_order });
    }
    
    // 默认按创建时间倒序
    if (orderBy.length === 0) {
      orderBy.push({ created_at: 'desc' });
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip: (page - 1) * page_size,
        take: page_size,
        where,
        orderBy,
        include: {
          category: {
            select: { id: true, name: true, slug: true }
          },
          media: {
            where: { media_category: 'MAIN' },
            orderBy: { sort_order: 'asc' },
            take: 1,
            select: {
              id: true,
              type: true,
              storage_type: true,
              local_path: true,
              cdn_url: true,
              alt_text: true
            }
          },
          attributes: {
            orderBy: { sort_order: 'asc' },
            select: {
              id: true,
              name: true,
              value: true,
              sort_order: true
            }
          }
        }
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      records: products,
      total,
      page,
      page_size,
      total_pages: Math.ceil(total / page_size)
    };
  }

  /**
   * 通过SKU获取产品详情
   */
  async getProductBySku(sku: string) {
    const product = await this.prisma.product.findFirst({
      where: { 
        sku: sku,
        deleted_at: null
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        media: {
          orderBy: [
            { media_category: 'asc' },
            { sort_order: 'asc' }
          ],
          select: {
            id: true,
            type: true,
            storage_type: true,
            local_path: true,
            cdn_url: true,
            file_size: true,
            mime_type: true,
            width: true,
            height: true,
            duration: true,
            thumbnail_local: true,
            thumbnail_cdn: true,
            alt_text: true,
            media_category: true,
            sort_order: true
          }
        },
        attributes: {
          orderBy: { sort_order: 'asc' },
          select: {
            id: true,
            name: true,
            value: true,
            sort_order: true
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    return product;
  }

  /**
   * 获取产品详情
   */
  async getProductDetail(query: ProductDetailDto) {
    const product = await this.prisma.product.findFirst({
      where: { 
        id: query.id,
        deleted_at: null
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        },
        media: {
          orderBy: [
            { media_category: 'asc' },
            { sort_order: 'asc' }
          ],
          select: {
            id: true,
            type: true,
            storage_type: true,
            local_path: true,
            cdn_url: true,
            file_size: true,
            mime_type: true,
            width: true,
            height: true,
            duration: true,
            thumbnail_local: true,
            thumbnail_cdn: true,
            alt_text: true,
            media_category: true,
            sort_order: true
          }
        },
        attributes: {
          orderBy: { sort_order: 'asc' },
          select: {
            id: true,
            name: true,
            value: true,
            sort_order: true
          }
        },
        reviews: {
          where: { 
            status: 'APPROVED',
            is_visible: true,
            deleted_at: null
          },
          orderBy: { helpful_count: 'desc' },
          take: 5,
          select: {
            id: true,
            rating: true,
            content: true,
            helpful_count: true,
            created_at: true,
            user: {
              select: { id: true, username: true, avatar_url: true }
            }
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    return product;
  }

  // ================================
  // 产品管理相关方法（需要权限）
  // ================================

  /**
   * 创建产品
   */
  async createProduct(data: ProductCreateDto) {
    const { attributes, ...productData } = data;

    // 检查SKU是否重复
    if (productData.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: { sku: productData.sku, deleted_at: null }
      });
      if (existingSku) {
        throw new BadRequestException('SKU已存在');
      }
    }

    // 检查分类是否存在
    if (productData.category_id) {
      const category = await this.prisma.productCategory.findFirst({
        where: { id: productData.category_id, is_active: true }
      });
      if (!category) {
        throw new BadRequestException('分类不存在或已禁用');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // 创建产品
      const { category_id, dimensions, ...productDataWithoutCategory } = productData;
      const product = await tx.product.create({
        data: {
          ...productDataWithoutCategory,
          dimensions: dimensions ? dimensions as any : undefined,
          category: category_id ? {
            connect: { id: category_id }
          } : undefined
        }
      });

      // 创建产品属性
      if (attributes && attributes.length > 0) {
        await tx.productAttribute.createMany({
          data: attributes.map(attr => ({
            product_id: product.id,
            name: attr.name,
            value: attr.value,
            sort_order: attr.sort_order || 0
          }))
        });
      }

      return product;
    });
  }

  /**
   * 更新产品
   */
  async updateProduct(data: ProductUpdateDto) {
    const { id, attributes, ...productData } = data;

    // 检查产品是否存在
    const existingProduct = await this.prisma.product.findFirst({
      where: { id, deleted_at: null }
    });
    if (!existingProduct) {
      throw new NotFoundException('产品不存在');
    }

    // 检查SKU是否重复
    if (productData.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: { 
          sku: productData.sku, 
          deleted_at: null,
          id: { not: id }
        }
      });
      if (existingSku) {
        throw new BadRequestException('SKU已存在');
      }
    }

    // 检查分类是否存在
    if (productData.category_id) {
      const category = await this.prisma.productCategory.findFirst({
        where: { id: productData.category_id, is_active: true }
      });
      if (!category) {
        throw new BadRequestException('分类不存在或已禁用');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // 更新产品基本信息
      const { category_id, dimensions, ...productDataWithoutCategory } = productData;
      const product = await tx.product.update({
        where: { id },
        data: {
          ...productDataWithoutCategory,
          dimensions: dimensions ? dimensions as any : undefined,
          category: category_id ? {
            connect: { id: category_id }
          } : undefined
        }
      });

      // 更新产品属性
      if (attributes !== undefined) {
        // 删除现有属性
        await tx.productAttribute.deleteMany({
          where: { product_id: id }
        });

        // 创建新属性
        if (attributes.length > 0) {
          await tx.productAttribute.createMany({
            data: attributes.map(attr => ({
              product_id: id,
              name: attr.name,
              value: attr.value,
              sort_order: attr.sort_order || 0
            }))
          });
        }
      }

      return product;
    });
  }

  /**
   * 删除产品（软删除）
   */
  async deleteProduct(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, deleted_at: null }
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    return await this.prisma.product.update({
      where: { id },
      data: { deleted_at: new Date() }
    });
  }

  /**
   * 批量删除产品
   */
  async batchDeleteProducts(data: ProductBatchDeleteDto) {
    return await this.prisma.product.updateMany({
      where: { 
        id: { in: data.ids },
        deleted_at: null
      },
      data: { deleted_at: new Date() }
    });
  }

  /**
   * 批量更新产品状态
   */
  async batchUpdateProductStatus(data: ProductBatchUpdateStatusDto) {
    return await this.prisma.product.updateMany({
      where: { 
        id: { in: data.ids },
        deleted_at: null
      },
      data: { status: data.status }
    });
  }

  // ================================
  // 其他功能方法
  // ================================

  /**
   * 增加产品浏览量
   */
  async incrementProductView(data: ProductViewDto) {
    // TODO: 使用Redis优化并发问题
    const product = await this.prisma.product.findFirst({
      where: { id: data.id, deleted_at: null }
    });

    if (!product) {
      throw new NotFoundException('产品不存在');
    }

    return await this.prisma.product.update({
      where: { id: data.id },
      data: { view_count: { increment: 1 } }
    });
  }

  // ================================
  // 产品分类相关方法
  // ================================

  /**
   * 获取分类列表
   */
  async getCategoryList(query: CategoryListDto) {
    const { page, page_size, parent_id, is_active } = query;

    const where: any = {};

    if (parent_id !== undefined) {
      where.parent_id = parent_id;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [categories, total] = await Promise.all([
      this.prisma.productCategory.findMany({
        skip: (page - 1) * page_size,
        take: page_size,
        where,
        orderBy: [
          { sort_order: 'asc' },
          { created_at: 'desc' }
        ],
        include: {
          parent: {
            select: { id: true, name: true, slug: true }
          },
          children: {
            select: { id: true, name: true, slug: true, is_active: true },
            orderBy: { sort_order: 'asc' }
          },
          _count: {
            select: { products: true }
          }
        }
      }),
      this.prisma.productCategory.count({ where })
    ]);

    return {
      records: categories,
      total,
      page,
      page_size,
      total_pages: Math.ceil(total / page_size)
    };
  }

  /**
   * 创建分类
   */
  async createCategory(data: CategoryCreateDto) {
    // 检查slug是否重复
    const existingSlug = await this.prisma.productCategory.findUnique({
      where: { slug: data.slug }
    });
    if (existingSlug) {
      throw new BadRequestException('分类标识已存在');
    }

    // 检查父分类是否存在
    if (data.parent_id) {
      const parentCategory = await this.prisma.productCategory.findFirst({
        where: { id: data.parent_id, is_active: true }
      });
      if (!parentCategory) {
        throw new BadRequestException('父分类不存在或已禁用');
      }
    }

    return await this.prisma.productCategory.create({
      data
    });
  }

  /**
   * 更新分类
   */
  async updateCategory(data: CategoryUpdateDto) {
    const { id, ...updateData } = data;

    const existingCategory = await this.prisma.productCategory.findUnique({
      where: { id }
    });
    if (!existingCategory) {
      throw new NotFoundException('分类不存在');
    }

    // 检查slug是否重复
    if (updateData.slug) {
      const existingSlug = await this.prisma.productCategory.findFirst({
        where: { 
          slug: updateData.slug,
          id: { not: id }
        }
      });
      if (existingSlug) {
        throw new BadRequestException('分类标识已存在');
      }
    }

    // 检查父分类是否存在（不能设置自己为父分类）
    if (updateData.parent_id) {
      if (updateData.parent_id === id) {
        throw new BadRequestException('不能设置自己为父分类');
      }

      const parentCategory = await this.prisma.productCategory.findFirst({
        where: { id: updateData.parent_id, is_active: true }
      });
      if (!parentCategory) {
        throw new BadRequestException('父分类不存在或已禁用');
      }
    }

    return await this.prisma.productCategory.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: number) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
      include: {
        children: true,
        _count: { select: { products: true } }
      }
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (category.children.length > 0) {
      throw new BadRequestException('该分类下有子分类，无法删除');
    }

    if (category._count.products > 0) {
      throw new BadRequestException('该分类下有产品，无法删除');
    }

    return await this.prisma.productCategory.delete({
      where: { id }
    });
  }

  // ================================
  // 产品属性管理相关方法
  // ================================

  /**
   * 获取产品属性列表
   */
  async getProductAttributes(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deleted_at: null }
    });

    if (!product) {
      throw new BadRequestException('产品不存在');
    }

    return await this.prisma.productAttribute.findMany({
      where: { product_id: productId },
      orderBy: { sort_order: 'asc' }
    });
  }

  /**
   * 创建产品属性
   */
  async createProductAttribute(data: any) {
    const { product_id, ...attributeData } = data;

    // 检查产品是否存在
    const product = await this.prisma.product.findFirst({
      where: { id: product_id, deleted_at: null }
    });

    if (!product) {
      throw new BadRequestException('产品不存在');
    }

    return await this.prisma.productAttribute.create({
      data: {
        product_id,
        ...attributeData
      }
    });
  }

  /**
   * 更新产品属性
   */
  async updateProductAttribute(data: any) {
    const { id, ...updateData } = data;

    // 检查属性是否存在
    const attribute = await this.prisma.productAttribute.findFirst({
      where: { id },
      include: { product: true }
    });

    if (!attribute) {
      throw new BadRequestException('属性不存在');
    }

    // 检查产品是否被删除
    if (attribute.product.deleted_at) {
      throw new BadRequestException('产品已删除');
    }

    return await this.prisma.productAttribute.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * 删除产品属性
   */
  async deleteProductAttribute(id: number) {
    // 检查属性是否存在
    const attribute = await this.prisma.productAttribute.findFirst({
      where: { id },
      include: { product: true }
    });

    if (!attribute) {
      throw new BadRequestException('属性不存在');
    }

    // 检查产品是否被删除
    if (attribute.product.deleted_at) {
      throw new BadRequestException('产品已删除');
    }

    return await this.prisma.productAttribute.delete({
      where: { id }
    });
  }
}