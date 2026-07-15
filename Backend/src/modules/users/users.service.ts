import { Injectable } from "@nestjs/common";
import { db } from "../../database/drizzle";
import { users } from "../../database/schema/users";
import { eq } from "drizzle-orm";

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async create(userData: typeof users.$inferInsert) {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async update(id: string, updateData: Partial<typeof users.$inferInsert>) {
    const result = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
}
