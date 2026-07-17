import { Module } from "@nestjs/common";
import { ApplicationsController } from "./controllers/applications.controller";
import { ApplicationsService } from "./services/applications.service";

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
