# Swagger 响应装饰器最佳实践指南

## 概述

本指南基于 [NestJS 官方文档 - Advanced Generic ApiResponse](https://docs.nestjs.com/openapi/operations#advanced-generic-apiresponse) 和项目中的实际实现，说明如何正确使用 Swagger 响应装饰器。

## 核心原则

### 1. 使用自定义装饰器而非直接使用 @ApiResponse

**❌ 错误做法**：
```typescript
@ApiResponse({ status: 200, type: SwaggerApiResponse<UserDto> })
async getUser(): Promise<SwaggerApiResponse<UserDto>> {
  return { code: 0, data: user, message: 'success' };
}
```

**✅ 正确做法**：
```typescript
@ApiMessageResponse(UserDto)
async getUser(): Promise<UserDto> {
  return user;
}
```

### 2. 分离关注点

- **装饰器**：负责生成 Swagger 文档
- **方法**：直接返回业务数据，由拦截器统一包装

## 自定义装饰器实现

### ApiPaginatedResponse 装饰器

```typescript
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedDto, model),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedDto) },
          {
            properties: {
              records: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
```

**关键特性**：
- 使用 `ApiExtraModels` 注册相关模型
- 使用 `allOf` 组合模式组合 `PaginatedDto` 和具体模型
- 动态生成 `records` 数组的类型引用

### ApiMessageResponse 装饰器

```typescript
export const ApiMessageResponse = <TModel extends Type<any>>(
  model?: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(MessageDto, model || class {}),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(MessageDto) },
        ],
        properties: {
          data: {
            $ref: getSchemaPath(model || class {}),
          },
        },
      },
    }),
  );
};
```

**关键特性**：
- 支持可选的模型参数
- 使用 `allOf` 组合 `MessageDto` 字段
- 动态设置 `data` 字段的类型引用

## 在控制器中的使用

### 分页接口

```typescript
@Get()
@ApiPaginatedResponse(UserResponseDto)
async getUsers(@Query() query: GetUsersQueryDto): Promise<PaginatedData<UserResponseDto>> {
  const result = await this.userService.getUsers(query);
  return {
    ...result,
    records: result.records.map(user => ({
      ...user,
      first_name: user.first_name || undefined,
      // ... 其他字段处理
    }))
  };
}
```

**特点**：
- 直接返回 `PaginatedData<T>` 结构
- 不需要手动包装响应
- Swagger 文档自动生成正确的分页结构

### 单个数据接口

```typescript
@Get(':id')
@ApiMessageResponse(UserResponseDto)
async getUserById(@Param('id', ParseIntPipe) id: number): Promise<UserResponseDto> {
  const user = await this.userService.getUserById(id);
  return {
    ...user,
    first_name: user.first_name || undefined,
    // ... 其他字段处理
  };
}
```

**特点**：
- 直接返回具体的数据类型
- 装饰器自动生成包含 `code`、`data`、`message` 的完整响应结构

### 简单消息接口

```typescript
@Put(':id/verify-email')
@ApiMessageResponse()
async verifyUserEmail(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
  await this.userService.verifyUserEmail(id);
  return { message: '用户邮箱已验证' };
}
```

**特点**：
- 不传模型参数，用于简单消息响应
- 直接返回业务数据，由拦截器统一包装

### 删除接口

```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
@ApiMessageResponse()
async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
  await this.userService.deleteUserByAdmin(id);
}
```

**特点**：
- 使用 `@HttpCode(HttpStatus.NO_CONTENT)` 设置 204 状态码
- 返回 `Promise<void>`

## 基础 DTO 定义

### MessageDto

```typescript
export class MessageDto<TData> {
  @ApiProperty()
  code: number;

  @ApiProperty()
  message: string;

  data: TData;
}
```

### PaginatedDto

```typescript
export class PaginatedDto<TData> {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  page_size: number;

  records: TData[];
}
```

## 优势对比

### 传统方式的问题

1. **代码冗余**：每个方法都需要手动构造响应结构
2. **类型不一致**：方法返回类型与 Swagger 文档不匹配
3. **维护困难**：响应结构变更需要修改多个地方

### 新方式的优势

1. **代码简洁**：方法直接返回业务数据
2. **类型安全**：TypeScript 类型与 Swagger 文档完全一致
3. **分离关注点**：装饰器负责文档，拦截器负责包装
4. **易于维护**：响应结构变更只需修改装饰器或拦截器

## 迁移指南

### 步骤 1：创建自定义装饰器

在 `shared/decorators/api-paginated-response.ts` 中实现装饰器。

### 步骤 2：更新控制器

1. 导入自定义装饰器
2. 替换 `@ApiResponse` 为 `@ApiPaginatedResponse` 或 `@ApiMessageResponse`
3. 修改方法返回类型为直接的数据类型
4. 移除手动构造的响应结构

### 步骤 3：验证效果

1. 重新启动应用
2. 访问 Swagger 文档
3. 验证响应结构是否正确显示

## 最佳实践总结

1. **优先使用自定义装饰器**：`@ApiPaginatedResponse` 和 `@ApiMessageResponse`
2. **方法直接返回业务数据**：不要手动包装响应结构
3. **保持类型一致性**：TypeScript 类型与 Swagger 文档必须一致
4. **遵循官方模式**：基于 [NestJS 官方文档](https://docs.nestjs.com/openapi/operations#advanced-generic-apiresponse) 的最佳实践
5. **分离关注点**：装饰器负责文档，拦截器负责响应包装

## 参考资源

- [NestJS OpenAPI Operations - Advanced Generic ApiResponse](https://docs.nestjs.com/openapi/operations#advanced-generic-apiresponse)
- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)

---

**相关文档**:
- [代码规范](./coding-standards.md)
- [API设计规范](../architecture/api-standards.md)
- [开发环境搭建](./setup.md)

