import { Injectable } from "@nestjs/common";
import type { ClockPort } from "@/application/shared/port/clock.port";

@Injectable()
export class SystemClock implements ClockPort {
  public now(): Date {
    return new Date();
  }
}
