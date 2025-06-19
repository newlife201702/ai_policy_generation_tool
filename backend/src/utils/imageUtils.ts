import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { createLogger } from './logger';

const logger = createLogger('imageUtils');
const writeFileAsync = promisify(fs.writeFile);

/**
 * 从URL下载图片并保存到本地
 * @param imageUrl 图片URL
 * @param saveDir 保存目录
 * @returns 保存后的文件路径
 */
export async function downloadAndSaveImage(imageUrl: string, saveDir: string): Promise<string> {
  try {
    // 创建保存目录（如果不存在）
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = '.png'; // 或者从 Content-Type 中获取
    const fileName = `image-${timestamp}-${randomString}${fileExtension}`;
    const filePath = path.join(saveDir, fileName);

    // 下载图片
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    });

    // 保存图片
    await writeFileAsync(filePath, response.data);

    // 返回相对路径
    return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  } catch (error) {
    logger.error('Failed to download and save image:', error);
    throw error;
  }
}

/**
 * 将base64图片数据保存为本地图片文件
 * @param base64Data base64字符串（不含data:image/png;base64,前缀）
 * @param saveDir 保存目录
 * @returns 保存后的文件相对路径
 */
export async function saveBase64ImageToFile(base64Data: string, saveDir: string): Promise<string> {
  try {
    // 创建保存目录（如果不存在）
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = '.png';
    const fileName = `image-${timestamp}-${randomString}${fileExtension}`;
    const filePath = path.join(saveDir, fileName);

    // 保存图片
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFileAsync(filePath, buffer);

    // 返回相对路径
    return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  } catch (error) {
    logger.error('Failed to save base64 image:', error);
    throw error;
  }
} 