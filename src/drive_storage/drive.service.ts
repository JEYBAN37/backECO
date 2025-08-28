import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

interface VideoStatus {
  processed: boolean;
  status: 'processing' | 'ready';
}

export const DRIVE_SCOPES = [
  'https://drive.google.com/',
  'https://www.googleapis.com/drive/',
];

export const VALID_FOLDERS = [
  '1iSJMKnKE0oXp3QxlY03nsKQsv1KHMbhc',
  '1PKmm05PopK40UjKrQaBQpiAL8bb2Nx-V',
];

// Agregar nueva interfaz para los archivos de Drive
interface DriveFile {
  id?: string;
  name?: string;
  mimeType?: string;
  size?: string;
  videoMediaMetadata?: {
    durationMillis?: number;
  };
  capabilities?: {
    canDownload?: boolean;
  };
  webContentLink?: string;
}

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  private drive: any;
  private auth: any;

  constructor(private readonly configService: ConfigService) {}

  // Call this method after constructing the service to initialize Drive
  async onModuleInit() {
    await this.initializeDrive();
  }

  private async initializeDrive() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      let privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          private_key: privateKey,
          client_email: clientEmail,
          project_id: projectId,
        },
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/drive.metadata.readonly',
        ],
      });
      this.drive = google.drive({
        version: 'v3',
        auth: this.auth,
      });
      if (!this.drive || !this.auth) {
        throw new Error('Drive or Auth not properly initialized');
      }
      this.logger.log('✅ Google Drive API initialized successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('❌ Error initializing Drive service:', errorMessage);
      // Se permitirá reintentar en primer uso
      this.logger.warn('Drive service will attempt to initialize on first use');
    }
  }

  // Método para verificar la conexión
  async verifyConnection() {
    try {
      if (!this.drive?.files) {
        await this.initializeDrive();
      }

      await this.drive.files.list({
        pageSize: 1,
      });
      this.logger.log('✅ Drive API connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('❌ Error verifying Drive connection:', error);
      return false;
    }
  }

  public extractFileId(url: string): string | null {
    // Handle Drive URLs
    if (url.includes('drive.google.com')) {
      if (url.includes('/file/d/')) {
        return url.split('/file/d/')[1].split('/')[0];
      } else if (url.includes('id=')) {
        return url.split('id=')[1].split('&')[0];
      }
    }
    // Handle simple filenames - just return the filename itself
    if (/\.(mp4|webm|mov|avi)$/i.test(url)) {
      return url;
    }
    return null;
  }

  async getFileInfo(fileId: string) {
    try {
      if (!this.drive?.files) {
        await this.initializeDrive();
      }

      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, parents',
      });
      return response?.data || null;
    } catch (error) {
      this.logger.error(`Error getting file info for ${fileId}:`, error);
      throw new Error('Error accessing Drive file');
    }
  }

  async listFolderVideos() {
    try {
      if (!this.drive?.files || !this.auth) {
        await this.initializeDrive();
      }

      const videos = [];

      const credentials = await this.auth.getClient();
      const accessTokenResponse = await credentials?.getAccessToken();
      const accessToken = accessTokenResponse?.token;

      if (!accessToken || typeof accessToken !== 'string') {
        throw new Error('Could not obtain valid access token');
      }

      for (const folderId of VALID_FOLDERS) {
        this.logger.debug(`Fetching videos from folder: ${folderId}`);

        const response = await this.drive.files.list({
          q: `'${folderId}' in parents and (mimeType contains 'video/') and trashed=false`,
          fields:
            'files(id, name, mimeType, size, videoMediaMetadata, capabilities, webContentLink)',
          orderBy: 'name',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        if (response.data.files && response.data.files.length > 0) {
          const processedVideos = await Promise.all(
            response.data.files.map(async (file: DriveFile) => {
              try {
                if (!file.id) return null;

                return {
                  id: file.id,
                  name: file.name || 'Sin nombre',
                  mimeType: file.mimeType || 'video/mp4',
                  thumbnailUrl: this.getThumbnailUrl(file.id),
                  previewUrl: this.getPreviewUrl(file.id),
                  streamUrl: this.getStreamUrl(file.id, accessToken),
                  downloadUrl: this.getDownloadUrl(file.id, accessToken),
                  embedUrl: this.getEmbedUrl(file.id),
                  webContentLink: file.webContentLink,
                  size: parseInt(file.size || '0', 10),
                  duration: file.videoMediaMetadata?.durationMillis,
                  status: 'ready',
                };
              } catch (error) {
                this.logger.error(`Error processing video ${file.id}:`, error);
                return null;
              }
            }),
          );

          videos.push(...processedVideos.filter((v) => v !== null));
        } else {
          this.logger.warn(`No videos found in folder: ${folderId}`);
        }
      }

      this.logger.debug(`✅ Videos fetched: ${videos.length}`);
      return videos;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error listing folder videos:', errorMessage);
      throw new Error(`Failed to list folder videos: ${errorMessage}`);
    }
  }

  async checkVideoStatus(fileId: string): Promise<VideoStatus> {
    try {
      if (!this.drive?.files) {
        await this.initializeDrive();
      }

      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, videoMediaMetadata, capabilities',
        supportsAllDrives: true,
      });

      const data = response?.data;
      if (!data) {
        throw new Error('No data received from Drive API');
      }

      const canDownload = data.capabilities?.canDownload ?? false;
      const hasVideoMetadata = !!data.videoMediaMetadata;
      const isProcessed = canDownload && hasVideoMetadata;

      return {
        processed: isProcessed,
        status: isProcessed ? 'ready' : 'processing',
      };
    } catch (error) {
      this.logger.error(`Error checking video status for ${fileId}:`, error);
      throw error;
    }
  }

  async getAccessToken(fileId: string): Promise<string> {
    try {
      if (!this.drive?.files) {
        await this.initializeDrive();
      }

      const response = await this.drive.files.get({
        fileId,
        fields: 'id',
        acknowledgeAbuse: true,
        alt: 'media'
      }, {
        responseType: 'stream'
      });

      const authHeader = response?.config?.headers?.Authorization;
      if (!authHeader || typeof authHeader !== 'string') {
        throw new Error('No valid authorization header found');
      }

      return authHeader.replace('Bearer ', '');
    } catch (error) {
      this.logger.error(`Error getting access token for ${fileId}:`, error);
      throw error;
    }
  }

  private getThumbnailUrl(fileId: string): string {
    return `${DRIVE_SCOPES[0]}thumbnail?id=${fileId}&sz=w400-h300-n`;
  }

  private getPreviewUrl(fileId: string): string {
    return `${DRIVE_SCOPES[0]}file/d/${fileId}/preview`;
  }

  private getDownloadUrl(fileId: string, accessToken: string): string {
    return `${DRIVE_SCOPES[1]}files/${fileId}?alt=media&access_token=${accessToken}`;
  }

  private getStreamUrl(fileId: string, accessToken: string): string {
    return `${DRIVE_SCOPES[1]}files/${fileId}?alt=media&access_token=${accessToken}`;
  }

  private getEmbedUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  public isValidDriveUrl(url: string): boolean {
    if (url.includes('drive.google.com')) {
      return url.includes('/file/d/') || url.includes('?id=');
    }
    return /\.(mp4|webm|mov|avi)$/i.test(url);
  }
}
