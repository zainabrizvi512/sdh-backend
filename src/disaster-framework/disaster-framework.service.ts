import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { CreateIncidentTimelineEventDto } from './dto/create-incident-timeline-event.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { CreateLiveCommunicationDto } from './dto/create-live-communication.dto';
import { CreateOperationalTaskDto } from './dto/create-operational-task.dto';
import { UpdateOperationalTaskStatusDto } from './dto/update-operational-task-status.dto';
import { DisasterIncident, IncidentSeverity, IncidentStatus } from './disaster-incident.entity';
import { IncidentTimelineEvent } from './incident-timeline.entity';
import { LiveCommunication } from './live-communication.entity';
import { OperationalTask, OperationalTaskPriority, OperationalTaskStatus } from './operational-task.entity';

@Injectable()
export class DisasterFrameworkService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(DisasterIncident)
    private readonly incidentsRepo: Repository<DisasterIncident>,
    @InjectRepository(LiveCommunication)
    private readonly commsRepo: Repository<LiveCommunication>,
    @InjectRepository(OperationalTask)
    private readonly tasksRepo: Repository<OperationalTask>,
    @InjectRepository(IncidentTimelineEvent)
    private readonly timelineRepo: Repository<IncidentTimelineEvent>,
  ) { }

  private async getUserBySub(sub: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { sub } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createIncident(dto: CreateIncidentDto) {
    if (!dto.title?.trim()) throw new BadRequestException('title is required');
    const incident = this.incidentsRepo.create({
      title: dto.title.trim(),
      description: dto.description?.trim(),
      sector: dto.sector?.trim() || 'SECTOR ISLAMABAD',
      severity: dto.severity ?? IncidentSeverity.HIGH,
      status: IncidentStatus.OPEN,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
    return this.incidentsRepo.save(incident);
  }

  async listIncidents() {
    const incidents = await this.incidentsRepo.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return incidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      description: incident.description ?? null,
      sector: incident.sector,
      severity: incident.severity,
      status: incident.status,
      createdAt: incident.createdAt,
    }));
  }

  async getDashboard() {
    const [activeIncidents, responders, criticalTasks, latestIncidents] = await Promise.all([
      this.incidentsRepo.count({ where: [{ status: IncidentStatus.OPEN }, { status: IncidentStatus.IN_PROGRESS }] }),
      this.usersRepo.count(),
      this.tasksRepo.count({ where: { priority: OperationalTaskPriority.CRITICAL, status: OperationalTaskStatus.ASSIGNED } }),
      this.incidentsRepo.find({ order: { createdAt: 'DESC' }, take: 20 }),
    ]);

    const mapLayers = latestIncidents.map((incident) => ({
      incidentId: incident.id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      sector: incident.sector,
      latitude: incident.latitude ? Number(incident.latitude) : null,
      longitude: incident.longitude ? Number(incident.longitude) : null,
    }));

    return {
      systemLive: true,
      sector: 'ISLAMABAD',
      metrics: {
        activeIncidents,
        responders,
        criticalTasks,
      },
      map: {
        active: true,
        layers: mapLayers,
      },
    };
  }

  async postCommunication(sub: string, dto: CreateLiveCommunicationDto) {
    if (!dto.message?.trim()) throw new BadRequestException('message is required');
    const sender = await this.getUserBySub(sub);

    const comm = this.commsRepo.create({
      sender,
      channel: dto.channel?.trim() || 'SECURE CHANNEL',
      message: dto.message.trim(),
      sector: dto.sector?.trim() || 'SECTOR ISLAMABAD',
    });
    return this.commsRepo.save(comm);
  }

  async getCommunicationFeed() {
    const feed = await this.commsRepo.find({
      order: { createdAt: 'DESC' },
      take: 50,
      relations: ['sender'],
    });
    return {
      feed: feed.map((entry) => ({
        id: entry.id,
        message: entry.message,
        channel: entry.channel,
        sector: entry.sector ?? null,
        sender: entry.sender?.name ?? entry.sender?.username ?? entry.sender?.email ?? 'Responder',
        timestamp: entry.createdAt,
      })),
    };
  }

  async createOperationalTask(dto: CreateOperationalTaskDto) {
    if (!dto.title?.trim()) throw new BadRequestException('title is required');

    let incident: DisasterIncident | undefined;
    if (dto.incidentId) {
      const foundIncident = await this.incidentsRepo.findOne({ where: { id: dto.incidentId } });
      if (!foundIncident) throw new NotFoundException('Incident not found');
      incident = foundIncident;
    }

    let assignedTo: User | undefined;
    if (dto.assignedToSub) {
      const user = await this.usersRepo.findOne({ where: { sub: dto.assignedToSub } });
      if (!user) throw new NotFoundException('Assigned user not found');
      assignedTo = user;
    }

    const task = this.tasksRepo.create({
      title: dto.title.trim(),
      details: dto.details?.trim(),
      incident,
      assignedTo,
      assignedTeam: dto.assignedTeam?.trim(),
      priority: dto.priority ?? OperationalTaskPriority.HIGH,
      status: OperationalTaskStatus.ASSIGNED,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
    });
    return this.tasksRepo.save(task);
  }

  async listOperationalTasks(status?: OperationalTaskStatus) {
    const tasks = await this.tasksRepo.find({
      where: status ? { status } : {},
      relations: ['incident', 'assignedTo'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return {
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        details: task.details ?? null,
        priority: task.priority,
        status: task.status,
        assignedTeam: task.assignedTeam ?? null,
        assignedTo: task.assignedTo ? {
          id: task.assignedTo.id,
          name: task.assignedTo.name ?? task.assignedTo.username ?? task.assignedTo.email,
        } : null,
        incident: task.incident ? {
          id: task.incident.id,
          title: task.incident.title,
          sector: task.incident.sector,
        } : null,
        dueAt: task.dueAt ?? null,
      })),
    };
  }

  async updateOperationalTaskStatus(taskId: string, dto: UpdateOperationalTaskStatusDto) {
    if (!dto.status) throw new BadRequestException('status is required');
    const task = await this.tasksRepo.findOne({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    task.status = dto.status;
    return this.tasksRepo.save(task);
  }

  async addTimelineEvent(dto: CreateIncidentTimelineEventDto) {
    if (!dto.incidentId) throw new BadRequestException('incidentId is required');
    if (!dto.title?.trim()) throw new BadRequestException('title is required');

    const incident = await this.incidentsRepo.findOne({ where: { id: dto.incidentId } });
    if (!incident) throw new NotFoundException('Incident not found');

    const event = this.timelineRepo.create({
      incident,
      title: dto.title.trim(),
      report: dto.report?.trim(),
      eventTime: dto.eventTime ? new Date(dto.eventTime) : new Date(),
    });
    return this.timelineRepo.save(event);
  }

  async getIncidentTimeline(incidentId?: string) {
    const where = incidentId ? { incident: { id: incidentId } } : {};
    const events = await this.timelineRepo.find({
      where,
      relations: ['incident'],
      order: { eventTime: 'ASC', createdAt: 'ASC' },
      take: 200,
    });

    return {
      timeline: events.map((event) => ({
        id: event.id,
        incidentId: event.incident.id,
        incidentTitle: event.incident.title,
        time: event.eventTime ?? event.createdAt,
        title: event.title,
        report: event.report ?? null,
      })),
    };
  }
}
