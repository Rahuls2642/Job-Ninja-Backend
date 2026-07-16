import { Injectable, Inject, NotFoundException, BadRequestException } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import { resumes } from "../../../database/schema/resumes";
import { eq, and, desc, count } from "drizzle-orm";
import { StorageProvider } from "../../../common/storage/storage.interface";
import { randomUUID } from "crypto";

@Injectable()
export class ResumeService {
  constructor(
    @Inject("StorageProvider")
    private readonly storageProvider: StorageProvider,
  ) {}

  async uploadResume(userId: string, title: string, file: Express.Multer.File) {
    // 1. Validation: Max 20 resumes per user
    const [{ value: countResumes }] = await db
      .select({ value: count() })
      .from(resumes)
      .where(eq(resumes.userId, userId));

    if (countResumes >= 20) {
      throw new BadRequestException("Maximum limit of 20 resumes reached");
    }

    // 2. Validation: File extension & mimetype
    if (!file) {
      throw new BadRequestException("File is required");
    }

    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const originalExt = file.originalname.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["pdf", "docx"];

    if (!allowedMimeTypes.includes(file.mimetype) || !originalExt || !allowedExtensions.includes(originalExt)) {
      throw new BadRequestException("Unsupported file type. Only PDF and DOCX are allowed.");
    }

    // Size limit: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException("File too large. Maximum size is 5 MB.");
    }

    // 3. Upload to R2
    // Folder structure: resumes/user-id/uuid.ext
    const uuid = randomUUID();
    const fileKey = `resumes/${userId}/${uuid}.${originalExt}`;
    const fileUrl = await this.storageProvider.upload(file, fileKey);

    // 4. Determine if it's the default resume
    // It is default if it's the user's first resume
    const isDefault = countResumes === 0;

    // 5. Insert into Database
    const [newResume] = await db
      .insert(resumes)
      .values({
        userId,
        title,
        fileName: file.originalname,
        fileKey,
        fileUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
        version: 1,
        isDefault,
      })
      .returning();

    return {
      id: newResume.id,
      title: newResume.title,
      isDefault: newResume.isDefault,
    };
  }

  async findAll(userId: string) {
    const list = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.createdAt));

    // Support both client formats by mapping default to isDefault
    return list.map((r) => ({
      id: r.id,
      title: r.title,
      isDefault: r.isDefault,
      default: r.isDefault,
      fileName: r.fileName,
      fileUrl: r.fileUrl,
      version: r.version,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async findOne(userId: string, id: string) {
    const result = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException("Resume not found");
    }

    return result[0];
  }

  async renameResume(userId: string, id: string, title: string) {
    // Check ownership & existence
    await this.findOne(userId, id);

    const [updated] = await db
      .update(resumes)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
      .returning();

    return {
      id: updated.id,
      title: updated.title,
      isDefault: updated.isDefault,
      default: updated.isDefault,
    };
  }

  async deleteResume(userId: string, id: string) {
    // 1. Check ownership & existence
    const resume = await this.findOne(userId, id);

    // 2. Delete file from R2
    await this.storageProvider.delete(resume.fileKey);

    // 3. Delete metadata record from DB
    await db.delete(resumes).where(eq(resumes.id, id));

    // 4. If the deleted resume was the default, choose another as default if available
    if (resume.isDefault) {
      const remaining = await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(desc(resumes.updatedAt))
        .limit(1);

      if (remaining.length > 0) {
        await db
          .update(resumes)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(resumes.id, remaining[0].id));
      }
    }
  }

  async setDefaultResume(userId: string, id: string) {
    // 1. Check ownership & existence
    await this.findOne(userId, id);

    // 2. Perform flags swap inside transaction
    await db.transaction(async (tx) => {
      // Set all other resumes of this user to non-default
      await tx
        .update(resumes)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(resumes.userId, userId));

      // Set targeted resume to default
      await tx
        .update(resumes)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(resumes.id, id));
    });

    const updated = await this.findOne(userId, id);
    return {
      id: updated.id,
      title: updated.title,
      isDefault: updated.isDefault,
      default: updated.isDefault,
    };
  }

  async downloadResume(userId: string, id: string) {
    // Check ownership & existence
    const resume = await this.findOne(userId, id);

    // Generate secure pre-signed download URL from storage provider
    return this.storageProvider.getSignedUrl(resume.fileKey);
  }
}
