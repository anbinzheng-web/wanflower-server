import { Injectable } from '@nestjs/common';
import { ShippingAddress } from '../interfaces/order.interface';

@Injectable()
export class AddressValidationService {
  /**
   * 验证和标准化地址
   * TODO: 集成第三方地址验证服务（如Google Maps API、SmartyStreets等）
   */
  async validateAndStandardizeAddress(address: ShippingAddress): Promise<{
    isValid: boolean;
    standardizedAddress?: string;
    verificationLevel: 'none' | 'partial' | 'full';
    suggestions?: string[];
  }> {
    // 基础验证
    const basicValidation = this.validateBasicAddress(address);
    if (!basicValidation.isValid) {
      return {
        isValid: false,
        verificationLevel: 'none',
        suggestions: basicValidation.suggestions
      };
    }

    // 地址标准化
    const standardizedAddress = this.standardizeAddress(address);
    
    // TODO: 集成第三方地址验证API
    // 这里可以调用Google Maps Geocoding API、SmartyStreets等
    // 进行地址验证和标准化
    
    return {
      isValid: true,
      standardizedAddress,
      verificationLevel: 'partial', // 目前只做基础验证，后续可升级为full
      suggestions: []
    };
  }

  /**
   * 基础地址验证
   */
  private validateBasicAddress(address: ShippingAddress): {
    isValid: boolean;
    suggestions: string[];
  } {
    const suggestions: string[] = [];

    // 验证必填字段
    if (!address.name?.trim()) {
      suggestions.push('收货人姓名不能为空');
    }

    if (!address.phone?.trim()) {
      suggestions.push('收货人电话不能为空');
    } else if (!this.isValidPhoneNumber(address.phone)) {
      suggestions.push('电话号码格式不正确，请使用国际格式（如：+86 138 0013 8000）');
    }

    if (!address.country?.trim()) {
      suggestions.push('国家不能为空');
    } else if (!this.isValidCountryCode(address.country)) {
      suggestions.push('国家代码格式不正确，请使用ISO 3166-1 alpha-2格式（如：CN、US）');
    }

    if (!address.province?.trim()) {
      suggestions.push('省/州不能为空');
    }

    if (!address.city?.trim()) {
      suggestions.push('城市不能为空');
    }

    if (!address.address_line_1?.trim()) {
      suggestions.push('地址第一行不能为空');
    }

    return {
      isValid: suggestions.length === 0,
      suggestions
    };
  }

  /**
   * 验证电话号码格式
   */
  private isValidPhoneNumber(phone: string): boolean {
    // 国际电话号码正则表达式
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * 验证国家代码格式
   */
  private isValidCountryCode(countryCode: string): boolean {
    // ISO 3166-1 alpha-2 国家代码（2位大写字母）
    const countryCodeRegex = /^[A-Z]{2}$/;
    return countryCodeRegex.test(countryCode);
  }

  /**
   * 地址标准化
   */
  private standardizeAddress(address: ShippingAddress): string {
    const parts: string[] = [];

    // 添加地址行
    if (address.address_line_1) {
      parts.push(address.address_line_1.trim());
    }
    if (address.address_line_2) {
      parts.push(address.address_line_2.trim());
    }
    if (address.address_line_3) {
      parts.push(address.address_line_3.trim());
    }

    // 添加城市、省/州、国家
    const locationParts: string[] = [];
    if (address.city) locationParts.push(address.city.trim());
    if (address.district) locationParts.push(address.district.trim());
    if (address.province) locationParts.push(address.province.trim());
    if (address.postal_code) locationParts.push(address.postal_code.trim());
    if (address.country) locationParts.push(address.country.trim());

    if (locationParts.length > 0) {
      parts.push(locationParts.join(', '));
    }

    return parts.join('\n');
  }

  /**
   * 获取国家列表（用于前端下拉选择）
   */
  getCountryList(): Array<{ code: string; name: string; name_zh: string }> {
    return [
      { code: 'CN', name: 'China', name_zh: '中国' },
      { code: 'US', name: 'United States', name_zh: '美国' },
      { code: 'GB', name: 'United Kingdom', name_zh: '英国' },
      { code: 'CA', name: 'Canada', name_zh: '加拿大' },
      { code: 'AU', name: 'Australia', name_zh: '澳大利亚' },
      { code: 'DE', name: 'Germany', name_zh: '德国' },
      { code: 'FR', name: 'France', name_zh: '法国' },
      { code: 'JP', name: 'Japan', name_zh: '日本' },
      { code: 'KR', name: 'South Korea', name_zh: '韩国' },
      { code: 'SG', name: 'Singapore', name_zh: '新加坡' },
      { code: 'HK', name: 'Hong Kong', name_zh: '香港' },
      { code: 'TW', name: 'Taiwan', name_zh: '台湾' },
      { code: 'MY', name: 'Malaysia', name_zh: '马来西亚' },
      { code: 'TH', name: 'Thailand', name_zh: '泰国' },
      { code: 'VN', name: 'Vietnam', name_zh: '越南' },
      { code: 'IN', name: 'India', name_zh: '印度' },
      { code: 'BR', name: 'Brazil', name_zh: '巴西' },
      { code: 'MX', name: 'Mexico', name_zh: '墨西哥' },
      { code: 'RU', name: 'Russia', name_zh: '俄罗斯' },
      { code: 'IT', name: 'Italy', name_zh: '意大利' },
      { code: 'ES', name: 'Spain', name_zh: '西班牙' },
      { code: 'NL', name: 'Netherlands', name_zh: '荷兰' },
      { code: 'SE', name: 'Sweden', name_zh: '瑞典' },
      { code: 'NO', name: 'Norway', name_zh: '挪威' },
      { code: 'DK', name: 'Denmark', name_zh: '丹麦' },
      { code: 'FI', name: 'Finland', name_zh: '芬兰' },
      { code: 'CH', name: 'Switzerland', name_zh: '瑞士' },
      { code: 'AT', name: 'Austria', name_zh: '奥地利' },
      { code: 'BE', name: 'Belgium', name_zh: '比利时' },
      { code: 'PL', name: 'Poland', name_zh: '波兰' },
      { code: 'CZ', name: 'Czech Republic', name_zh: '捷克' },
      { code: 'HU', name: 'Hungary', name_zh: '匈牙利' },
      { code: 'PT', name: 'Portugal', name_zh: '葡萄牙' },
      { code: 'GR', name: 'Greece', name_zh: '希腊' },
      { code: 'TR', name: 'Turkey', name_zh: '土耳其' },
      { code: 'SA', name: 'Saudi Arabia', name_zh: '沙特阿拉伯' },
      { code: 'AE', name: 'United Arab Emirates', name_zh: '阿联酋' },
      { code: 'IL', name: 'Israel', name_zh: '以色列' },
      { code: 'ZA', name: 'South Africa', name_zh: '南非' },
      { code: 'EG', name: 'Egypt', name_zh: '埃及' },
      { code: 'NG', name: 'Nigeria', name_zh: '尼日利亚' },
      { code: 'KE', name: 'Kenya', name_zh: '肯尼亚' },
      { code: 'AR', name: 'Argentina', name_zh: '阿根廷' },
      { code: 'CL', name: 'Chile', name_zh: '智利' },
      { code: 'CO', name: 'Colombia', name_zh: '哥伦比亚' },
      { code: 'PE', name: 'Peru', name_zh: '秘鲁' },
      { code: 'VE', name: 'Venezuela', name_zh: '委内瑞拉' },
      { code: 'NZ', name: 'New Zealand', name_zh: '新西兰' },
      { code: 'ID', name: 'Indonesia', name_zh: '印度尼西亚' },
      { code: 'PH', name: 'Philippines', name_zh: '菲律宾' },
    ];
  }

  /**
   * 根据国家代码获取省/州列表（示例数据）
   * TODO: 集成真实的地理数据API
   */
  getProvincesByCountry(countryCode: string): Array<{ code: string; name: string; name_zh: string }> {
    const provinces: Record<string, Array<{ code: string; name: string; name_zh: string }>> = {
      'CN': [
        { code: 'GD', name: 'Guangdong', name_zh: '广东省' },
        { code: 'BJ', name: 'Beijing', name_zh: '北京市' },
        { code: 'SH', name: 'Shanghai', name_zh: '上海市' },
        { code: 'TJ', name: 'Tianjin', name_zh: '天津市' },
        { code: 'CQ', name: 'Chongqing', name_zh: '重庆市' },
        { code: 'JS', name: 'Jiangsu', name_zh: '江苏省' },
        { code: 'ZJ', name: 'Zhejiang', name_zh: '浙江省' },
        { code: 'FJ', name: 'Fujian', name_zh: '福建省' },
        { code: 'SD', name: 'Shandong', name_zh: '山东省' },
        { code: 'HN', name: 'Hunan', name_zh: '湖南省' },
        { code: 'HB', name: 'Hubei', name_zh: '湖北省' },
        { code: 'SC', name: 'Sichuan', name_zh: '四川省' },
        { code: 'YN', name: 'Yunnan', name_zh: '云南省' },
        { code: 'GX', name: 'Guangxi', name_zh: '广西壮族自治区' },
        { code: 'GZ', name: 'Guizhou', name_zh: '贵州省' },
        { code: 'HI', name: 'Hainan', name_zh: '海南省' },
        { code: 'XJ', name: 'Xinjiang', name_zh: '新疆维吾尔自治区' },
        { code: 'XZ', name: 'Tibet', name_zh: '西藏自治区' },
        { code: 'QH', name: 'Qinghai', name_zh: '青海省' },
        { code: 'GS', name: 'Gansu', name_zh: '甘肃省' },
        { code: 'NX', name: 'Ningxia', name_zh: '宁夏回族自治区' },
        { code: 'SX', name: 'Shanxi', name_zh: '山西省' },
        { code: 'SN', name: 'Shaanxi', name_zh: '陕西省' },
        { code: 'HE', name: 'Hebei', name_zh: '河北省' },
        { code: 'LN', name: 'Liaoning', name_zh: '辽宁省' },
        { code: 'JL', name: 'Jilin', name_zh: '吉林省' },
        { code: 'HL', name: 'Heilongjiang', name_zh: '黑龙江省' },
        { code: 'AH', name: 'Anhui', name_zh: '安徽省' },
        { code: 'JX', name: 'Jiangxi', name_zh: '江西省' },
        { code: 'HA', name: 'Henan', name_zh: '河南省' },
        { code: 'NM', name: 'Inner Mongolia', name_zh: '内蒙古自治区' },
      ],
      'US': [
        { code: 'CA', name: 'California', name_zh: '加利福尼亚州' },
        { code: 'NY', name: 'New York', name_zh: '纽约州' },
        { code: 'TX', name: 'Texas', name_zh: '德克萨斯州' },
        { code: 'FL', name: 'Florida', name_zh: '佛罗里达州' },
        { code: 'IL', name: 'Illinois', name_zh: '伊利诺伊州' },
        { code: 'PA', name: 'Pennsylvania', name_zh: '宾夕法尼亚州' },
        { code: 'OH', name: 'Ohio', name_zh: '俄亥俄州' },
        { code: 'GA', name: 'Georgia', name_zh: '佐治亚州' },
        { code: 'NC', name: 'North Carolina', name_zh: '北卡罗来纳州' },
        { code: 'MI', name: 'Michigan', name_zh: '密歇根州' },
      ],
      'GB': [
        { code: 'ENG', name: 'England', name_zh: '英格兰' },
        { code: 'SCT', name: 'Scotland', name_zh: '苏格兰' },
        { code: 'WLS', name: 'Wales', name_zh: '威尔士' },
        { code: 'NIR', name: 'Northern Ireland', name_zh: '北爱尔兰' },
      ],
    };

    return provinces[countryCode] || [];
  }
}
