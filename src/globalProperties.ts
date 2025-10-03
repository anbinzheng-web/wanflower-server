import * as bcrypt from 'bcrypt';

/**
 * 注册全局属性和工具函数
 * 提供安全的密码处理功能
 */
export function registerGlobalProperties() {
    // 使用bcrypt进行安全的密码加密
    globalThis.$hashPassword = async (password: string): Promise<string> => {
        if (!password) {
            throw new Error('密码不能为空');
        }
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    };

    // 验证密码
    globalThis.$verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
        if (!password || !hashedPassword) {
            return false;
        }
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            console.error('密码验证失败:', error);
            return false;
        }
    };

    // 保留MD5函数用于非密码场景（如文件哈希等）
    // 注意：不要用于密码加密！
    globalThis.$md5 = (input: string): string => {
        const crypto = require('crypto');
        const md5 = crypto.createHash('md5');
        return md5.update(input).digest('hex');
    };
}