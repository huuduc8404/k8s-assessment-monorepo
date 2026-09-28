import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { GraphQLUpload, FileUpload } from 'graphql-upload-minimal';
import { UploadService } from './upload.service';
import { UploadFile } from './upload.dto';
import { VideoService } from '../video/video.service';
import { VideoStatus } from '../video/video.dto';

@Resolver()
export class UploadResolver {
  constructor(
    private uploadService: UploadService,
    private videoService: VideoService,
  ) {}

  @Mutation(() => UploadFile)
  async uploadVideo(@Args({ name: 'file', type: () => GraphQLUpload }) file: FileUpload): Promise<UploadFile> {
    const { createReadStream, filename, mimetype, encoding } = await file;
    
    const stream = createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const multerFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: filename,
      encoding,
      mimetype,
      buffer,
      size: buffer.length,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    const uploadFile = await this.uploadService.handleUpload(multerFile);
    
    // Get the video that was created (the last one)
    const videos = await this.videoService.getAllVideos();
    const video = videos[0];
    
    if (video) {
      this.uploadService.processVideo(uploadFile, video.id);
    }

    return uploadFile;
  }
}