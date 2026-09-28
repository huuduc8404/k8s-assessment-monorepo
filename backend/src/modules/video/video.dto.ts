import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum VideoStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

registerEnumType(VideoStatus, { name: 'VideoStatus' });

@ObjectType()
export class VideoVersion {
  @Field()
  resolution: string;

  @Field()
  url: string;
}

@ObjectType()
export class Video {
  @Field(() => ID)
  id: string;

  @Field()
  originalName: string;

  @Field(() => VideoStatus)
  status: VideoStatus;

  @Field({ nullable: true })
  thumbnailUrl?: string;

  @Field(() => [VideoVersion])
  versions: VideoVersion[];

  @Field()
  createdAt: string;

  @Field()
  updatedAt: string;
}

@ObjectType()
export class UploadResponse {
  @Field(() => Video)
  video: Video;
}