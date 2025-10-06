import { 
  Controller, 
  Get, 
  Delete, 
  Param, 
  Query, 
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { RolesGuard } from 'auth/roles.guard';
import { Roles } from 'auth/roles.decorator';
import { Role } from 'auth/roles.enum';
import { PaymentService } from '../services/payment.service';
import { PaymentQueryDto, PaymentLogDto, PaymentDetailDto, PaymentStatsDto } from '../dtos';
import { ApiPaginatedResponse, ApiMessageResponse } from 'shared/decorators/swagger.decorator';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Staff)
  @ApiOperation({ summary: '获取支付记录列表（仅管理员/员工）' })
  @ApiPaginatedResponse(PaymentLogDto)
  async getPaymentList(@Query() query: PaymentQueryDto) {
    return await this.paymentService.getPaymentList(query);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Staff)
  @ApiOperation({ summary: '获取支付统计信息（仅管理员/员工）' })
  @ApiMessageResponse(PaymentStatsDto)
  async getPaymentStats() {
    return await this.paymentService.getPaymentStats();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.Staff)
  @ApiOperation({ summary: '获取支付详情（仅管理员/员工）' })
  @ApiMessageResponse(PaymentDetailDto)
  async getPaymentDetail(@Param('id', ParseIntPipe) id: number) {
    return await this.paymentService.getPaymentDetail(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: '删除支付记录（仅管理员）' })
  @ApiMessageResponse()
  async deletePayment(@Param('id', ParseIntPipe) id: number) {
    await this.paymentService.deletePayment(id);
    return { message: '支付记录删除成功' };
  }
}
