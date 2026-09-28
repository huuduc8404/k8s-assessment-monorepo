import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Video, VideoStatus, VideoVersion, UploadResponse } from './video.dto';

@Injectable()
export class VideoService {
  private videos = new Map<string, Video>();
  private uploadDir = process.env.UPLOAD_DIR || '/uploads';

  async createVideo(originalName: string): Promise<Video> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const video: Video = {
      id,
      originalName,
      status: VideoStatus.PENDING,
      versions: [],
      createdAt: now,
      updatedAt: now,
    };
    this.videos.set(id, video);
    return video;
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getAllVideos(): Promise<Video[]> {
    return Array.from(this.videos.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateStatus(id: string, status: VideoStatus): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (video) {
      video.status = status;
      video.updatedAt = new Date().toISOString();
      this.videos.set(id, video);
    }
    return video;
  }

  async addVersion(id: string, version: VideoVersion): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (video) {
      video.versions.push(version);
      video.updatedAt = new Date().toISOString();
      this.videos.set(id, video);
    }
    return video;
  }

  async setThumbnail(id: string, thumbnailUrl: string): Promise<Video | undefined> {
    const video = this.videos.get(id);
    if (video) {
      video.thumbnailUrl = thumbnailUrl;
      video.updatedAt = new Date().toISOString();
      this.videos.set(id, video);
    }
    return video;
  }

  getUploadDir(): string {
    return this.uploadDir;
  }
}