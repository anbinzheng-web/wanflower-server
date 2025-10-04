# Google OAuth2 配置指南

## 概述

Google OAuth2 功能已经实现但暂时被注释，需要配置Google开发者控制台信息后才能启用。

## 配置步骤

### 1. 创建Google Cloud项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 确保项目已启用计费（OAuth2需要）

### 2. 启用Google+ API

1. 在Google Cloud Console中，转到"API和服务" > "库"
2. 搜索"Google+ API"并启用
3. 或者启用"Google Identity" API（推荐）

### 3. 创建OAuth 2.0客户端ID

1. 转到"API和服务" > "凭据"
2. 点击"创建凭据" > "OAuth 2.0客户端ID"
3. 选择"Web应用程序"
4. 配置以下信息：
   - **名称**: Wanflower Auth
   - **授权重定向URI**: 
     - 开发环境: `http://localhost:3000/auth/google/callback`
     - 生产环境: `https://yourdomain.com/auth/google/callback`

### 4. 获取客户端凭据

创建完成后，你会获得：
- **客户端ID** (Client ID)
- **客户端密钥** (Client Secret)

### 5. 配置环境变量

在 `.env` 文件中添加：

```env
# Google OAuth2 配置
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# 前端URL（用于重定向）
FRONTEND_URL=http://localhost:3001
```

### 6. 启用Google OAuth2功能

配置完成后，需要取消注释以下文件中的代码：

#### 6.1 启用Google策略
```typescript
// src/auth/google.strategy.ts
// 取消注释整个文件内容
```

#### 6.2 启用AuthModule中的Google策略
```typescript
// src/auth/auth.module.ts
import { GoogleStrategy } from './google.strategy'; // 取消注释

providers: [
  AuthService, 
  JwtStrategy, 
  GoogleStrategy, // 取消注释
],
```

#### 6.3 启用AuthController中的Google路由
```typescript
// src/auth/auth.controller.ts
import { AuthGuard } from '@nestjs/passport'; // 取消注释

// 取消注释Google路由方法
@Get('google')
@ApiOperation({ summary: 'Google OAuth2 登录' })
@UseGuards(AuthGuard('google'))
async googleAuth() {
  // 这个方法会被Google策略拦截，重定向到Google登录页面
}

@Get('google/callback')
@ApiOperation({ summary: 'Google OAuth2 回调' })
@UseGuards(AuthGuard('google'))
async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
  // 处理Google回调逻辑
}
```

#### 6.4 启用AuthService中的Google用户处理
```typescript
// src/auth/auth.service.ts
// 取消注释 handleGoogleUser 方法
```

## 测试Google OAuth2

### 1. 启动应用
```bash
npm run start:dev
```

### 2. 测试Google登录
访问: `http://localhost:3000/auth/google`

### 3. 检查回调
确保回调URL正确配置并能正常处理Google返回的用户信息。

## 安全注意事项

1. **客户端密钥安全**: 永远不要在客户端代码中暴露客户端密钥
2. **HTTPS**: 生产环境必须使用HTTPS
3. **域名验证**: 确保重定向URI的域名已验证
4. **范围限制**: 只请求必要的用户信息权限

## 故障排除

### 常见错误

1. **redirect_uri_mismatch**: 检查回调URL是否与Google控制台中配置的一致
2. **invalid_client**: 检查客户端ID和密钥是否正确
3. **access_denied**: 用户拒绝了授权请求

### 调试步骤

1. 检查环境变量是否正确设置
2. 确认Google Cloud项目配置
3. 查看应用日志中的错误信息
4. 使用Google OAuth2 Playground测试配置

## 生产环境部署

1. 更新Google Cloud Console中的重定向URI为生产域名
2. 确保环境变量中的URL使用HTTPS
3. 测试完整的OAuth2流程
4. 监控登录成功率和错误率

## 相关文档

- [Google OAuth2 文档](https://developers.google.com/identity/protocols/oauth2)
- [Passport Google Strategy](https://github.com/jaredhanson/passport-google-oauth20)
- [NestJS Passport](https://docs.nestjs.com/recipes/passport)

---

**相关文档**:
- [认证系统模块](../modules/auth.md)
- [开发环境搭建](./setup.md)
- [部署指南](./deployment.md)

