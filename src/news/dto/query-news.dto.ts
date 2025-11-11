export class QueryNewsDto {
    search?: string; // matches title/description (simple LIKE)
    limit = 20;
    offset = 0;
    orderBy: 'createdAt' | 'updatedAt' | 'title' = 'createdAt';
    order: 'ASC' | 'DESC' = 'DESC';
}
