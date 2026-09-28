import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UploadFile {
  @Field(() => ID)
  id: string;

  @Field()
  filename: string;

  @Field()
  mimetype: string;

  @Field()
  encoding: string;

  @Field()
  path: string;
}