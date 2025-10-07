import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IStorageService } from '../services/upload/local-storage.service';
import { OssStorageService } from '../services/upload/oss-storage.service';
import { CdnStorageService } from '../services/upload/cdn-storage.service';

@ApiTags('storage-health')
@Controller('storage-health')
export class StorageHealthController {
  constructor(
    @Inject('STORAGE_SERVICE')
    private readonly storageService: IStorageService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: '获取存储服务状态' })
  @ApiResponse({ status: 200, description: '存储服务状态信息' })
  async getStorageStatus() {
    const storageDriver = process.env.STORAGE_DRIVER || 'local';
    
    const status = {
      driver: storageDriver,
      status: 'unknown',
      details: {},
      timestamp: new Date().toISOString()
    };

    try {
      switch (storageDriver) {
        case 'oss':
          if (this.storageService instanceof OssStorageService) {
            const isConnected = await this.storageService.checkConnection();
            status.status = isConnected ? 'healthy' : 'unhealthy';
            status.details = {
              region: process.env.OSS_REGION,
              bucket: process.env.OSS_BUCKET,
              connected: isConnected
            };
          }
          break;
          
        case 'cdn':
          if (this.storageService instanceof CdnStorageService) {
            const isConnected = await this.storageService.checkConnection();
            status.status = isConnected ? 'healthy' : 'unhealthy';
            status.details = {
              domain: process.env.CDN_DOMAIN,
              region: process.env.AWS_REGION,
              bucket: process.env.AWS_S3_BUCKET,
              connected: isConnected
            };
          }
          break;
          
        case 'local':
        default:
          status.status = 'healthy';
          status.details = {
            path: process.env.IMAGE_LOCAL_UPLOAD_PATH || 'uploads',
            type: 'local'
          };
          break;
      }
    } catch (error) {
      status.status = 'error';
      status.details = {
        error: error.message
      };
    }

    return status;
  }

  @Get('config')
  @ApiOperation({ summary: '获取存储配置信息' })
  @ApiResponse({ status: 200, description: '存储配置信息' })
  async getStorageConfig() {
    const storageDriver = process.env.STORAGE_DRIVER || 'local';
    
    const config = {
      driver: storageDriver,
      environment: process.env.NODE_ENV || 'development',
      config: {}
    };

    switch (storageDriver) {
      case 'oss':
        config.config = {
          region: process.env.OSS_REGION || 'not configured',
          bucket: process.env.OSS_BUCKET || 'not configured',
          accessKey: process.env.OSS_ACCESS_KEY ? '***configured***' : 'not configured',
          secretKey: process.env.OSS_SECRET_KEY ? '***configured***' : 'not configured'
        };
        break;
        
      case 'cdn':
        config.config = {
          domain: process.env.CDN_DOMAIN || 'not configured',
          region: process.env.AWS_REGION || 'not configured',
          bucket: process.env.AWS_S3_BUCKET || 'not configured',
          accessKey: process.env.AWS_ACCESS_KEY_ID ? '***configured***' : 'not configured',
          secretKey: process.env.AWS_SECRET_ACCESS_KEY ? '***configured***' : 'not configured',
          distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || 'not configured'
        };
        break;
        
      case 'local':
      default:
        config.config = {
          path: process.env.IMAGE_LOCAL_UPLOAD_PATH || 'uploads',
          type: 'local'
        };
        break;
    }

    return config;
  }

  @Get('test')
  @ApiOperation({ summary: '测试存储服务连接' })
  @ApiResponse({ status: 200, description: '测试结果' })
  async testStorageConnection() {
    const storageDriver = process.env.STORAGE_DRIVER || 'local';
    
    const testResult = {
      driver: storageDriver,
      test: 'upload',
      success: false,
      details: {} as any,
      timestamp: new Date().toISOString()
    };

    try {
      // 创建测试文件
      const testFile = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        buffer: Buffer.from('This is a test file for storage health check'),
        size: 50
      } as any;

      // 测试上传
      const result = await this.storageService.upload(testFile);
      
      testResult.success = true;
      testResult.details = {
        uploadResult: result,
        message: 'Upload test successful',
        deleteTest: 'skipped'
      };

      // 如果是 OSS 或 CDN，测试删除
      if (storageDriver === 'oss' || storageDriver === 'cdn') {
        try {
          // 提取文件路径进行删除测试
          const filePath = result.split('/').pop();
          if (filePath) {
            await this.storageService.delete(filePath);
            testResult.details.deleteTest = 'successful';
          }
        } catch (deleteError) {
          testResult.details.deleteTest = `failed: ${deleteError.message}`;
        }
      }

    } catch (error) {
      testResult.success = false;
      testResult.details = {
        error: error.message,
        message: 'Upload test failed'
      };
    }

    return testResult;
  }
}
