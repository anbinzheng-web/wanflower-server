#!/bin/bash

# 数据库种子数据生成示例脚本
# 此脚本展示了如何在不同环境中运行数据库种子数据生成

echo "🌱 万花电商数据库种子数据生成示例"
echo "=================================="

# 检查是否安装了必要的依赖
if ! command -v npx &> /dev/null; then
    echo "❌ 错误: 未找到 npx，请确保已安装 Node.js"
    exit 1
fi

# 检查是否存在 Prisma
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ 错误: 未找到 Prisma schema 文件，请确保在项目根目录运行此脚本"
    exit 1
fi

echo ""
echo "📋 可用的环境配置:"
echo "1. 生产环境 (NODE_ENV=production)"
echo "2. 开发环境 (NODE_ENV=development)"  
echo "3. 测试环境 (默认)"
echo ""

# 函数：运行种子脚本
run_seed() {
    local env_name=$1
    local node_env=$2
    
    echo "🚀 运行 $env_name 种子数据生成..."
    echo "环境变量: NODE_ENV=$node_env"
    echo "----------------------------------------"
    
    if [ "$node_env" = "default" ]; then
        npx prisma db seed
    else
        NODE_ENV=$node_env npx prisma db seed
    fi
    
    echo ""
    echo "✅ $env_name 种子数据生成完成"
    echo "========================================"
    echo ""
}

# 显示菜单
show_menu() {
    echo "请选择要运行的环境:"
    echo "1) 生产环境 - 只创建管理员账号"
    echo "2) 开发环境 - 创建完整测试数据"
    echo "3) 测试环境 - 创建完整测试数据"
    echo "4) 查看所有环境"
    echo "5) 退出"
    echo ""
    read -p "请输入选项 (1-5): " choice
}

# 主循环
while true; do
    show_menu
    
    case $choice in
        1)
            run_seed "生产环境" "production"
            ;;
        2)
            run_seed "开发环境" "development"
            ;;
        3)
            run_seed "测试环境" "default"
            ;;
        4)
            echo "🔄 运行所有环境种子数据生成..."
            echo ""
            run_seed "生产环境" "production"
            run_seed "开发环境" "development" 
            run_seed "测试环境" "default"
            ;;
        5)
            echo "👋 退出脚本"
            exit 0
            ;;
        *)
            echo "❌ 无效选项，请输入 1-5"
            echo ""
            ;;
    esac
    
    echo ""
    read -p "按 Enter 键继续..."
    echo ""
done
