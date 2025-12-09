import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DecisionsService {
  constructor(private readonly ds: DataSource) {}

  async recommend(region: string) {
    const latest = await this.ds.query(`
      select distinct on (r."disasterTypeId") r.*
      from public.risk_assessments r
      where r.region=$1
      order by r."disasterTypeId", r."createdAt" desc
    `,[region]);

    const out = [];
    for (const r of latest) {
      const level = r.score >= 70 ? 'high' : r.score >= 40 ? 'medium' : 'low';
      const steps = await this.ds.query(`
        select * from public.guide_steps
        where "guideId" in (
          select id from public.safety_guides
          where "disasterTypeId"=$1 and published=true
        ) and phase=$2 order by "order" asc
      `,[r.disasterTypeId, level]);
      const checklist = await this.ds.query(`
        select * from public.checklist_items
        where "guideId" in (
          select id from public.safety_guides
          where "disasterTypeId"=$1 and published=true
        ) order by "order" asc
      `,[r.disasterTypeId]);
      out.push({ disasterTypeId: r.disasterTypeId, score: r.score, level, steps, checklist });
    }
    return out;
  }
}
