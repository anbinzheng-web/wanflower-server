# 代码规范

## 概述

本文档定义了万花电商系统的代码规范，确保代码质量、可维护性和团队协作效率。

## TypeScript 规范

### 基本原则
- 始终为每个变量和函数声明类型
- 避免使用 `any` 类型
- 创建必要的类型定义
- 函数内部不要留空行
- 每个文件只导出一个内容

### 命名规范

#### 通用规则
- **类**: PascalCase (`UserService`, `ProductController`)
- **变量/函数**: camelCase (`userName`, `getUserById`)
- **文件/目录**: kebab-case (`user-service.ts`, `product-controller.ts`)
- **环境变量**: UPPER_SNAKE_CASE (`DATABASE_URL`, `JWT_SECRET`)
- **常量**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`)

#### 特殊命名
- **布尔变量**: 使用动词开头 (`isLoading`, `hasError`, `canDelete`)
- **函数命名**: 以动词开头 (`getUser`, `createProduct`, `updateOrder`)
- **接口**: 以 `I` 开头或描述性名称 (`IUser`, `ProductData`)
- **类型**: 以 `T` 开头或描述性名称 (`TUserRole`, `ApiResponse`)

### 函数规范

#### 函数设计原则
- 编写短小的函数，每个函数只做一件事
- 函数长度不超过20行
- 使用默认参数值，而不是检查 null 或 undefined
- 使用 RO-RO 原则减少函数参数

#### 函数示例
```typescript
// ✅ 好的示例
const createUser = async (userData: CreateUserDto): Promise<User> => {
  const hashedPassword = await hashPassword(userData.password);
  const user = await this.userRepository.create({
    ...userData,
    password: hashedPassword,
  });
  return user;
};

// ❌ 不好的示例
const createUser = async (name, email, password, role, isActive) => {
  // 参数过多，没有类型定义
  if (password) {
    // 应该使用默认参数
    const hashed = await hash(password);
    // ...
  }
};
```

### 类规范

#### 类设计原则
- 遵循 SOLID 原则
- 优先使用组合而非继承
- 使用接口定义契约
- 类长度不超过200行
- 公共方法不超过10个

#### 类示例
```typescript
// ✅ 好的示例
interface IUserService {
  createUser(userData: CreateUserDto): Promise<User>;
  getUserById(id: number): Promise<User>;
  updateUser(id: number, userData: UpdateUserDto): Promise<User>;
}

@Injectable()
export class UserService implements IUserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    // 实现逻辑
  }
}
```

### 异常处理

#### 异常处理原则
- 使用异常处理意外错误
- 捕获异常时必须用于修复预期问题或添加上下文
- 其他情况使用全局异常处理器

#### 异常示例
```typescript
// ✅ 好的示例
async getUserById(id: number): Promise<User> {
  try {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }
    return user;
  } catch (error) {
    this.logger.error(`获取用户失败: ${error.message}`, error.stack);
    throw new InternalServerErrorException('获取用户信息失败');
  }
}
```

## NestJS 规范

### 模块化架构

#### 模块组织
- 每个主要领域一个模块 (如 `ProductModule`, `OrderModule`)
- 每个路由一个控制器
- 业务逻辑封装在服务中
- 数据访问封装在仓储中

#### 模块示例
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductCategory]),
    SharedModule,
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService],
})
export class ProductModule {}
```

### 控制器规范

#### 控制器设计
- 使用 Swagger 装饰器生成API文档
- 统一的响应格式
- 适当的HTTP状态码
- 输入验证使用 DTO

#### 控制器示例
```typescript
@ApiTags('产品管理')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('list')
  @ApiOperation({ summary: '获取产品列表' })
  @ApiPaginatedResponse(ProductDto)
  async getProductList(
    @Query() query: GetProductListDto,
  ): Promise<PaginatedData<ProductDto>> {
    return this.productService.getProductList(query);
  }

  @Post()
  @ApiOperation({ summary: '创建产品' })
  @ApiMessageResponse(ProductDto)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductDto> {
    return this.productService.createProduct(createProductDto);
  }
}
```

### 服务规范

#### 服务设计
- 单一职责原则
- 依赖注入
- 错误处理
- 日志记录

#### 服务示例
```typescript
@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly logger: Logger,
  ) {}

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    this.logger.log(`创建产品: ${createProductDto.name}`);
    
    try {
      const product = await this.productRepository.create(createProductDto);
      this.logger.log(`产品创建成功: ${product.id}`);
      return product;
    } catch (error) {
      this.logger.error(`产品创建失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('产品创建失败');
    }
  }
}
```

### DTO 规范

#### DTO 设计
- 使用 class-validator 进行验证
- 使用 Swagger 装饰器生成文档
- 清晰的字段说明
- 适当的验证规则

#### DTO 示例
```typescript
export class CreateProductDto {
  @ApiProperty({ description: '产品名称', example: 'iPhone 15 Pro' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: '产品描述', example: '最新款iPhone' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  description?: string;

  @ApiProperty({ description: '产品价格', example: 999.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ description: '产品分类ID', example: 1 })
  @IsNumber()
  @IsPositive()
  categoryId: number;
}
```

## 数据库规范

### Prisma 规范

#### Schema 设计
- 使用描述性的表名和字段名
- 适当的索引设计
- 外键关系定义
- 数据类型选择

#### Schema 示例
```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String   @db.VarChar(255)
  description String?  @db.Text
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // 关系
  category    ProductCategory @relation(fields: [categoryId], references: [id])
  categoryId  Int             @map("category_id")
  
  // 索引
  @@index([categoryId])
  @@index([isActive])
  @@map("products")
}
```

### 查询规范

#### 查询优化
- 使用适当的 include 和 select
- 避免 N+1 查询问题
- 使用分页查询
- 适当的错误处理

#### 查询示例
```typescript
// ✅ 好的示例
async getProductList(query: GetProductListDto): Promise<PaginatedData<Product>> {
  const { page, pageSize, categoryId, keyword } = query;
  
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(categoryId && { categoryId }),
    ...(keyword && {
      OR: [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      where,
      include: { category: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.product.count({ where }),
  ]);

  return {
    records: products,
    total,
    page,
    pageSize,
  };
}
```

## 测试规范

### 测试原则
- 遵循 Arrange-Act-Assert 规范
- 测试变量命名清晰
- 为每个公共函数编写单元测试
- 使用测试替身模拟依赖

### 测试示例
```typescript
describe('ProductService', () => {
  let service: ProductService;
  let productRepository: jest.Mocked<ProductRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    productRepository = module.get(ProductRepository);
  });

  describe('createProduct', () => {
    it('应该成功创建产品', async () => {
      // Arrange
      const createProductDto: CreateProductDto = {
        name: '测试产品',
        price: 99.99,
        categoryId: 1,
      };
      const expectedProduct: Product = {
        id: 1,
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      productRepository.create.mockResolvedValue(expectedProduct);

      // Act
      const result = await service.createProduct(createProductDto);

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(productRepository.create).toHaveBeenCalledWith(createProductDto);
    });
  });
});
```

## 文档规范

### 代码注释
- 使用中文注释
- 解释复杂的业务逻辑
- 说明重要的设计决策
- 保持注释的时效性

### 注释示例
```typescript
/**
 * 创建产品
 * @param createProductDto 产品创建数据
 * @returns 创建的产品信息
 */
async createProduct(createProductDto: CreateProductDto): Promise<Product> {
  // 验证产品名称是否重复
  const existingProduct = await this.productRepository.findByName(
    createProductDto.name,
  );
  if (existingProduct) {
    throw new ConflictException('产品名称已存在');
  }

  // 创建产品记录
  const product = await this.productRepository.create(createProductDto);
  
  // 记录操作日志
  this.logger.log(`产品创建成功: ${product.id}`);
  
  return product;
}
```

## 工具配置

### ESLint 配置
```json
{
  "extends": [
    "@nestjs/eslint-config",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### Prettier 配置
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

---

**相关文档**:
- [系统概览](../architecture/overview.md)
- [开发环境搭建](./setup.md)
- [测试指南](./testing.md)

