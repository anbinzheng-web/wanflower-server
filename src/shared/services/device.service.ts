import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { UserDevice } from '@prisma/client';

/**
 * 设备管理服务
 * 负责管理用户设备信息，支持设备指纹识别和信任设备管理
 */
@Injectable()
export class DeviceService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {}

  /**
   * 生成设备指纹
   * @param userAgent 用户代理字符串
   * @param ipAddress IP地址
   * @returns 设备指纹
   */
  generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
    const crypto = require('crypto');
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent}-${ipAddress}`)
      .digest('hex');
    
    return fingerprint;
  }

  /**
   * 检测设备类型
   * @param userAgent 用户代理字符串
   * @returns 设备类型
   */
  detectDeviceType(userAgent: string): string {
    if (!userAgent) return 'unknown';

    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * 注册或更新设备
   * @param userId 用户ID
   * @param deviceInfo 设备信息
   * @returns 设备记录
   */
  async registerOrUpdateDevice(
    userId: number,
    deviceInfo: {
      deviceId: string;
      deviceName?: string;
      userAgent?: string;
      ipAddress?: string;
    }
  ): Promise<UserDevice> {
    try {
      const deviceType = this.detectDeviceType(deviceInfo.userAgent || '');
      
      // 查找现有设备
      const existingDevice = await this.prisma.userDevice.findUnique({
        where: {
          user_id_device_id: {
            user_id: userId,
            device_id: deviceInfo.deviceId,
          },
        },
      });

      if (existingDevice) {
        // 更新现有设备信息
        const updatedDevice = await this.prisma.userDevice.update({
          where: { id: existingDevice.id },
          data: {
            device_name: deviceInfo.deviceName || existingDevice.device_name,
            device_type: deviceType,
            user_agent: deviceInfo.userAgent || existingDevice.user_agent,
            ip_address: deviceInfo.ipAddress || existingDevice.ip_address,
            last_active: new Date(),
          },
        });

        this.logger.info('更新设备信息', { 
          userId, 
          deviceId: deviceInfo.deviceId 
        }, {
          module: 'DeviceService',
          action: 'registerOrUpdateDevice',
        });

        return updatedDevice;
      } else {
        // 创建新设备
        const newDevice = await this.prisma.userDevice.create({
          data: {
            user_id: userId,
            device_id: deviceInfo.deviceId,
            device_name: deviceInfo.deviceName,
            device_type: deviceType,
            user_agent: deviceInfo.userAgent,
            ip_address: deviceInfo.ipAddress,
            is_trusted: false, // 新设备默认不信任
            last_active: new Date(),
          },
        });

        this.logger.info('注册新设备', { 
          userId, 
          deviceId: deviceInfo.deviceId,
          deviceType 
        }, {
          module: 'DeviceService',
          action: 'registerOrUpdateDevice',
        });

        return newDevice;
      }
    } catch (error) {
      this.logger.logError(error, {
        module: 'DeviceService',
        action: 'registerOrUpdateDevice',
      }, { userId, deviceId: deviceInfo.deviceId });
      throw error;
    }
  }

  /**
   * 获取用户的所有设备
   * @param userId 用户ID
   * @returns 设备列表
   */
  async getUserDevices(userId: number): Promise<UserDevice[]> {
    try {
      const devices = await this.prisma.userDevice.findMany({
        where: { user_id: userId },
        orderBy: { last_active: 'desc' },
      });

      this.logger.info('获取用户设备列表', { 
        userId, 
        deviceCount: devices.length 
      }, {
        module: 'DeviceService',
        action: 'getUserDevices',
      });

      return devices;
    } catch (error) {
      this.logger.logError(error, {
        module: 'DeviceService',
        action: 'getUserDevices',
      }, { userId });
      throw error;
    }
  }

  /**
   * 设置设备信任状态
   * @param userId 用户ID
   * @param deviceId 设备ID
   * @param isTrusted 是否信任
   * @returns 更新后的设备
   */
  async setDeviceTrustStatus(
    userId: number,
    deviceId: string,
    isTrusted: boolean
  ): Promise<UserDevice> {
    try {
      const device = await this.prisma.userDevice.findUnique({
        where: {
          user_id_device_id: {
            user_id: userId,
            device_id: deviceId,
          },
        },
      });

      if (!device) {
        throw new Error('设备不存在');
      }

      const updatedDevice = await this.prisma.userDevice.update({
        where: { id: device.id },
        data: { is_trusted: isTrusted },
      });

      this.logger.info('更新设备信任状态', { 
        userId, 
        deviceId, 
        isTrusted 
      }, {
        module: 'DeviceService',
        action: 'setDeviceTrustStatus',
      });

      return updatedDevice;
    } catch (error) {
      this.logger.logError(error, {
        module: 'DeviceService',
        action: 'setDeviceTrustStatus',
      }, { userId, deviceId, isTrusted });
      throw error;
    }
  }

  /**
   * 删除设备
   * @param userId 用户ID
   * @param deviceId 设备ID
   */
  async removeDevice(userId: number, deviceId: string): Promise<void> {
    try {
      await this.prisma.userDevice.deleteMany({
        where: {
          user_id: userId,
          device_id: deviceId,
        },
      });

      this.logger.info('删除设备', { userId, deviceId }, {
        module: 'DeviceService',
        action: 'removeDevice',
      });
    } catch (error) {
      this.logger.logError(error, {
        module: 'DeviceService',
        action: 'removeDevice',
      }, { userId, deviceId });
      throw error;
    }
  }

  /**
   * 检查设备是否受信任
   * @param userId 用户ID
   * @param deviceId 设备ID
   * @returns 是否受信任
   */
  async isDeviceTrusted(userId: number, deviceId: string): Promise<boolean> {
    try {
      const device = await this.prisma.userDevice.findUnique({
        where: {
          user_id_device_id: {
            user_id: userId,
            device_id: deviceId,
          },
        },
      });

      return device?.is_trusted || false;
    } catch (error) {
      this.logger.logError(error, {
        module: 'DeviceService',
        action: 'isDeviceTrusted',
      }, { userId, deviceId });
      return false;
    }
  }
}
