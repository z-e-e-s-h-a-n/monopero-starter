import { Controller, Get, Req } from "@nestjs/common";
import { PublicService } from "./public.service";
import type { Request } from "express";
import { Public } from "@decorators/public.decorator";

@Controller()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Get("/")
  welcome(@Req() req: Request) {
    return this.publicService.welcome(req);
  }

  @Public()
  @Get("/health")
  healthCheck() {
    return this.publicService.getHealth();
  }
}
