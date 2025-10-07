import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'shared/services/prisma.service';
import { CartItemData, CartQueryParams } from '../interfaces/order.interface';
import { CartItemDto, UpdateCartItemDto } from '../dtos/cart.dto';
import { AdminCartQueryDto, AdminBatchCartOperationDto, AdminCartStatisticsDto } from '../dtos/admin-cart.dto';
import { PaginatedData } from 'shared/dto/response.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取用户购物车
   */
  async getCart(userId: number) {
    let cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                original_price: true,
                stock: true,
                status: true,
                media: {
                  where: { category: 'MAIN' },
                  select: {
                    local_path: true,
                    cdn_url: true,
                    type: true
                  },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    // 如果购物车不存在，创建一个
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          user_id: userId,
          items: {
            create: []
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  original_price: true,
                  stock: true,
                  status: true,
                  media: {
                    where: { category: 'MAIN' },
                    select: {
                      local_path: true,
                      cdn_url: true,
                      type: true
                    },
                    take: 1
                  }
                }
              }
            }
          }
        }
      });
    }

    return cart;
  }

  /**
   * 添加商品到购物车
   */
  async addToCart(userId: number, cartItemDto: CartItemDto) {
    const { product_id, quantity } = cartItemDto;

    // 检查商品是否存在且可用
    const product = await this.prisma.product.findUnique({
      where: { id: product_id },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        status: true
      }
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('商品已下架');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('商品库存不足');
    }

    // 获取或创建购物车
    let cart = await this.prisma.cart.findUnique({
      where: { user_id: userId }
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { user_id: userId }
      });
    }

    // 检查商品是否已在购物车中
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cart_id_product_id: {
          cart_id: cart.id,
          product_id: product_id
        }
      }
    });

    if (existingItem) {
      // 更新数量
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException('商品库存不足');
      }

      await this.prisma.cartItem.update({
        where: {
          cart_id_product_id: {
            cart_id: cart.id,
            product_id: product_id
          }
        },
        data: { quantity: newQuantity }
      });
    } else {
      // 添加新商品
      await this.prisma.cartItem.create({
        data: {
          cart_id: cart.id,
          product_id: product_id,
          quantity: quantity
        }
      });
    }

    return this.getCart(userId);
  }

  /**
   * 更新购物车商品数量
   */
  async updateCartItem(userId: number, productId: number, updateCartItemDto: UpdateCartItemDto) {
    const { quantity } = updateCartItemDto;

    // 检查商品是否存在且可用
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stock: true,
        status: true
      }
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (product.status !== 'ACTIVE') {
      throw new BadRequestException('商品已下架');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('商品库存不足');
    }

    // 获取购物车
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId }
    });

    if (!cart) {
      throw new NotFoundException('购物车不存在');
    }

    // 检查购物车项是否存在
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        cart_id_product_id: {
          cart_id: cart.id,
          product_id: productId
        }
      }
    });

    if (!cartItem) {
      throw new NotFoundException('购物车中不存在此商品');
    }

    // 更新数量
    await this.prisma.cartItem.update({
      where: {
        cart_id_product_id: {
          cart_id: cart.id,
          product_id: productId
        }
      },
      data: { quantity }
    });

    return this.getCart(userId);
  }

  /**
   * 从购物车移除商品
   */
  async removeFromCart(userId: number, productId: number) {
    // 获取购物车
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId }
    });

    if (!cart) {
      throw new NotFoundException('购物车不存在');
    }

    // 检查购物车项是否存在
    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        cart_id_product_id: {
          cart_id: cart.id,
          product_id: productId
        }
      }
    });

    if (!cartItem) {
      throw new NotFoundException('购物车中不存在此商品');
    }

    // 删除购物车项
    await this.prisma.cartItem.delete({
      where: {
        cart_id_product_id: {
          cart_id: cart.id,
          product_id: productId
        }
      }
    });

    return this.getCart(userId);
  }

  /**
   * 清空购物车
   */
  async clearCart(userId: number) {
    // 获取购物车
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId }
    });

    if (!cart) {
      throw new NotFoundException('购物车不存在');
    }

    // 删除所有购物车项
    await this.prisma.cartItem.deleteMany({
      where: { cart_id: cart.id }
    });

    return this.getCart(userId);
  }

  /**
   * 获取购物车商品数量
   */
  async getCartItemCount(userId: number): Promise<number> {
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
      include: {
        items: {
          select: { quantity: true }
        }
      }
    });

    if (!cart) {
      return 0;
    }

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * 验证购物车商品可用性
   */
  async validateCartItems(userId: number): Promise<{ valid: boolean; invalidItems: any[] }> {
    const cart = await this.getCart(userId);
    const invalidItems: any[] = [];

    for (const item of cart.items) {
      const product = item.product;
      
      // 检查商品状态
      if (product.status !== 'ACTIVE') {
        invalidItems.push({
          cart_item_id: item.id,
          product_id: product.id,
          product_name: product.name,
          reason: '商品已下架'
        });
        continue;
      }

      // 检查库存
      if (product.stock < item.quantity) {
        invalidItems.push({
          cart_item_id: item.id,
          product_id: product.id,
          product_name: product.name,
          reason: '库存不足',
          available_stock: product.stock,
          requested_quantity: item.quantity
        });
      }
    }

    return {
      valid: invalidItems.length === 0,
      invalidItems
    };
  }

  // ==================== 管理员功能 ====================

  /**
   * 获取所有购物车（管理员）
   */
  async getAllCarts(query: AdminCartQueryDto): Promise<PaginatedData<any>> {
    const {
      user_id,
      user_email,
      product_id,
      product_name,
      min_quantity,
      max_quantity,
      created_at_start,
      created_at_end,
      updated_at_start,
      updated_at_end,
      page = 1,
      page_size = 10,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = query;

    const skip = (page - 1) * page_size;

    // 构建查询条件
    const where: any = {};

    if (user_id) {
      where.user_id = user_id;
    }

    if (user_email) {
      where.user = {
        email: {
          contains: user_email,
          mode: 'insensitive'
        }
      };
    }

    if (created_at_start || created_at_end) {
      where.created_at = {};
      if (created_at_start) {
        where.created_at.gte = new Date(created_at_start);
      }
      if (created_at_end) {
        where.created_at.lte = new Date(created_at_end);
      }
    }

    if (updated_at_start || updated_at_end) {
      where.updated_at = {};
      if (updated_at_start) {
        where.updated_at.gte = new Date(updated_at_start);
      }
      if (updated_at_end) {
        where.updated_at.lte = new Date(updated_at_end);
      }
    }

    // 构建items查询条件
    const itemsWhere: any = {};
    if (product_id) {
      itemsWhere.product_id = product_id;
    }
    if (product_name) {
      itemsWhere.product = {
        name: {
          contains: product_name,
          mode: 'insensitive'
        }
      };
    }
    if (min_quantity !== undefined) {
      itemsWhere.quantity = { gte: min_quantity };
    }
    if (max_quantity !== undefined) {
      itemsWhere.quantity = { ...itemsWhere.quantity, lte: max_quantity };
    }

    // 如果有items相关条件，需要先过滤购物车
    if (Object.keys(itemsWhere).length > 0) {
      const cartsWithItems = await this.prisma.cart.findMany({
        where: {
          ...where,
          items: {
            some: itemsWhere
          }
        },
        select: { id: true }
      });
      where.id = {
        in: cartsWithItems.map(cart => cart.id)
      };
    }

    // 获取总数
    const total = await this.prisma.cart.count({ where });

    // 获取购物车列表
    const carts = await this.prisma.cart.findMany({
      where,
      skip,
      take: page_size,
      orderBy: { [sort_by]: sort_order },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        },
        items: {
          where: Object.keys(itemsWhere).length > 0 ? itemsWhere : undefined,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                original_price: true,
                stock: true,
                status: true,
                media: {
                  where: { category: 'MAIN' },
                  select: {
                    local_path: true,
                    cdn_url: true,
                    type: true
                  },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    // 计算统计信息
    const cartsWithStats = carts.map(cart => {
      const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalValue = cart.items.reduce((sum, item) => sum + (item.quantity * Number(item.product.price)), 0);

      return {
        ...cart,
        statistics: {
          total_items: cart.items.length,
          total_quantity: totalQuantity,
          total_value: totalValue
        }
      };
    });

    return {
      records: cartsWithStats,
      total,
      page,
      page_size
    };
  }

  /**
   * 获取指定用户的购物车（管理员）
   */
  async getCartByUserId(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                original_price: true,
                stock: true,
                status: true,
                media: {
                  where: { category: 'MAIN' },
                  select: {
                    local_path: true,
                    cdn_url: true,
                    type: true
                  },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!cart) {
      throw new NotFoundException('购物车不存在');
    }

    // 计算统计信息
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = cart.items.reduce((sum, item) => sum + (item.quantity * Number(item.product.price)), 0);

    return {
      ...cart,
      statistics: {
        total_items: cart.items.length,
        total_quantity: totalQuantity,
        total_value: totalValue
      }
    };
  }

  /**
   * 删除指定用户的购物车（管理员）
   */
  async deleteCartByUserId(userId: number) {
    const cart = await this.prisma.cart.findUnique({
      where: { user_id: userId },
      include: { items: true }
    });

    if (!cart) {
      throw new NotFoundException('购物车不存在');
    }

    // 删除购物车项
    await this.prisma.cartItem.deleteMany({
      where: { cart_id: cart.id }
    });

    // 删除购物车
    await this.prisma.cart.delete({
      where: { id: cart.id }
    });

    return { message: '购物车删除成功' };
  }

  /**
   * 批量操作购物车项（管理员）
   */
  async batchOperationCartItems(operationDto: AdminBatchCartOperationDto) {
    const { operation, cart_item_ids, new_quantity } = operationDto;

    // 验证购物车项是否存在
    const existingItems = await this.prisma.cartItem.findMany({
      where: { id: { in: cart_item_ids } },
      select: { id: true }
    });

    if (existingItems.length !== cart_item_ids.length) {
      throw new BadRequestException('部分购物车项不存在');
    }

    switch (operation) {
      case 'delete':
        await this.prisma.cartItem.deleteMany({
          where: { id: { in: cart_item_ids } }
        });
        return { message: `成功删除 ${cart_item_ids.length} 个购物车项` };

      case 'update_quantity':
        if (new_quantity === undefined) {
          throw new BadRequestException('更新数量操作需要提供new_quantity参数');
        }
        await this.prisma.cartItem.updateMany({
          where: { id: { in: cart_item_ids } },
          data: { quantity: new_quantity }
        });
        return { message: `成功更新 ${cart_item_ids.length} 个购物车项数量为 ${new_quantity}` };

      default:
        throw new BadRequestException('不支持的操作类型');
    }
  }

  /**
   * 获取购物车统计信息（管理员）
   */
  async getCartStatistics(): Promise<AdminCartStatisticsDto> {
    // 总购物车数量
    const total_carts = await this.prisma.cart.count();

    // 总购物车项数量
    const total_cart_items = await this.prisma.cartItem.count();

    // 活跃购物车数量（有商品的购物车）
    const active_carts = await this.prisma.cart.count({
      where: {
        items: {
          some: {}
        }
      }
    });

    // 获取所有购物车项及其商品价格
    const cartItems = await this.prisma.cartItem.findMany({
      include: {
        product: {
          select: {
            price: true
          }
        }
      }
    });

    // 计算总价值和平均价值
    const total_value = cartItems.reduce((sum, item) => sum + (item.quantity * Number(item.product.price)), 0);
    const average_cart_value = total_carts > 0 ? total_value / total_carts : 0;

    // 获取每个购物车的商品数量
    const cartsWithItemCount = await this.prisma.cart.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    const max_items_in_cart = Math.max(...cartsWithItemCount.map(cart => cart._count.items), 0);

    return {
      total_carts,
      total_cart_items,
      active_carts,
      total_value,
      average_cart_value,
      max_items_in_cart,
      generated_at: new Date()
    };
  }

  /**
   * 清空所有购物车（管理员）
   */
  async clearAllCarts() {
    // 删除所有购物车项
    await this.prisma.cartItem.deleteMany({});

    // 删除所有购物车
    await this.prisma.cart.deleteMany({});

    return { message: '所有购物车已清空' };
  }
}
