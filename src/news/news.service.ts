import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { News } from './news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { QueryNewsDto } from './dto/query-news.dto';

@Injectable()
export class NewsService {
    constructor(
        @InjectRepository(News)
        private readonly repo: Repository<News>,
    ) { }

    async create(dto: CreateNewsDto): Promise<News> {
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(query: QueryNewsDto) {
        const { search, limit, offset, orderBy, order } = query;

        const where = search
            ? [
                { title: ILike(`%${search}%`) },
                { description: ILike(`%${search}%`) },
            ]
            : undefined;

        const [items, total] = await this.repo.findAndCount({
            where,
            order: { [orderBy]: order },
            take: limit,
            skip: offset,
        });

        return { items, total, limit, offset };
    }

    async findOne(id: string): Promise<News> {
        const item = await this.repo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('News not found');
        return item;
    }

    async update(id: string, dto: UpdateNewsDto): Promise<News> {
        const existing = await this.findOne(id);
        Object.assign(existing, dto);
        return this.repo.save(existing);
    }

    async remove(id: string): Promise<void> {
        const existing = await this.findOne(id);
        await this.repo.remove(existing);
    }
}
