import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Video, VideoStatus, UploadResponse } from './video.dto';
import { VideoService } from './video.service';

const pubSub = new PubSub();

@Resolver(() => Video)
export class VideoResolver {
  constructor(private videoService: VideoService) {}

  @Query(() => [Video])
  async videos(): Promise<Video[]> {
    return this.videoService.getAllVideos();
  }

  @Query(() => Video, { nullable: true })
  async video(@Args('id') id: string): Promise<Video | undefined> {
    return this.videoService.getVideo(id);
  }

  @Mutation(() => UploadResponse)
  async uploadVideo(@Args('file') file: any): Promise<UploadResponse> {
    const originalName = file.filename || file.originalname || 'video.mp4';
    const video = await this.videoService.createVideo(originalName);
    return { video };
  }

  @Subscription(() => Video, {
    filter: (payload, variables) => payload.videoStatus.id === variables.id,
  })
  videoStatus(@Args('id') id: string) {
    return pubSub.asyncIterator('videoStatus');
  }

  async notifyStatusChange(video: Video) {
    await pubSub.publish('videoStatus', { videoStatus: video });
  }
}