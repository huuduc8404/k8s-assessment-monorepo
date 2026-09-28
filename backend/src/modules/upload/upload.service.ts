import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { join } from 'path';
import { UploadFile } from './upload.dto';
import { VideoService } from '../video/video.service';
import { VideoStatus } from '../video/video.dto';

@Injectable()
export class UploadService {
  constructor(private videoService: VideoService) {}

  async handleUpload(file: Express.Multer.File): Promise<UploadFile> {
    const uploadDir = this.videoService.getUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });

    const id = uuidv4();
    const ext = file.originalname.split('.').pop() || 'mp4';
    const filename = `${id}.${ext}`;
    const filepath = join(uploadDir, filename);

    await fs.writeFile(filepath, file.buffer);

    return {
      id,
      filename: file.originalname,
      mimetype: file.mimetype,
      encoding: file.encoding,
      path: filepath,
    };
  }

  async processVideo(uploadFile: UploadFile, videoId: string): Promise<void> {
    await this.videoService.updateStatus(videoId, VideoStatus.PROCESSING);
    
    // In a real implementation, this would trigger the video processing worker
    // For now, we'll simulate processing completion
    setTimeout(async () => {
      const resolutions = ['2k', '1080p', '720p', '480p'];
      for (const res of resolutions) {
        const versionPath = uploadFile.path.replace('.mp4', `_${res}.mp4`);
        await this.videoService.addVersion(videoId, {
          resolution: res,
          url: `/uploads/${versionPath.split('/').pop()}`,
        });
      }
      await this.videoService.setThumbnail(videoId, `/uploads/${uploadFile.id}_thumb.jpg`);
      await this.videoService.updateStatus(videoId, VideoStatus.COMPLETED);
    }, 2000);
  }
}