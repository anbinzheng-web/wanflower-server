import { OrderStatus, PaymentStatus } from '@prisma/client';

// 收货地址接口 - 支持国际地址格式
export interface ShippingAddress {
  // 收货人信息
  name: string;           // 收货人姓名
  phone: string;          // 收货人电话（国际格式）
  company?: string;       // 公司名称（可选，B2B业务需要）
  
  // 地址信息
  country: string;        // 国家（ISO 3166-1 alpha-2 代码）
  province: string;       // 省/州/大区
  city: string;          // 城市
  district?: string;      // 区/县/郡
  postal_code?: string;   // 邮政编码/邮编
  
  // 详细地址（支持多行，适应不同国家格式）
  address_line_1: string; // 地址第一行（街道、门牌号等）
  address_line_2?: string; // 地址第二行（公寓号、楼层等补充信息）
  address_line_3?: string; // 地址第三行（特殊说明等）
  
  // 地址验证和标准化
  is_verified?: boolean;  // 地址是否已验证
  verification_level?: 'none' | 'partial' | 'full'; // 验证级别
  standardized_address?: string; // 标准化后的完整地址
}

// 订单项快照接口
export interface OrderItemSnapshot {
  id: number;
  name: string;
  description?: string;
  price: number;
  original_price?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  images?: string[];
  category?: {
    id: number;
    name: string;
  };
}

// 订单创建接口
export interface CreateOrderData {
  user_id: number;
  shipping_address: ShippingAddress;
  items: {
    product_id: number;
    quantity: number;
  }[];
  customer_notes?: string;
  payment_method?: string;
  shipping_method?: string;
}

// 订单更新接口
export interface UpdateOrderData {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  payment_id?: string;
  paid_at?: Date;
  shipping_method?: string;
  tracking_number?: string;
  shipped_at?: Date;
  delivered_at?: Date;
  admin_notes?: string;
}

// 订单查询接口
export interface OrderQueryParams {
  user_id?: number;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  order_number?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  page_size?: number;
  sort_by?: 'created_at' | 'total_amount' | 'order_number';
  sort_order?: 'asc' | 'desc';
}

// 购物车项接口
export interface CartItemData {
  product_id: number;
  quantity: number;
}

// 购物车查询接口
export interface CartQueryParams {
  user_id: number;
}

// 订单统计接口
export interface OrderStats {
  total_orders: number;
  total_amount: number;
  pending_orders: number;
  paid_orders: number;
  shipped_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  refunded_orders: number;
}

// 订单详情接口（包含关联数据）
export interface OrderWithDetails {
  id: number;
  order_number: string;
  user_id: number;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_address: ShippingAddress;
  payment_method?: string;
  payment_status: PaymentStatus;
  payment_id?: string;
  paid_at?: Date;
  payment_deadline?: Date;
  shipping_method?: string;
  tracking_number?: string;
  shipped_at?: Date;
  delivered_at?: Date;
  customer_notes?: string;
  admin_notes?: string;
  created_at: Date;
  updated_at: Date;
  items: {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_snapshot: OrderItemSnapshot;
    product: {
      id: number;
      name: string;
      status: string;
    };
  }[];
  user: {
    id: number;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
}
