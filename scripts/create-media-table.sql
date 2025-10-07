-- 创建 Media 表
CREATE TABLE IF NOT EXISTS "Media" (
    "id" SERIAL PRIMARY KEY,
    "business_type" VARCHAR(50) NOT NULL,
    "business_id" INTEGER,
    "type" VARCHAR(20) NOT NULL,
    "storage_type" VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    
    -- 本地存储字段
    "local_path" VARCHAR(500),
    "filename" VARCHAR(255),
    
    -- OSS 存储字段
    "oss_url" VARCHAR(500),
    "oss_key" VARCHAR(255),
    
    -- CDN 存储字段
    "cdn_url" VARCHAR(500),
    "cdn_key" VARCHAR(255),
    
    -- 通用字段
    "file_size" BIGINT,
    "mime_type" VARCHAR(100),
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    
    -- 缩略图
    "thumbnail_local" VARCHAR(500),
    "thumbnail_oss" VARCHAR(500),
    "thumbnail_cdn" VARCHAR(500),
    
    "alt_text" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "category" VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    
    -- 用户关联
    "user_id" INTEGER,
    
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "Media_business_type_business_id_idx" ON "Media"("business_type", "business_id");
CREATE INDEX IF NOT EXISTS "Media_type_idx" ON "Media"("type");
CREATE INDEX IF NOT EXISTS "Media_user_id_idx" ON "Media"("user_id");
CREATE INDEX IF NOT EXISTS "Media_category_idx" ON "Media"("category");

-- 添加外键约束
ALTER TABLE "Media" ADD CONSTRAINT "Media_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加产品关联约束（当 business_type = 'PRODUCT' 时）
ALTER TABLE "Media" ADD CONSTRAINT "Media_product_fkey" 
    FOREIGN KEY ("business_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加检查约束
ALTER TABLE "Media" ADD CONSTRAINT "Media_business_type_check" 
    CHECK ("business_type" IN ('PRODUCT', 'BLOG', 'REVIEW', 'USER', 'GENERAL'));

ALTER TABLE "Media" ADD CONSTRAINT "Media_type_check" 
    CHECK ("type" IN ('IMAGE', 'VIDEO'));

ALTER TABLE "Media" ADD CONSTRAINT "Media_storage_type_check" 
    CHECK ("storage_type" IN ('LOCAL', 'OSS', 'CDN'));

-- 更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_media_updated_at 
    BEFORE UPDATE ON "Media" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
