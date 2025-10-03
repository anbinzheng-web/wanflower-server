/**
 * 密码加密功能使用示例
 * 
 * 本文件展示了如何在项目中使用密码加密相关功能
 * 包括PasswordService、PasswordUtil和全局函数的使用方法
 */

import { Injectable } from '@nestjs/common';
import { PasswordService } from '../services/password.service';
import { PasswordUtil, PasswordStrength } from '../utils/password.util';

@Injectable()
export class PasswordUsageExample {
  constructor(private readonly passwordService: PasswordService) {}

  /**
   * 示例1: 使用PasswordService进行密码操作
   */
  async exampleUsingPasswordService() {
    const plainPassword = 'MySecurePassword123!';

    try {
      // 加密密码
      const hashedPassword = await this.passwordService.hashPassword(plainPassword);
      console.log('加密后的密码:', hashedPassword);

      // 验证密码
      const isValid = await this.passwordService.verifyPassword(plainPassword, hashedPassword);
      console.log('密码验证结果:', isValid);

      // 检查是否需要重新加密
      const needsRehash = this.passwordService.needsRehash(hashedPassword);
      console.log('是否需要重新加密:', needsRehash);

      // 生成随机密码
      const randomPassword = this.passwordService.generateRandomPassword(16, true);
      console.log('生成的随机密码:', randomPassword);

    } catch (error) {
      console.error('密码操作失败:', error.message);
    }
  }

  /**
   * 示例2: 使用PasswordUtil工具类
   */
  async exampleUsingPasswordUtil() {
    const testPasswords = [
      'weak',
      'Password1',
      'MySecurePassword123!',
      'VeryComplexP@ssw0rd2024!'
    ];

    for (const password of testPasswords) {
      console.log(`\n检查密码: "${password}"`);
      
      // 检查密码强度
      const strengthResult = PasswordUtil.checkStrength(password);
      console.log('强度等级:', strengthResult.strength);
      console.log('强度分数:', strengthResult.score);
      console.log('是否有效:', strengthResult.isValid);
      console.log('改进建议:', strengthResult.feedback);

      if (strengthResult.isValid) {
        try {
          // 只对有效密码进行加密
          const hashedPassword = await PasswordUtil.hash(password);
          console.log('加密成功');

          // 验证密码
          const isValid = await PasswordUtil.verify(password, hashedPassword);
          console.log('验证结果:', isValid);
        } catch (error) {
          console.error('加密失败:', error.message);
        }
      }
    }

    // 生成安全密码示例
    console.log('\n生成安全密码示例:');
    
    // 默认设置
    const defaultPassword = PasswordUtil.generateSecurePassword();
    console.log('默认密码:', defaultPassword);

    // 自定义设置
    const customPassword = PasswordUtil.generateSecurePassword(16, {
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
      excludeSimilar: true
    });
    console.log('自定义密码:', customPassword);
  }

  /**
   * 示例3: 使用全局函数
   */
  async exampleUsingGlobalFunctions() {
    const password = 'GlobalFunctionTest123!';

    try {
      // 使用全局加密函数
      const hashedPassword = await globalThis.$hashPassword(password);
      console.log('全局函数加密结果:', hashedPassword);

      // 使用全局验证函数
      const isValid = await globalThis.$verifyPassword(password, hashedPassword);
      console.log('全局函数验证结果:', isValid);

      // 使用MD5函数（仅用于非密码场景）
      const fileContent = 'some file content';
      const md5Hash = globalThis.$md5(fileContent);
      console.log('文件内容MD5:', md5Hash);

    } catch (error) {
      console.error('全局函数操作失败:', error.message);
    }
  }

  /**
   * 示例4: 在用户注册中的实际应用
   */
  async exampleUserRegistration(email: string, plainPassword: string) {
    try {
      // 1. 检查密码强度
      const strengthCheck = PasswordUtil.checkStrength(plainPassword);
      
      if (!strengthCheck.isValid) {
        throw new Error(`密码不符合安全要求: ${strengthCheck.feedback.join(', ')}`);
      }

      // 2. 加密密码
      const hashedPassword = await this.passwordService.hashPassword(plainPassword);

      // 3. 保存用户信息（示例）
      const userData = {
        email,
        password: hashedPassword,
        passwordCreatedAt: new Date(),
        // 其他用户信息...
      };

      console.log('用户注册成功:', { email, passwordStrength: strengthCheck.strength });
      return userData;

    } catch (error) {
      console.error('用户注册失败:', error.message);
      throw error;
    }
  }

  /**
   * 示例5: 在用户登录中的实际应用
   */
  async exampleUserLogin(email: string, plainPassword: string, storedHashedPassword: string) {
    try {
      // 1. 验证密码
      const isPasswordValid = await this.passwordService.verifyPassword(
        plainPassword, 
        storedHashedPassword
      );

      if (!isPasswordValid) {
        throw new Error('密码错误');
      }

      // 2. 检查是否需要重新加密（安全性升级）
      const needsRehash = this.passwordService.needsRehash(storedHashedPassword);
      
      if (needsRehash) {
        console.log('检测到密码需要升级安全性，建议用户下次登录时更新密码');
        // 可以在后台重新加密密码或提示用户更新
      }

      console.log('用户登录成功:', email);
      return { success: true, needsPasswordUpdate: needsRehash };

    } catch (error) {
      console.error('用户登录失败:', error.message);
      throw error;
    }
  }

  /**
   * 示例6: 密码重置功能
   */
  async examplePasswordReset(userId: string) {
    try {
      // 1. 生成临时密码
      const temporaryPassword = PasswordUtil.generateSecurePassword(12, {
        includeSymbols: false, // 临时密码不包含特殊字符，便于用户输入
        excludeSimilar: true
      });

      // 2. 加密临时密码
      const hashedTempPassword = await this.passwordService.hashPassword(temporaryPassword);

      // 3. 更新数据库中的密码
      console.log('临时密码已生成:', temporaryPassword);
      console.log('请通过安全渠道发送给用户，并要求用户首次登录时修改密码');

      return {
        temporaryPassword,
        hashedPassword: hashedTempPassword,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      };

    } catch (error) {
      console.error('密码重置失败:', error.message);
      throw error;
    }
  }

  /**
   * 示例7: 批量密码强度检查
   */
  async exampleBatchPasswordCheck(passwords: string[]) {
    const results = passwords.map(password => {
      const strength = PasswordUtil.checkStrength(password);
      return {
        password,
        strength: strength.strength,
        score: strength.score,
        isValid: strength.isValid,
        feedback: strength.feedback
      };
    });

    // 统计结果
    const stats = {
      total: results.length,
      valid: results.filter(r => r.isValid).length,
      weak: results.filter(r => r.strength === PasswordStrength.WEAK).length,
      medium: results.filter(r => r.strength === PasswordStrength.MEDIUM).length,
      strong: results.filter(r => r.strength === PasswordStrength.STRONG).length,
      veryStrong: results.filter(r => r.strength === PasswordStrength.VERY_STRONG).length
    };

    console.log('密码强度统计:', stats);
    return { results, stats };
  }
}

