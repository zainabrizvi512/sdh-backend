import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { News } from './news.entity';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';

@Module({
    imports: [TypeOrmModule.forFeature([News]), NotificationsModule],
    controllers: [NewsController],
    providers: [NewsService],
    exports: [TypeOrmModule, NewsService],
})
export class NewsModule { }
