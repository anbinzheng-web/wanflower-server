# 密码加密功能使用指南

本项目提供了符合业界最佳实践的密码加密功能，使用bcrypt算法确保密码安全。

## 功能特性

- ✅ 使用bcrypt算法，安全性高
- ✅ 自动盐值生成，防止彩虹表攻击
- ✅ 可配置的盐值轮数（默认12轮）
- ✅ 密码强度检查和评分
- ✅ 安全的随机密码生成
- ✅ 密码重新加密检查
- ✅ 全局函数支持
- ✅ 完整的TypeScript类型支持

## 使用方式

### 1. 使用PasswordService（推荐）

```typescript
import { Injectable } from '@nestjs/common';
import { PasswordService } from 'shared/services/password.service';

@Injectable()
export class UserService {
  constructor(private readonly passwordService: PasswordService) {}

  async createUser(email: string, password: string) {
    // 加密密码
    const hashedPassword = await this.passwordService.hashPassword(password);
    
    // 保存用户...
    return { email, password: hashedPassword };
  }

  async validateUser(email: string, password: string, hashedPassword: string) {
    // 验证密码
    const isValid = await this.passwordService.verifyPassword(password, hashedPassword);
    return isValid;
  }
}
```

### 2. 使用PasswordUtil工具类

```typescript
import { PasswordUtil, PasswordStrength } from 'shared/utils/password.util';

// 检查密码强度
const strengthResult = PasswordUtil.checkStrength('MyPassword123!');
console.log(strengthResult);
// {
//   strength: 'strong',
//   score: 85,
//   isValid: true,
//   feedback: []
// }

// 生成安全密码
const randomPassword = PasswordUtil.generateSecurePassword(16);
console.log(randomPassword); // "Kx9#mP2$vN8@qR5!"

// 加密和验证
const hashedPassword = await PasswordUtil.hash('mypassword');
const isValid = await PasswordUtil.verify('mypassword', hashedPassword);
```

### 3. 使用全局函数

```typescript
// 在任何地方都可以使用全局函数
const hashedPassword = await globalThis.$hashPassword('mypassword');
const isValid = await globalThis.$verifyPassword('mypassword', hashedPassword);

// MD5函数（仅用于非密码场景）
const fileHash = globalThis.$md5('file content');
```

## 密码强度要求

默认的密码强度要求：

- 最少8位，最多128位
- 必须包含小写字母
- 必须包含大写字母  
- 必须包含数字
- 必须包含特殊字符
- 不能是常见弱密码
- 避免连续重复字符
- 避免连续字符序列

## 密码强度等级

| 等级 | 分数范围 | 描述 |
|------|----------|------|
| WEAK | 0-39 | 弱密码，不建议使用 |
| MEDIUM | 40-59 | 中等强度，建议改进 |
| STRONG | 60-79 | 强密码，安全性良好 |
| VERY_STRONG | 80-100 | 非常强的密码，安全性极佳 |

## 安全最佳实践

### 1. 密码存储
```typescript
// ✅ 正确：使用bcrypt加密
const hashedPassword = await passwordService.hashPassword(plainPassword);
await userRepository.save({ email, password: hashedPassword });

// ❌ 错误：明文存储
await userRepository.save({ email, password: plainPassword });

// ❌ 错误：使用MD5
const md5Password = globalThis.$md5(plainPassword);
```

### 2. 密码验证
```typescript
// ✅ 正确：使用bcrypt验证
const isValid = await passwordService.verifyPassword(inputPassword, storedHash);

// ❌ 错误：直接比较
const isValid = inputPassword === storedPassword;
```

### 3. 密码重置
```typescript
// ✅ 正确：生成安全的临时密码
const tempPassword = passwordService.generateRandomPassword(12);
const hashedTempPassword = await passwordService.hashPassword(tempPassword);

// 通过安全渠道发送临时密码给用户
await sendSecureEmail(email, tempPassword);
```

### 4. 密码升级
```typescript
// 检查是否需要重新加密（当盐值轮数增加时）
if (passwordService.needsRehash(storedHash)) {
  const newHash = await passwordService.hashPassword(plainPassword);
  await updateUserPassword(userId, newHash);
}
```

## 配置选项

### PasswordService配置

可以通过修改`PasswordService`中的`saltRounds`来调整安全级别：

```typescript
// 在password.service.ts中
private readonly saltRounds = 12; // 可调整为10-15
```

### 密码生成选项

```typescript
const password = PasswordUtil.generateSecurePassword(16, {
  includeUppercase: true,    // 包含大写字母
  includeLowercase: true,    // 包含小写字母
  includeNumbers: true,      // 包含数字
  includeSymbols: true,      // 包含特殊字符
  excludeSimilar: true       // 排除相似字符(0O, 1lI等)
});
```

## 性能考虑

- bcrypt的盐值轮数直接影响加密性能
- 推荐值：12轮（平衡安全性和性能）
- 高安全要求：14轮
- 低延迟要求：10轮

## 错误处理

```typescript
try {
  const hashedPassword = await passwordService.hashPassword(password);
} catch (error) {
  if (error.message.includes('密码长度')) {
    // 处理密码长度错误
  } else if (error.message.includes('必须包含')) {
    // 处理密码强度错误
  } else {
    // 处理其他错误
  }
}
```

## 迁移指南

### 从MD5迁移到bcrypt

如果你的项目之前使用MD5，可以这样迁移：

```typescript
// 1. 在用户登录时检测旧密码格式
async function migratePassword(email: string, plainPassword: string) {
  const user = await findUserByEmail(email);
  
  // 检查是否是MD5格式（32位十六进制）
  if (user.password.length === 32 && /^[a-f0-9]+$/i.test(user.password)) {
    // 验证MD5密码
    const md5Hash = globalThis.$md5(plainPassword);
    if (md5Hash === user.password) {
      // 升级为bcrypt
      const newHash = await passwordService.hashPassword(plainPassword);
      await updateUserPassword(user.id, newHash);
      return true;
    }
  } else {
    // 使用bcrypt验证
    return await passwordService.verifyPassword(plainPassword, user.password);
  }
  
  return false;
}
```

## 测试示例

参考 `src/shared/examples/password-usage.example.ts` 文件查看完整的使用示例。

## 安全审计

定期检查以下项目：

1. 密码强度要求是否符合最新安全标准
2. 盐值轮数是否需要调整
3. 是否有用户使用弱密码
4. 密码是否定期更新

## 常见问题

### Q: 为什么不使用MD5或SHA1？
A: MD5和SHA1算法速度快，容易被暴力破解和彩虹表攻击。bcrypt专为密码设计，包含盐值和可调整的计算成本。

### Q: 盐值轮数应该设置多少？
A: 推荐12轮。可根据服务器性能和安全要求调整（10-15轮）。

### Q: 如何处理忘记密码？
A: 永远不要发送原始密码。生成临时密码或重置链接，要求用户设置新密码。

### Q: 密码验证失败怎么办？
A: 不要在错误信息中透露具体原因（如"用户不存在"vs"密码错误"），统一返回"用户名或密码错误"。

