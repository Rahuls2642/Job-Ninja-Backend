import { Module } from "@nestjs/common";
import { ResumeController } from "./controllers/resume.controller";
import { ResumeService } from "./services/resume.service";
import { StorageModule } from "../../common/storage/storage.module";

@Module({
  imports: [StorageModule],
  controllers: [ResumeController],
  providers: [ResumeService],
  exports: [ResumeService],
})
export class ResumeModule {}
