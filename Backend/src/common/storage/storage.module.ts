import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SupabaseStorageService } from "./supabase-storage.service";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: "StorageProvider",
      useClass: SupabaseStorageService,
    },
  ],
  exports: ["StorageProvider"],
})
export class StorageModule {}
