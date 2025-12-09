import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly ds: DataSource) {}

  async regionSummary(region: string) {
    const risk = await this.ds.query(`
      select d.name as disaster, r.score, r."createdAt"
      from public.risk_assessments r
      join public.disaster_types d on d.id = r."disasterTypeId"
      where r.region=$1 and r."createdAt" > now() - interval '48 hours'
      order by r."createdAt" desc
    `,[region]);

    const hazards = await this.ds.query(`
      select m.id, m."createdAt", m.text, m."location_lat", m."location_lng"
      from public.messages m
      where m.kind='hazard_report' and m."createdAt" > now() - interval '24 hours'
    `);

    const volume = await this.ds.query(`
      select date_trunc('hour',"createdAt") as h, count(*) as c
      from public.messages
      where "createdAt" > now() - interval '12 hours'
      group by 1 order by 1
    `);

    return { risk, hazards, volume };
  }
}
