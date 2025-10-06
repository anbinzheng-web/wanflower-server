import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'shared/services/prisma.service';
import { CartItemData, CartQueryParams } from '../interfaces/order.interface';
import { CartItemDto, UpdateCartItemDto } from '../dtos/cart.dto';

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
                  where: { media_category: 'MAIN' },
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
                    where: { media_category: 'MAIN' },
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
}
