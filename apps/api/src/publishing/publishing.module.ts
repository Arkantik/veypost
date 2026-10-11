import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PublishingService } from './publishing.service.js';
import { PublishingProcessor } from './publishing.processor.js';
import { PublishingScheduler } from './publishing.scheduler.js';
import { PublishingController } from './publishing.controller.js';
import { PlatformDispatcher } from './platforms/platform-dispatcher.js';
import { RouterPlatformDispatcher } from './platforms/router.dispatcher.js';
import { PUBLISHING_QUEUE } from './publishing.types.js';

@Module({
  imports: [BullModule.registerQueue({ name: PUBLISHING_QUEUE })],
  controllers: [PublishingController],
  providers: [
    PublishingService,
    PublishingProcessor,
    PublishingScheduler,
    { provide: PlatformDispatcher, useClass: RouterPlatformDispatcher },
  ],
  exports: [PublishingService],
})
export class PublishingModule {}
