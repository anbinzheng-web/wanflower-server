import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { CartService } from '../services/cart.service';
import { CartItemDto, UpdateCartItemDto, CartQueryDto, CartResponseDto, CartCountResponseDto, CartValidationResponseDto } from '../dtos';
import { ApiMessageResponse } from 'shared/decorators/swagger.decorator';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: '获取购物车' })
  @ApiMessageResponse(CartResponseDto)
  async getCart(@Request() req: any) {
    const userId = req.user.id;
    return await this.cartService.getCart(userId);
  }

  @Post('items')
  @ApiOperation({ summary: '添加商品到购物车' })
  @ApiMessageResponse(CartResponseDto)
  async addToCart(@Request() req: any, @Body() cartItemDto: CartItemDto) {
    const userId = req.user.id;
    return await this.cartService.addToCart(userId, cartItemDto);
  }

  @Put('items/:productId')
  @ApiOperation({ summary: '更新购物车商品数量' })
  @ApiMessageResponse(CartResponseDto)
  async updateCartItem(
    @Request() req: any, 
    @Param('productId', ParseIntPipe) productId: number, 
    @Body() updateCartItemDto: UpdateCartItemDto
  ) {
    const userId = req.user.id;
    return await this.cartService.updateCartItem(userId, productId, updateCartItemDto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: '从购物车移除商品' })
  @ApiMessageResponse(CartResponseDto)
  async removeFromCart(@Request() req: any, @Param('productId', ParseIntPipe) productId: number) {
    const userId = req.user.id;
    return await this.cartService.removeFromCart(userId, productId);
  }

  @Delete('clear')
  @ApiOperation({ summary: '清空购物车' })
  @ApiMessageResponse(CartResponseDto)
  async clearCart(@Request() req: any) {
    const userId = req.user.id;
    return await this.cartService.clearCart(userId);
  }

  @Get('count')
  @ApiOperation({ summary: '获取购物车商品数量' })
  @ApiMessageResponse(CartCountResponseDto)
  async getCartItemCount(@Request() req: any) {
    const userId = req.user.id;
    const count = await this.cartService.getCartItemCount(userId);
    return { count };
  }

  @Get('validate')
  @ApiOperation({ summary: '验证购物车商品可用性' })
  @ApiMessageResponse(CartValidationResponseDto)
  async validateCartItems(@Request() req: any) {
    const userId = req.user.id;
    return await this.cartService.validateCartItems(userId);
  }
}
