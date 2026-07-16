import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { ResumeModule } from "./modules/resume/resume.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { AiModule } from "./modules/ai/ai.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        AuthModule,
        UsersModule,
        ProfileModule,
        ResumeModule,
        JobsModule,
        AiModule,
    ],
})
export class AppModule { }