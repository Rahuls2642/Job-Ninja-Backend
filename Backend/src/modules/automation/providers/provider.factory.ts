import { Injectable, BadRequestException } from "@nestjs/common";
import { AutomationProvider } from "./provider.interface";
import { GreenhouseProvider } from "./greenhouse/greenhouse.provider";
import { LeverProvider } from "./lever/lever.provider";
import { AshbyProvider } from "./ashby/ashby.provider";
import { WorkdayProvider } from "./workday/workday.provider";

@Injectable()
export class ProviderFactory {
  private providers: AutomationProvider[];

  constructor(
    greenhouse: GreenhouseProvider,
    lever: LeverProvider,
    ashby: AshbyProvider,
    workday: WorkdayProvider,
  ) {
    this.providers = [greenhouse, lever, ashby, workday];
  }

  getProvider(url: string): AutomationProvider {
    const provider = this.providers.find((p) => p.supports(url));
    if (!provider) {
      throw new BadRequestException(`No automation provider found for job page: ${url}`);
    }
    return provider;
  }
}
