import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { RiskAssessment } from './risk-assessment.entity';
import { RiskSignal } from './risk-signal.entity';
import { DisasterType } from 'src/safety/disaster-type.entity';
import type { Server } from 'socket.io';

@Injectable()
export class RiskService {
  constructor(
    @InjectRepository(RiskAssessment) private readonly riskRepo: Repository<RiskAssessment>,
    @InjectRepository(RiskSignal) private readonly signalRepo: Repository<RiskSignal>,
    @InjectRepository(DisasterType) private readonly dtRepo: Repository<DisasterType>,
  ) {}

  private computeScore(features: Record<string, any>): number {
    const { rainfall=0, wind=0, riverLevel=0, userReports=0 } = features;
    let score = 0;
    score += Math.min(40, rainfall * 0.4);
    score += Math.min(25, wind * 0.25);
    score += Math.min(25, riverLevel * 0.25);
    score += Math.min(10, userReports * 2);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  async ingestSignal(dto: { region: string; disasterTypeId: string; source: string; payload: any }) {
    await this.signalRepo.save(this.signalRepo.create(dto));
    return { ok: true };
  }

  async refreshRegion(region: string, io?: Server) {
    const since = new Date(Date.now() - 24*60*60*1000);
    const disasters = await this.dtRepo.find();
    const results: RiskAssessment[] = [];

    for (const d of disasters) {
      const sigs = await this.signalRepo.find({
        where: { region, disasterTypeId: d.id, createdAt: MoreThan(since) },
      });
      const agg = {
        rainfall: avg(sigs.map(s => s.payload?.rainfall)),
        wind: avg(sigs.map(s => s.payload?.wind)),
        riverLevel: avg(sigs.map(s => s.payload?.riverLevel)),
        userReports: sigs.filter(s => s.source==='report').length,
      };
      const saved = await this.riskRepo.save(this.riskRepo.create({
        region, disasterTypeId: d.id, score: this.computeScore(agg), features: agg,
      }));
      results.push(saved);
      io?.to(`region:${region}`).emit('risk:update', {
        region, disasterTypeId: d.id, score: saved.score, features: agg, at: saved.createdAt,
      });
    }
    return results;
  }

  async latest(region: string) {
    return this.riskRepo.query(`
      select distinct on ("disasterTypeId") *
      from public.risk_assessments
      where region=$1
      order by "disasterTypeId","createdAt" desc
    `,[region]);
  }
}

function avg(xs: (number|undefined)[]) {
  const a = xs.filter((x): x is number => typeof x === 'number');
  return a.length ? a.reduce((s,v)=>s+v,0)/a.length : 0;
}
