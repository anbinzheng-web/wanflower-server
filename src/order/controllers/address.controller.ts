import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { AddressValidationService } from '../services/address-validation.service';
import { ShippingAddressDto } from '../dtos/create-order.dto';
import { ApiMessageResponse } from 'shared/decorators/swagger.decorator';

@ApiTags('address')
@Controller('address')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressController {
  constructor(private readonly addressValidationService: AddressValidationService) {}

  @Get('countries')
  @ApiOperation({ summary: '获取国家列表' })
  @ApiMessageResponse()
  async getCountries() {
    const countries = this.addressValidationService.getCountryList();
    return { countries };
  }

  @Get('provinces/:countryCode')
  @ApiOperation({ summary: '根据国家代码获取省/州列表' })
  @ApiMessageResponse()
  async getProvincesByCountry(@Param('countryCode') countryCode: string) {
    const provinces = this.addressValidationService.getProvincesByCountry(countryCode);
    return { provinces };
  }

  @Post('validate')
  @ApiOperation({ summary: '验证和标准化地址' })
  @ApiMessageResponse()
  async validateAddress(@Body() addressDto: ShippingAddressDto) {
    const result = await this.addressValidationService.validateAndStandardizeAddress(addressDto);
    return result;
  }
}
