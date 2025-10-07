#!/usr/bin/env node

/**
 * 媒体管理系统测试脚本
 * 用于验证新的统一媒体管理系统是否正常工作
 */

const fs = require('fs');
const path = require('path');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');

// 创建测试图片
function createTestImage() {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    // 创建一个简单的测试图片（1x1 像素的 PNG）
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00, 0x00,
      0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    fs.writeFileSync(TEST_IMAGE_PATH, pngData);
    console.log('✅ 创建测试图片:', TEST_IMAGE_PATH);
  }
}

// 测试存储健康检查
async function testStorageHealth() {
  console.log('\n🔍 测试存储健康检查...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/storage-health/status`);
    const data = await response.json();
    
    console.log('📊 存储状态:', data);
    
    if (data.status === 'healthy' || data.status === 'unknown') {
      console.log('✅ 存储服务状态正常');
    } else {
      console.log('❌ 存储服务状态异常:', data.status);
    }
  } catch (error) {
    console.log('❌ 存储健康检查失败:', error.message);
  }
}

// 测试存储配置
async function testStorageConfig() {
  console.log('\n🔍 测试存储配置...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/storage-health/config`);
    const data = await response.json();
    
    console.log('⚙️ 存储配置:', data);
    
    if (data.driver) {
      console.log('✅ 存储驱动配置正常:', data.driver);
    } else {
      console.log('❌ 存储驱动配置缺失');
    }
  } catch (error) {
    console.log('❌ 存储配置检查失败:', error.message);
  }
}

// 测试存储连接
async function testStorageConnection() {
  console.log('\n🔍 测试存储连接...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/storage-health/test`);
    const data = await response.json();
    
    console.log('🔗 连接测试结果:', data);
    
    if (data.success) {
      console.log('✅ 存储连接测试成功');
    } else {
      console.log('❌ 存储连接测试失败:', data.details?.error);
    }
  } catch (error) {
    console.log('❌ 存储连接测试失败:', error.message);
  }
}

// 测试产品媒体上传（需要认证）
async function testProductMediaUpload() {
  console.log('\n🔍 测试产品媒体上传...');
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('product_id', '1');
    formData.append('type', 'IMAGE');
    formData.append('media_category', 'MAIN');
    
    const response = await fetch(`${BASE_URL}/api/product/media/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // 需要有效的 JWT token
      }
    });
    
    if (response.status === 401) {
      console.log('⚠️ 需要认证，跳过产品媒体上传测试');
      return;
    }
    
    const data = await response.json();
    console.log('📤 产品媒体上传结果:', data);
    
    if (data.success) {
      console.log('✅ 产品媒体上传成功');
    } else {
      console.log('❌ 产品媒体上传失败:', data.message);
    }
  } catch (error) {
    console.log('❌ 产品媒体上传测试失败:', error.message);
  }
}

// 测试评论媒体上传（需要认证）
async function testReviewMediaUpload() {
  console.log('\n🔍 测试评论媒体上传...');
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('review_id', '1');
    formData.append('type', 'IMAGE');
    
    const response = await fetch(`${BASE_URL}/api/review/media/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // 需要有效的 JWT token
      }
    });
    
    if (response.status === 401) {
      console.log('⚠️ 需要认证，跳过评论媒体上传测试');
      return;
    }
    
    const data = await response.json();
    console.log('📤 评论媒体上传结果:', data);
    
    if (data.success) {
      console.log('✅ 评论媒体上传成功');
    } else {
      console.log('❌ 评论媒体上传失败:', data.message);
    }
  } catch (error) {
    console.log('❌ 评论媒体上传测试失败:', error.message);
  }
}

// 测试博客媒体上传（需要认证）
async function testBlogMediaUpload() {
  console.log('\n🔍 测试博客媒体上传...');
  
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('blog_id', '1');
    formData.append('type', 'IMAGE');
    formData.append('category', 'COVER');
    
    const response = await fetch(`${BASE_URL}/api/blog/media/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // 需要有效的 JWT token
      }
    });
    
    if (response.status === 401) {
      console.log('⚠️ 需要认证，跳过博客媒体上传测试');
      return;
    }
    
    const data = await response.json();
    console.log('📤 博客媒体上传结果:', data);
    
    if (data.success) {
      console.log('✅ 博客媒体上传成功');
    } else {
      console.log('❌ 博客媒体上传失败:', data.message);
    }
  } catch (error) {
    console.log('❌ 博客媒体上传测试失败:', error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试媒体管理系统...\n');
  
  // 创建测试图片
  createTestImage();
  
  // 运行测试
  await testStorageHealth();
  await testStorageConfig();
  await testStorageConnection();
  await testProductMediaUpload();
  await testReviewMediaUpload();
  await testBlogMediaUpload();
  
  console.log('\n🎉 媒体管理系统测试完成！');
  console.log('\n📝 注意事项:');
  console.log('1. 确保服务器正在运行 (npm run start:dev)');
  console.log('2. 上传测试需要有效的 JWT token');
  console.log('3. 确保数据库已正确迁移');
  console.log('4. 检查存储配置是否正确');
  
  // 清理测试文件
  if (fs.existsSync(TEST_IMAGE_PATH)) {
    fs.unlinkSync(TEST_IMAGE_PATH);
    console.log('\n🧹 清理测试文件完成');
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testStorageHealth,
  testStorageConfig,
  testStorageConnection,
  testProductMediaUpload,
  testReviewMediaUpload,
  testBlogMediaUpload
};
