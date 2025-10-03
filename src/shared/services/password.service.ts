import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

/**
 * 密码加密服务
 * 使用bcrypt算法进行密码哈希，符合业界安全最佳实践
 */
@Injectable()
export class PasswordService {
  // bcrypt盐值轮数，推荐值为12-14，平衡安全性和性能
  private readonly saltRounds = 12;

  /**
   * 加密密码
   * @param plainPassword 明文密码
   * @returns 加密后的密码哈希值
   */
  async hashPassword(plainPassword: string): Promise<string> {
    if (!plainPassword) {
      throw new Error('密码不能为空');
    }

    // 验证密码强度（可选，根据业务需求调整）
    this.validatePasswordStrength(plainPassword);

    try {
      // 使用bcrypt生成盐值并加密密码
      const hashedPassword = await bcrypt.hash(plainPassword, this.saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error(`密码加密失败: ${error.message}`);
    }
  }

  /**
   * 验证密码
   * @param plainPassword 明文密码
   * @param hashedPassword 已加密的密码哈希值
   * @returns 密码是否匹配
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    if (!plainPassword || !hashedPassword) {
      return false;
    }

    try {
      // 使用bcrypt比较密码
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (error) {
      // 记录错误但不抛出，避免泄露敏感信息
      console.error('密码验证过程中发生错误:', error);
      return false;
    }
  }

  /**
   * 检查密码是否需要重新加密
   * 当盐值轮数增加时，旧密码需要重新加密
   * @param hashedPassword 已加密的密码哈希值
   * @returns 是否需要重新加密
   */
  needsRehash(hashedPassword: string): boolean {
    try {
      // 获取当前哈希值的盐值轮数
      const currentRounds = bcrypt.getRounds(hashedPassword);
      return currentRounds < this.saltRounds;
    } catch (error) {
      // 如果无法解析哈希值，建议重新加密
      return true;
    }
  }

  /**
   * 生成随机密码
   * @param length 密码长度，默认12位
   * @param includeSymbols 是否包含特殊符号，默认true
   * @returns 生成的随机密码
   */
  generateRandomPassword(length: number = 12, includeSymbols: boolean = true): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charset = lowercase + uppercase + numbers;
    if (includeSymbols) {
      charset += symbols;
    }

    let password = '';
    
    // 确保密码包含至少一个小写字母、大写字母和数字
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    if (includeSymbols) {
      password += symbols[Math.floor(Math.random() * symbols.length)];
    }

    // 填充剩余长度
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // 打乱密码字符顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * 验证密码强度
   * @param password 待验证的密码
   * @private
   */
  private validatePasswordStrength(password: string): void {
    const minLength = 8;
    const maxLength = 128;

    if (password.length < minLength) {
      throw new Error(`密码长度不能少于${minLength}位`);
    }

    if (password.length > maxLength) {
      throw new Error(`密码长度不能超过${maxLength}位`);
    }

    // 检查是否包含至少一个小写字母
    if (!/[a-z]/.test(password)) {
      throw new Error('密码必须包含至少一个小写字母');
    }

    // 检查是否包含至少一个大写字母
    if (!/[A-Z]/.test(password)) {
      throw new Error('密码必须包含至少一个大写字母');
    }

    // 检查是否包含至少一个数字
    if (!/\d/.test(password)) {
      throw new Error('密码必须包含至少一个数字');
    }

    // 检查是否包含至少一个特殊字符（可选，根据业务需求调整）
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      throw new Error('密码必须包含至少一个特殊字符');
    }

    // 检查常见弱密码
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      '12345678', '123456789', 'password1', 'abc123'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      throw new Error('不能使用常见的弱密码');
    }
  }
}

