import * as bcrypt from 'bcrypt';

/**
 * 密码强度等级
 */
export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
  VERY_STRONG = 'very_strong'
}

/**
 * 密码强度检查结果
 */
export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-100分
  feedback: string[];
  isValid: boolean;
}

/**
 * 密码工具类
 * 提供密码加密、验证、强度检查等功能
 */
export class PasswordUtil {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MIN_LENGTH = 8;
  private static readonly MAX_LENGTH = 128;

  /**
   * 加密密码
   * @param plainPassword 明文密码
   * @returns 加密后的密码哈希值
   */
  static async hash(plainPassword: string): Promise<string> {
    if (!plainPassword) {
      throw new Error('密码不能为空');
    }

    if (plainPassword.length < this.MIN_LENGTH) {
      throw new Error(`密码长度不能少于${this.MIN_LENGTH}位`);
    }

    if (plainPassword.length > this.MAX_LENGTH) {
      throw new Error(`密码长度不能超过${this.MAX_LENGTH}位`);
    }

    return await bcrypt.hash(plainPassword, this.SALT_ROUNDS);
  }

  /**
   * 验证密码
   * @param plainPassword 明文密码
   * @param hashedPassword 已加密的密码哈希值
   * @returns 密码是否匹配
   */
  static async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
    if (!plainPassword || !hashedPassword) {
      return false;
    }

    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('密码验证失败:', error);
      return false;
    }
  }

  /**
   * 检查密码是否需要重新加密
   * @param hashedPassword 已加密的密码哈希值
   * @returns 是否需要重新加密
   */
  static needsRehash(hashedPassword: string): boolean {
    try {
      const currentRounds = bcrypt.getRounds(hashedPassword);
      return currentRounds < this.SALT_ROUNDS;
    } catch (error) {
      return true;
    }
  }

  /**
   * 检查密码强度
   * @param password 待检查的密码
   * @returns 密码强度检查结果
   */
  static checkStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length >= 8) {
      score += 20;
    } else {
      feedback.push('密码长度至少需要8位');
    }

    if (password.length >= 12) {
      score += 10;
    }

    // 字符类型检查
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    if (hasLowercase) {
      score += 15;
    } else {
      feedback.push('需要包含小写字母');
    }

    if (hasUppercase) {
      score += 15;
    } else {
      feedback.push('需要包含大写字母');
    }

    if (hasNumbers) {
      score += 15;
    } else {
      feedback.push('需要包含数字');
    }

    if (hasSymbols) {
      score += 15;
    } else {
      feedback.push('建议包含特殊字符');
    }

    // 复杂度检查
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
      score += 10;
    }

    // 常见密码检查
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      '12345678', '123456789', 'password1', 'abc123', '111111',
      'welcome', 'monkey', 'dragon', 'letmein', 'trustno1'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      score = Math.min(score, 30);
      feedback.push('不能使用常见密码');
    }

    // 重复字符检查
    const hasRepeatedChars = /(.)\1{2,}/.test(password);
    if (hasRepeatedChars) {
      score -= 10;
      feedback.push('避免连续重复字符');
    }

    // 连续字符检查
    const hasSequentialChars = this.hasSequentialChars(password);
    if (hasSequentialChars) {
      score -= 10;
      feedback.push('避免连续字符序列');
    }

    // 确保分数在0-100范围内
    score = Math.max(0, Math.min(100, score));

    // 确定强度等级
    let strength: PasswordStrength;
    if (score >= 80) {
      strength = PasswordStrength.VERY_STRONG;
    } else if (score >= 60) {
      strength = PasswordStrength.STRONG;
    } else if (score >= 40) {
      strength = PasswordStrength.MEDIUM;
    } else {
      strength = PasswordStrength.WEAK;
    }

    const isValid = score >= 60 && feedback.length === 0;

    return {
      strength,
      score,
      feedback,
      isValid
    };
  }

  /**
   * 生成安全的随机密码
   * @param length 密码长度，默认12位
   * @param options 生成选项
   * @returns 生成的随机密码
   */
  static generateSecurePassword(
    length: number = 12,
    options: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSymbols?: boolean;
      excludeSimilar?: boolean; // 排除相似字符如0O, 1lI
    } = {}
  ): string {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true
    } = options;

    let lowercase = 'abcdefghijklmnopqrstuvwxyz';
    let uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let numbers = '0123456789';
    let symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // 排除相似字符
    if (excludeSimilar) {
      lowercase = lowercase.replace(/[il]/g, '');
      uppercase = uppercase.replace(/[IO]/g, '');
      numbers = numbers.replace(/[01]/g, '');
    }

    let charset = '';
    const requiredChars: string[] = [];

    if (includeLowercase) {
      charset += lowercase;
      requiredChars.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
    }

    if (includeUppercase) {
      charset += uppercase;
      requiredChars.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
    }

    if (includeNumbers) {
      charset += numbers;
      requiredChars.push(numbers[Math.floor(Math.random() * numbers.length)]);
    }

    if (includeSymbols) {
      charset += symbols;
      requiredChars.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }

    if (charset === '') {
      throw new Error('至少需要选择一种字符类型');
    }

    // 生成剩余字符
    let password = [...requiredChars];
    for (let i = requiredChars.length; i < length; i++) {
      password.push(charset[Math.floor(Math.random() * charset.length)]);
    }

    // 打乱字符顺序
    for (let i = password.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
  }

  /**
   * 检查是否包含连续字符
   * @param password 密码
   * @returns 是否包含连续字符
   * @private
   */
  private static hasSequentialChars(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    for (const sequence of sequences) {
      for (let i = 0; i <= sequence.length - 3; i++) {
        const subseq = sequence.substring(i, i + 3);
        if (password.includes(subseq) || password.includes(subseq.split('').reverse().join(''))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 生成密码哈希的时间戳
   * 用于密码过期策略
   * @param hashedPassword 已加密的密码
   * @returns 密码创建时间戳（如果无法获取则返回null）
   */
  static getPasswordTimestamp(hashedPassword: string): Date | null {
    try {
      // bcrypt哈希值不包含时间戳信息
      // 这里可以扩展为在数据库中单独存储密码创建时间
      // 或者使用自定义格式在哈希值中嵌入时间戳
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 检查密码是否过期
   * @param passwordCreatedAt 密码创建时间
   * @param maxAgeInDays 最大有效期（天）
   * @returns 是否过期
   */
  static isPasswordExpired(passwordCreatedAt: Date, maxAgeInDays: number = 90): boolean {
    const now = new Date();
    const ageInMs = now.getTime() - passwordCreatedAt.getTime();
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
    return ageInDays > maxAgeInDays;
  }
}

