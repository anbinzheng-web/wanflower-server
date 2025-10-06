import { PrismaClient } from '@prisma/client'
import { registerGlobalProperties } from '../src/globalProperties';

registerGlobalProperties();
const prisma = new PrismaClient()

// 环境检测
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

async function main() {
  console.log(`🌱 开始数据库种子数据生成...`);
  console.log(`📊 当前环境: ${isProduction ? '生产环境' : isDevelopment ? '开发环境' : '测试环境'}`);
  
  // 使用全局注册的密码加密函数
  const password = await global.$hashPassword('Qpalzm1.');
  
  if (isProduction) {
    await seedProductionData(password);
  } else {
    await seedDevelopmentData(password);
  }
}

// 生产环境数据 - 只创建必要的基础数据
async function seedProductionData(password: string) {
  console.log('🏭 创建生产环境基础数据...');
  
  // 只创建管理员账号
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wanflower.com' },
    update: {
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Admin',
      last_name: 'User',
    },
    create: {
      email: 'admin@wanflower.com',
      role: 'admin',
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Admin',
      last_name: 'User',
    },
  });

  console.log('✅ 生产环境管理员账号创建完成:', { 
    email: admin.email, 
    role: admin.role, 
    verified: admin.is_verified 
  });
  
  console.log('📋 生产环境账号信息:');
  console.log('管理员账号: admin@wanflower.com');
  console.log('密码: Qpalzm1.');
  console.log('⚠️  请在生产环境中及时修改默认密码！');
}

// 开发/测试环境数据 - 创建完整的测试数据
async function seedDevelopmentData(password: string) {
  console.log('🧪 创建开发环境测试数据...');
  
  // 1. 创建用户数据
  const users = await createTestUsers(password);
  
  // 2. 创建产品分类数据
  const categories = await createProductCategories();
  
  // 3. 创建产品数据
  const products = await createTestProducts(categories);
  
  // 4. 创建博客数据
  await createBlogData();
  
  // 5. 创建订单和购物车数据
  await createOrderData(users, products);
  
  // 6. 创建评论数据
  await createReviewData(users, products);
  
  console.log('✅ 开发环境测试数据创建完成');
  printTestAccountInfo();
}

// 创建测试用户
async function createTestUsers(password: string) {
  console.log('👥 创建测试用户...');
  
  const users: any[] = [];
  
  // 管理员账号
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Admin',
      last_name: 'User',
    },
    create: {
      email: 'admin@gmail.com',
      role: 'admin',
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Admin',
      last_name: 'User',
    },
  });
  users.push(admin);

  // 员工账号
  const staff = await prisma.user.upsert({
    where: { email: 'staff@gmail.com' },
    update: {
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Staff',
      last_name: 'User',
    },
    create: {
      email: 'staff@gmail.com',
      password: password,
      role: 'staff',
      is_verified: true,
      is_active: true,
      first_name: 'Staff',
      last_name: 'User',
    },
  });
  users.push(staff);

  // 普通用户账号
  const user = await prisma.user.upsert({
    where: { email: 'user@gmail.com' },
    update: {
      password: password,
      is_verified: true,
      is_active: true,
      first_name: 'Test',
      last_name: 'User',
    },
    create: {
      email: 'user@gmail.com',
      password: password,
      role: 'user',
      is_verified: true,
      is_active: true,
      first_name: 'Test',
      last_name: 'User',
    },
  });
  users.push(user);

  // 未验证的测试账号
  const unverifiedUser = await prisma.user.upsert({
    where: { email: 'unverified@gmail.com' },
    update: {
      password: password,
      is_verified: false,
      is_active: true,
      first_name: 'Unverified',
      last_name: 'User',
    },
    create: {
      email: 'unverified@gmail.com',
      password: password,
      role: 'user',
      is_verified: false,
      is_active: true,
      first_name: 'Unverified',
      last_name: 'User',
    },
  });
  users.push(unverifiedUser);

  // 被禁用的测试账号
  const disabledUser = await prisma.user.upsert({
    where: { email: 'disabled@gmail.com' },
    update: {
      password: password,
      is_verified: true,
      is_active: false,
      first_name: 'Disabled',
      last_name: 'User',
    },
    create: {
      email: 'disabled@gmail.com',
      password: password,
      role: 'user',
      is_verified: true,
      is_active: false,
      first_name: 'Disabled',
      last_name: 'User',
    },
  });
  users.push(disabledUser);

  // 创建邮箱验证码
  await createVerificationCodes();

  return users;
}

// 创建产品分类
async function createProductCategories() {
  console.log('📂 创建产品分类...');
  
  // 创建主分类
  const electronics = await prisma.productCategory.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: '电子产品',
      slug: 'electronics',
      description: '各种电子设备和配件',
      sort_order: 1,
      is_active: true,
    },
  });

  const clothing = await prisma.productCategory.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: '服装配饰',
      slug: 'clothing',
      description: '时尚服装和配饰',
      sort_order: 2,
      is_active: true,
    },
  });

  const home = await prisma.productCategory.upsert({
    where: { slug: 'home-garden' },
    update: {},
    create: {
      name: '家居园艺',
      slug: 'home-garden',
      description: '家居用品和园艺工具',
      sort_order: 3,
      is_active: true,
    },
  });

  // 创建子分类
  const smartphones = await prisma.productCategory.upsert({
    where: { slug: 'smartphones' },
    update: {},
    create: {
      name: '智能手机',
      slug: 'smartphones',
      description: '各种品牌智能手机',
      parent_id: electronics.id,
      sort_order: 1,
      is_active: true,
    },
  });

  const laptops = await prisma.productCategory.upsert({
    where: { slug: 'laptops' },
    update: {},
    create: {
      name: '笔记本电脑',
      slug: 'laptops',
      description: '各种品牌笔记本电脑',
      parent_id: electronics.id,
      sort_order: 2,
      is_active: true,
    },
  });

  return { electronics, clothing, home, smartphones, laptops };
}

// 创建测试产品
async function createTestProducts(categories: any) {
  console.log('📱 创建测试产品...');
  
  const products: any[] = [];

  // 智能手机产品
  const iphone = await prisma.product.upsert({
    where: { sku: 'IPHONE-15-128GB' },
    update: {},
    create: {
      name: 'iPhone 15 128GB',
      description: '最新款iPhone 15，配备A17 Pro芯片，128GB存储空间',
      short_desc: '最新款iPhone 15，A17 Pro芯片',
      price: 799.99,
      original_price: 899.99,
      stock: 50,
      min_stock: 10,
      weight: 0.171,
      dimensions: { length: 14.76, width: 7.15, height: 0.78 },
      sku: 'IPHONE-15-128GB',
      barcode: '1234567890123',
      status: 'ACTIVE',
      sales_count: 25,
      view_count: 150,
      sort_order: 1,
      category_id: categories.smartphones.id,
      seo_title: 'iPhone 15 128GB - 最新款智能手机',
      seo_description: '购买最新款iPhone 15，配备A17 Pro芯片，128GB存储空间',
      seo_keywords: ['iPhone', '智能手机', '苹果', 'A17 Pro'],
    },
  });
  products.push(iphone);

  // 笔记本电脑产品
  const macbook = await prisma.product.upsert({
    where: { sku: 'MACBOOK-AIR-M2' },
    update: {},
    create: {
      name: 'MacBook Air M2 13英寸',
      description: 'MacBook Air配备M2芯片，13英寸Liquid Retina显示屏',
      short_desc: 'MacBook Air M2芯片，13英寸',
      price: 1199.99,
      original_price: 1299.99,
      stock: 30,
      min_stock: 5,
      weight: 1.24,
      dimensions: { length: 30.41, width: 21.5, height: 1.13 },
      sku: 'MACBOOK-AIR-M2',
      barcode: '1234567890124',
      status: 'ACTIVE',
      sales_count: 15,
      view_count: 200,
      sort_order: 2,
      category_id: categories.laptops.id,
      seo_title: 'MacBook Air M2 13英寸 - 轻薄笔记本电脑',
      seo_description: 'MacBook Air配备M2芯片，轻薄便携的笔记本电脑',
      seo_keywords: ['MacBook', '笔记本电脑', 'M2芯片', '苹果'],
    },
  });
  products.push(macbook);

  // 服装产品
  const tshirt = await prisma.product.upsert({
    where: { sku: 'TSHIRT-COTTON-M' },
    update: {},
    create: {
      name: '纯棉T恤 男款 M码',
      description: '100%纯棉材质，舒适透气，经典圆领设计',
      short_desc: '100%纯棉T恤，舒适透气',
      price: 29.99,
      original_price: 39.99,
      stock: 100,
      min_stock: 20,
      weight: 0.2,
      sku: 'TSHIRT-COTTON-M',
      barcode: '1234567890125',
      status: 'ACTIVE',
      sales_count: 45,
      view_count: 300,
      sort_order: 3,
      category_id: categories.clothing.id,
      seo_title: '纯棉T恤 男款 M码 - 舒适透气',
      seo_description: '100%纯棉材质T恤，舒适透气，经典设计',
      seo_keywords: ['T恤', '纯棉', '男装', '基础款'],
    },
  });
  products.push(tshirt);

  return products;
}

// 创建博客数据
async function createBlogData() {
  console.log('📝 创建博客数据...');
  
  // 创建博客标签
  const techTag = await prisma.blogTag.upsert({
    where: { slug: 'technology' },
    update: {},
    create: {
      name: '技术',
      slug: 'technology',
      description: '技术相关文章',
      color: '#1890ff',
      project_type: 'wanflower',
      is_active: true,
      sort_order: 1,
    },
  });

  const businessTag = await prisma.blogTag.upsert({
    where: { slug: 'business' },
    update: {},
    create: {
      name: '商业',
      slug: 'business',
      description: '商业相关文章',
      color: '#52c41a',
      project_type: 'wanflower',
      is_active: true,
      sort_order: 2,
    },
  });

  // 创建博客分类
  const existingNewsCategory = await prisma.blogCategory.findFirst({
    where: { 
      slug: 'news',
      project_type: 'wanflower'
    }
  });

  const newsCategory = existingNewsCategory || await prisma.blogCategory.create({
    data: {
      name: '新闻资讯',
      slug: 'news',
      description: '最新新闻和资讯',
      project_type: 'wanflower',
      is_active: true,
      sort_order: 1,
    },
  });

  // 创建博客文章
  await prisma.blog.upsert({
    where: { 
      slug_language_project_type: {
        slug: 'welcome-to-wanflower',
        language: 'zh',
        project_type: 'wanflower'
      }
    },
    update: {},
    create: {
      title: '欢迎来到万花电商平台',
      slug: 'welcome-to-wanflower',
      author: '万花团队',
      language: 'zh',
      md: `# 欢迎来到万花电商平台

万花电商平台是一个专注于跨境电商的现代化电商平台，我们致力于为全球用户提供优质的商品和服务。

## 我们的特色

- 🌍 **全球化**: 支持多语言、多货币
- 🛡️ **安全可靠**: 采用最新的安全技术
- 🚀 **高性能**: 优化的系统架构
- 📱 **移动优先**: 完美的移动端体验

## 联系我们

如有任何问题，请联系我们的客服团队。`,
      summary: '欢迎来到万花电商平台，一个专注于跨境电商的现代化平台',
      reading_time: 3,
      seo: {
        title: '欢迎来到万花电商平台 - 跨境电商首选',
        description: '万花电商平台是专业的跨境电商平台，提供优质商品和服务',
        keywords: ['电商', '跨境电商', '万花', '购物']
      },
      status: 'PUBLISHED',
      view_count: 100,
      project_type: 'wanflower',
      is_featured: true,
      sort_order: 1,
      tags: {
        connect: [{ id: techTag.id }, { id: businessTag.id }]
      },
      categories: {
        connect: [{ id: newsCategory.id }]
      }
    },
  });
}

// 创建订单数据
async function createOrderData(users: any[], products: any[]) {
  console.log('🛒 创建订单数据...');
  
  const user = users.find(u => u.email === 'user@gmail.com');
  if (!user) return;

  // 创建购物车
  const cart = await prisma.cart.upsert({
    where: { user_id: user.id },
    update: {},
    create: {
      user_id: user.id,
    },
  });

  // 添加商品到购物车
  await prisma.cartItem.upsert({
    where: {
      cart_id_product_id: {
        cart_id: cart.id,
        product_id: products[0].id,
      },
    },
    update: { quantity: 2 },
    create: {
      cart_id: cart.id,
      product_id: products[0].id,
      quantity: 2,
    },
  });

  // 创建订单
  const order = await prisma.order.create({
    data: {
      order_number: `ORD-${Date.now()}`,
      user_id: user.id,
      status: 'PAID',
      subtotal: 1599.98,
      shipping_fee: 0,
      tax_amount: 0,
      discount_amount: 100,
      total_amount: 1499.98,
      shipping_address: {
        name: '张三',
        phone: '13800138000',
        country: '中国',
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        address_line: '科技园南区',
        postal_code: '518000',
      },
      payment_method: 'STRIPE',
      payment_status: 'PAID',
      payment_id: 'pi_test_123456',
      paid_at: new Date(),
      customer_notes: '请尽快发货',
    },
  });

  // 创建订单项
  await prisma.orderItem.create({
    data: {
      order_id: order.id,
      product_id: products[0].id,
      quantity: 2,
      unit_price: 799.99,
      total_price: 1599.98,
      product_snapshot: {
        name: products[0].name,
        description: products[0].description,
        price: products[0].price,
        sku: products[0].sku,
      },
    },
  });
}

// 创建评论数据
async function createReviewData(users: any[], products: any[]) {
  console.log('💬 创建评论数据...');
  
  const user = users.find(u => u.email === 'user@gmail.com');
  const order = await prisma.order.findFirst({
    where: { user_id: user?.id },
  });
  
  if (!user || !order) return;

  await prisma.productReview.create({
    data: {
      product_id: products[0].id,
      user_id: user.id,
      order_id: order.id,
      rating: 5,
      content: '产品质量很好，物流也很快，非常满意！',
      status: 'APPROVED',
      is_visible: true,
      helpful_count: 3,
    },
  });
}

// 创建验证码
async function createVerificationCodes() {
  const verificationCodes = [
    {
      email: 'unverified@gmail.com',
      code: '123456',
      type: 'REGISTER',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      is_used: false,
    },
    {
      email: 'admin@gmail.com',
      code: '654321',
      type: 'RESET_PASSWORD',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      is_used: false,
    },
  ];

  for (const codeData of verificationCodes) {
    await prisma.emailVerification.deleteMany({
      where: {
        email: codeData.email,
        type: codeData.type as any,
      },
    });
    
    await prisma.emailVerification.create({
      data: {
        email: codeData.email,
        code: codeData.code,
        type: codeData.type as any,
        expires_at: codeData.expires_at,
        is_used: codeData.is_used,
      },
    });
  }
}

// 打印测试账号信息
function printTestAccountInfo() {
  console.log('\n📋 测试账号信息:');
  console.log('所有账号密码: Qpalzm1.');
  console.log('验证码: 123456 (unverified@gmail.com)');
  console.log('重置密码验证码: 654321 (admin@gmail.com)');
  console.log('\n👥 用户账号:');
  console.log('• 管理员: admin@gmail.com (admin)');
  console.log('• 员工: staff@gmail.com (staff)');
  console.log('• 普通用户: user@gmail.com (user)');
  console.log('• 未验证用户: unverified@gmail.com (user, 未验证)');
  console.log('• 禁用用户: disabled@gmail.com (user, 已禁用)');
  console.log('\n📦 测试数据:');
  console.log('• 产品分类: 电子产品、服装配饰、家居园艺');
  console.log('• 测试产品: iPhone 15、MacBook Air、纯棉T恤');
  console.log('• 博客文章: 欢迎文章');
  console.log('• 订单数据: 包含购物车和订单');
  console.log('• 评论数据: 产品评论');
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })