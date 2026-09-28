import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { UPLOAD_VIDEO, LIST_VIDEOS, VIDEO_STATUS, HEALTH_CHECK } from './graphql/queries';
import './App.css';

interface Video {
  id: string;
  originalName: string;
  status: string;
  thumbnailUrl?: string;
  versions: { resolution: string; url: string }[];
  createdAt: string;
  updatedAt: string;
}

interface UploadResult {
  uploadVideo: Video;
}

interface ListResult {
  videos: Video[];
}

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [uploadVideo] = useMutation<UploadResult>(UPLOAD_VIDEO, {
    refetchQueries: [{ query: LIST_VIDEOS }],
  });

  const { data, loading, error, refetch } = useQuery<ListResult>(LIST_VIDEOS, {
    pollInterval: 3000,
  });

  useEffect(() => {
    const healthCheck = async () => {
      try {
        await fetch('/api/health');
      } catch (e) {
        setMessage('Backend unavailable');
      }
    };
    healthCheck();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'video/mp4') {
      setSelectedFile(file);
      setMessage(null);
    } else {
      setMessage('Please select an MP4 video file');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setMessage('Uploading...');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await uploadVideo({ variables: { file: formData } });
      setMessage('Upload successful! Processing started.');
      setSelectedFile(null);
    } catch (err) {
      setMessage('Upload failed: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'processing': return '#ff9800';
      case 'failed': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Video Upload Platform</h1>
      </header>
      <main>
        <section className="upload-section">
          <h2>Upload Video</h2>
          <input type="file" accept="video/mp4" onChange={handleFileChange} disabled={uploading} />
          <button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {message && <p className={message.includes('failed') ? 'error' : 'success'}>{message}</p>}
        </section>

        <section className="videos-section">
          <h2>Videos</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="error">Error: {error.message}</p>}
          {!loading && !error && data?.videos.length === 0 && <p>No videos uploaded yet.</p>}
          <div className="video-grid">
            {data?.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const { data: subData } = useSubscription(VIDEO_STATUS, {
    variables: { id: video.id },
    skip: video.status === 'completed' || video.status === 'failed',
    onData: ({ data }) => {
      if (data.data?.videoStatus) {
        // Refetch to update the list
      }
    },
  });

  const displayVideo = subData?.videoStatus || video;
  const statusColor = getStatusColor(displayVideo.status);

  return (
    <div className="video-card">
      <div className="video-info">
        <h3>{displayVideo.originalName}</h3>
        <span className="status-badge" style={{ backgroundColor: statusColor }}>
          {displayVideo.status}
        </span>
      </div>
      {displayVideo.thumbnailUrl && (
        <img src={displayVideo.thumbnailUrl} alt={`${displayVideo.originalName} thumbnail`} className="thumbnail" />
      )}
      <div className="versions">
        {displayVideo.versions.map((v: { resolution: string; url: string }, i: number) => (
          <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="version-link">
            {v.resolution}
          </a>
        ))}
      </div>
      <small>Uploaded: {new Date(displayVideo.createdAt).toLocaleString()}</small>
    </div>
  );
};

function getStatusColor(status: string) {
  switch (status) {
    case 'completed': return '#4caf50';
    case 'processing': return '#ff9800';
    case 'failed': return '#f44336';
    default: return '#9e9e9e';
  }
}

export default App;