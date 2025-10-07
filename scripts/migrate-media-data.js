#!/usr/bin/env node

/**
 * 媒体数据迁移脚本
 * 将现有的 ProductMedia 和 ReviewMedia 数据迁移到新的 Media 表
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateProductMedia() {
  console.log('🔄 开始迁移产品媒体数据...');
  
  try {
    // 检查是否存在 ProductMedia 表
    const productMediaCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "ProductMedia" LIMIT 1
    `.catch(() => null);
    
    if (!productMediaCount || productMediaCount[0].count === 0) {
      console.log('ℹ️ 没有找到 ProductMedia 数据，跳过迁移');
      return;
    }
    
    // 获取所有 ProductMedia 数据
    const productMediaList = await prisma.$queryRaw`
      SELECT * FROM "ProductMedia"
    `;
    
    console.log(`📊 找到 ${productMediaList.length} 条产品媒体记录`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const media of productMediaList) {
      try {
        // 迁移到 Media 表
        await prisma.media.create({
          data: {
            business_type: 'PRODUCT',
            business_id: media.product_id,
            type: media.type,
            storage_type: media.storage_type,
            local_path: media.local_path,
            filename: media.filename,
            file_size: media.file_size,
            mime_type: media.mime_type,
            width: media.width,
            height: media.height,
            duration: media.duration,
            thumbnail_local: media.thumbnail_local,
            thumbnail_cdn: media.thumbnail_cdn,
            alt_text: media.alt_text,
            sort_order: media.sort_order,
            category: media.media_category || 'MAIN',
            created_at: media.created_at,
            updated_at: media.updated_at
          }
        });
        
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`📈 已迁移 ${migratedCount} 条记录...`);
        }
      } catch (error) {
        console.error(`❌ 迁移失败 (ID: ${media.id}):`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ 产品媒体迁移完成: ${migratedCount} 成功, ${errorCount} 失败`);
    
  } catch (error) {
    console.error('❌ 产品媒体迁移失败:', error.message);
  }
}

async function migrateReviewMedia() {
  console.log('🔄 开始迁移评论媒体数据...');
  
  try {
    // 检查是否存在 ReviewMedia 表
    const reviewMediaCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "ReviewMedia" LIMIT 1
    `.catch(() => null);
    
    if (!reviewMediaCount || reviewMediaCount[0].count === 0) {
      console.log('ℹ️ 没有找到 ReviewMedia 数据，跳过迁移');
      return;
    }
    
    // 获取所有 ReviewMedia 数据
    const reviewMediaList = await prisma.$queryRaw`
      SELECT * FROM "ReviewMedia"
    `;
    
    console.log(`📊 找到 ${reviewMediaList.length} 条评论媒体记录`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const media of reviewMediaList) {
      try {
        // 迁移到 Media 表
        await prisma.media.create({
          data: {
            business_type: 'REVIEW',
            business_id: media.review_id,
            type: media.type,
            storage_type: media.storage_type,
            local_path: media.local_path,
            filename: media.filename,
            file_size: media.file_size,
            mime_type: media.mime_type,
            width: media.width,
            height: media.height,
            duration: media.duration,
            thumbnail_local: media.thumbnail_local,
            thumbnail_cdn: media.thumbnail_cdn,
            alt_text: media.alt_text,
            sort_order: media.sort_order,
            category: 'GENERAL',
            created_at: media.created_at
          }
        });
        
        migratedCount++;
        
        if (migratedCount % 100 === 0) {
          console.log(`📈 已迁移 ${migratedCount} 条记录...`);
        }
      } catch (error) {
        console.error(`❌ 迁移失败 (ID: ${media.id}):`, error.message);
        errorCount++;
      }
    }
    
    console.log(`✅ 评论媒体迁移完成: ${migratedCount} 成功, ${errorCount} 失败`);
    
  } catch (error) {
    console.error('❌ 评论媒体迁移失败:', error.message);
  }
}

async function verifyMigration() {
  console.log('🔍 验证迁移结果...');
  
  try {
    // 统计 Media 表中的数据
    const mediaStats = await prisma.media.groupBy({
      by: ['business_type'],
      _count: {
        id: true
      }
    });
    
    console.log('📊 迁移后的媒体数据统计:');
    mediaStats.forEach(stat => {
      console.log(`  ${stat.business_type}: ${stat._count.id} 条记录`);
    });
    
    // 检查是否有重复数据
    const duplicates = await prisma.$queryRaw`
      SELECT business_type, business_id, COUNT(*) as count
      FROM "Media"
      GROUP BY business_type, business_id
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length > 0) {
      console.log('⚠️ 发现重复数据:');
      duplicates.forEach(dup => {
        console.log(`  ${dup.business_type} ID ${dup.business_id}: ${dup.count} 条记录`);
      });
    } else {
      console.log('✅ 没有发现重复数据');
    }
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  }
}

async function cleanupOldTables() {
  console.log('🧹 清理旧表...');
  
  try {
    // 删除 ProductMedia 表
    await prisma.$executeRaw`DROP TABLE IF EXISTS "ProductMedia"`;
    console.log('✅ 删除 ProductMedia 表');
    
    // 删除 ReviewMedia 表
    await prisma.$executeRaw`DROP TABLE IF EXISTS "ReviewMedia"`;
    console.log('✅ 删除 ReviewMedia 表');
    
  } catch (error) {
    console.error('❌ 清理旧表失败:', error.message);
  }
}

async function main() {
  console.log('🚀 开始媒体数据迁移...\n');
  
  try {
    // 迁移数据
    await migrateProductMedia();
    await migrateReviewMedia();
    
    // 验证迁移
    await verifyMigration();
    
    // 询问是否清理旧表
    console.log('\n❓ 是否要删除旧的 ProductMedia 和 ReviewMedia 表？');
    console.log('⚠️ 注意：这将永久删除旧表，请确保数据已正确迁移！');
    console.log('💡 建议：先备份数据库，然后手动执行清理操作');
    
    // 这里不自动清理，需要手动确认
    // await cleanupOldTables();
    
    console.log('\n🎉 媒体数据迁移完成！');
    console.log('\n📝 下一步:');
    console.log('1. 验证迁移结果是否正确');
    console.log('2. 测试新的媒体管理功能');
    console.log('3. 确认无误后删除旧表');
    console.log('4. 更新前端代码使用新的 API');
    
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 运行迁移
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  migrateProductMedia,
  migrateReviewMedia,
  verifyMigration,
  cleanupOldTables
};
