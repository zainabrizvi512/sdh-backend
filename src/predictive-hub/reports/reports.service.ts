import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Server } from 'socket.io';

import { RiskSignal } from '../risk/risk-signal.entity';
import { RiskService } from '../risk/risk.service';

import { Message, MessageKind, MessageType } from 'src/messages/message.entity';
import { Group } from 'src/group/group.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(RiskSignal)
    private readonly signalRepo: Repository<RiskSignal>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    private readonly risk: RiskService,
  ) { }

  async createHazardReport(
    userId: string,
    dto: any,
    io?: Server,
  ) {
    // ---------------------------
    // 1) Save risk signal
    // ---------------------------
    const signal = await this.signalRepo.save(
      this.signalRepo.create({
        region: dto.region,
        disasterTypeId: dto.disasterTypeId,
        source: 'report',
        payload: {
          severity: dto.severity,
          text: dto.text,
          lat: dto.lat,
          lng: dto.lng,
          waterDepthCm: dto.waterDepthCm,
          peopleAffected: dto.peopleAffected,
          photoUrls: dto.photoUrls ?? [],
          userId,
        },
      }),
    );

    // ✅ log AFTER save
    console.log("✅ Signal saved id:", signal.id);

    if (!dto.groupId) {
      throw new BadRequestException("groupId is required for hazard reports");
    }

    // ---------------------------
    // 2) Save hazard message
    // ---------------------------
    const msg = await this.messageRepo.save(
      this.messageRepo.create({
        // relation
        group: dto.groupId ? ({ id: dto.groupId } as Group) : null,

        kind: MessageKind.LOCATION,
        type: MessageType.LOCATION,
        text: dto.text,

        // If your Message entity has JSON `location`
        location: {
          lat: dto.lat,
          lng: dto.lng,
          accuracy: 10,
        } as any,

        meta: {
          reportType: 'hazard_report',
          region: dto.region,
          disasterTypeId: dto.disasterTypeId,
          severity: dto.severity,
          waterDepthCm: dto.waterDepthCm,
          peopleAffected: dto.peopleAffected,
          photoUrls: dto.photoUrls ?? [],
          userId,
        },
      } as any),
    );

    // ✅ log AFTER save


    // ---------------------------
    // 3) recompute risk + broadcast
    // ---------------------------
    const updated = await this.risk.refreshRegion(dto.region, io);

    return {
      ok: true,
      signal,
      msg,
      updated,
    };
  }
}
