import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageProvider } from "./storage.interface";

@Injectable()
export class SupabaseStorageService implements StorageProvider {
  private readonly s3Client?: S3Client;
  private readonly bucketName: string;
  private readonly projectId?: string;
  private readonly accessKeyId?: string;
  private readonly secretAccessKey?: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.projectId = this.configService.get<string>("SUPABASE_PROJECT_ID");
    this.accessKeyId = this.configService.get<string>("SUPABASE_S3_ACCESS_KEY_ID");
    this.secretAccessKey = this.configService.get<string>("SUPABASE_S3_SECRET_ACCESS_KEY");
    this.bucketName = this.configService.get<string>("SUPABASE_STORAGE_BUCKET") || "applypilot-resumes";
    this.region = this.configService.get<string>("SUPABASE_S3_REGION") || "us-east-1";

    if (!this.projectId || !this.accessKeyId || !this.secretAccessKey) {
      console.warn(
        "WARNING: Supabase Storage configurations (SUPABASE_PROJECT_ID, SUPABASE_S3_ACCESS_KEY_ID, SUPABASE_S3_SECRET_ACCESS_KEY) are missing. SupabaseStorageService operations will fail."
      );
    } else {
      this.s3Client = new S3Client({
        endpoint: `https://${this.projectId}.storage.supabase.co/storage/v1/s3`,
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
        region: this.region,
        forcePathStyle: true, // Supabase S3 compatibility requires forcePathStyle
      });
    }
  }

  private checkConfig() {
    if (!this.s3Client || !this.projectId || !this.accessKeyId || !this.secretAccessKey) {
      throw new InternalServerErrorException(
        "Supabase Storage credentials are not configured. Please set credentials in your .env file."
      );
    }
  }

  async upload(file: Express.Multer.File, key: string): Promise<string> {
    this.checkConfig();
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client!.send(command);

      // Return public direct access URL
      return `https://${this.projectId}.supabase.co/storage/v1/object/public/${this.bucketName}/${key}`;
    } catch (error) {
      console.error("Supabase S3 Upload Error:", error);
      throw new InternalServerErrorException(`Storage upload failed: ${(error as Error).message}`);
    }
  }

  async delete(key: string): Promise<void> {
    this.checkConfig();
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client!.send(command);
    } catch (error) {
      console.warn("Supabase S3 Delete Warning:", error);
    }
  }

  async getSignedUrl(key: string): Promise<string> {
    this.checkConfig();
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // URL expires in 1 hour (3600 seconds)
      return await getSignedUrl(this.s3Client!, command, { expiresIn: 3600 });
    } catch (error) {
      console.error("Supabase S3 Signed URL Error:", error);
      throw new InternalServerErrorException(`Failed to generate signed URL: ${(error as Error).message}`);
    }
  }
}
