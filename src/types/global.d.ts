declare global {
  /**
   * 使用bcrypt安全加密密码
   * @param password 明文密码
   * @returns 加密后的密码哈希值
   */
  var $hashPassword: (password: string) => Promise<string>;

  /**
   * 验证密码是否匹配
   * @param password 明文密码
   * @param hashedPassword 已加密的密码哈希值
   * @returns 密码是否匹配
   */
  var $verifyPassword: (password: string, hashedPassword: string) => Promise<boolean>;

  /**
   * MD5哈希函数（仅用于非密码场景）
   * 警告：不要用于密码加密！
   * @param input 输入字符串
   * @returns MD5哈希值
   */
  var $md5: (input: string) => string;
}
