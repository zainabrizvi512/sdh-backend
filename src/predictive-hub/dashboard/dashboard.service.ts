import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(private readonly ds: DataSource) { }

  async regionSummary(region: string) {
    const risk = await this.ds.query(`
      select d.name as disaster, r.score, r."createdAt"
      from public.risk_assessments r
      join public.disaster_types d on d.id = r."disasterTypeId"
      where r.region='${region}' and r."createdAt" > now() - interval '48 hours'
      order by r."createdAt" desc
    `);

    const hazards = await this.ds.query(`
      select m.id, m."createdAt", m.text, m."location_lat", m."location_lng"
      from public.messages m
      where m.kind='hazard_report' 
      and m."createdAt" > now() - interval '24 hours'
      and m."location_lat" IS NOT NULL  -- Filter out nulls
      and m."location_lng" IS NOT NULL
    `);

    const volume = await this.ds.query(`
      select 
      to_char(date_trunc('hour', "createdAt"), 'Mon DD, HH:MI AM') as h, 
      count(*) as c
      from public.messages
      where "createdAt" > now() - interval '12 hours'
      group by date_trunc('hour', "createdAt")
      order by date_trunc('hour', "createdAt")
    `);

    return { risk, hazards, volume };
  }
}
