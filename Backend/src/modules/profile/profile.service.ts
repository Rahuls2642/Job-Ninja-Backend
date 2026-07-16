import { Injectable, NotFoundException } from "@nestjs/common";
import { db } from "../../database/drizzle";
import { profiles } from "../../database/schema/profiles";
import { users } from "../../database/schema/users";
import { eq } from "drizzle-orm";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class ProfileService {
  async getProfile(userId: string) {
    let result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    
    if (result.length === 0) {
      // If profile does not exist (e.g. for legacy users), create one by pulling from users table
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user[0]) {
        throw new NotFoundException("User not found");
      }
      
      const newProfile = await db.insert(profiles).values({
        userId,
        fullName: user[0].fullName,
        avatarUrl: user[0].avatarUrl,
        linkedinUrl: user[0].linkedinUrl,
        githubUrl: user[0].githubUrl,
        portfolioUrl: user[0].portfolioUrl,
        preferredRole: user[0].preferredRole,
        salaryExpectation: user[0].salaryExpectation,
        preferredLocation: user[0].location,
      }).returning();
      
      return newProfile[0];
    }
    
    return result[0];
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Ensure profile exists
    await this.getProfile(userId);

    const result = await db
      .update(profiles)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();

    // Optionally sync basic details back to users table if they are updated in profile
    const userUpdate: any = {};
    if (dto.fullName) userUpdate.fullName = dto.fullName;
    if (dto.linkedinUrl) userUpdate.linkedinUrl = dto.linkedinUrl;
    if (dto.githubUrl) userUpdate.githubUrl = dto.githubUrl;
    if (dto.portfolioUrl) userUpdate.portfolioUrl = dto.portfolioUrl;
    if (dto.preferredRole) userUpdate.preferredRole = dto.preferredRole;
    if (dto.salaryExpectation) userUpdate.salaryExpectation = dto.salaryExpectation;
    if (dto.preferredLocation) userUpdate.location = dto.preferredLocation;

    if (Object.keys(userUpdate).length > 0) {
      await db.update(users).set(userUpdate).where(eq(users.id, userId));
    }

    return result[0];
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.getProfile(userId);

    const result = await db
      .update(profiles)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();

    // Also sync to users table
    await db.update(users).set({ avatarUrl }).where(eq(users.id, userId));

    return result[0];
  }

  async deleteAvatar(userId: string) {
    await this.getProfile(userId);

    const result = await db
      .update(profiles)
      .set({ avatarUrl: null, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();

    // Also sync to users table
    await db.update(users).set({ avatarUrl: null }).where(eq(users.id, userId));

    return result[0];
  }
}
