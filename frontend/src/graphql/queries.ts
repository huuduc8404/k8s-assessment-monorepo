import { gql } from '@apollo/client';

export const UPLOAD_VIDEO = gql`
  mutation UploadVideo($file: Upload!) {
    uploadVideo(file: $file) {
      id
      originalName
      status
      createdAt
    }
  }
`;

export const LIST_VIDEOS = gql`
  query ListVideos {
    videos {
      id
      originalName
      status
      thumbnailUrl
      versions {
        resolution
        url
      }
      createdAt
      updatedAt
    }
  }
`;

export const VIDEO_STATUS = gql`
  subscription VideoStatus($id: ID!) {
    videoStatus(id: $id) {
      id
      status
      versions {
        resolution
        url
      }
      thumbnailUrl
    }
  }
`;

export const HEALTH_CHECK = gql`
  query HealthCheck {
    health {
      status
      timestamp
    }
  }
`;