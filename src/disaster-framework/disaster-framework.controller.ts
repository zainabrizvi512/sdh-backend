import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateIncidentTimelineEventDto } from './dto/create-incident-timeline-event.dto';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { CreateLiveCommunicationDto } from './dto/create-live-communication.dto';
import { CreateOperationalTaskDto } from './dto/create-operational-task.dto';
import { UpdateOperationalTaskStatusDto } from './dto/update-operational-task-status.dto';
import { DisasterFrameworkService } from './disaster-framework.service';
import { OperationalTaskStatus } from './operational-task.entity';

@UseGuards(JwtAuthGuard)
@Controller('disaster-framework')
export class DisasterFrameworkController {
  constructor(private readonly disasterFrameworkService: DisasterFrameworkService) { }

  @Get('dashboard')
  getDashboard() {
    return this.disasterFrameworkService.getDashboard();
  }

  @Post('incidents')
  createIncident(@Body() dto: CreateIncidentDto) {
    return this.disasterFrameworkService.createIncident(dto);
  }

  @Get('communication')
  getCommunicationFeed() {
    return this.disasterFrameworkService.getCommunicationFeed();
  }

  @Post('communication')
  postCommunication(@Req() req: any, @Body() dto: CreateLiveCommunicationDto) {
    return this.disasterFrameworkService.postCommunication(req.user?.sub, dto);
  }

  @Get('tasks')
  listTasks(@Query('status') status?: OperationalTaskStatus) {
    return this.disasterFrameworkService.listOperationalTasks(status);
  }

  @Post('tasks')
  createTask(@Body() dto: CreateOperationalTaskDto) {
    return this.disasterFrameworkService.createOperationalTask(dto);
  }

  @Patch('tasks/:id/status')
  updateTaskStatus(@Param('id') id: string, @Body() dto: UpdateOperationalTaskStatusDto) {
    return this.disasterFrameworkService.updateOperationalTaskStatus(id, dto);
  }

  @Get('timeline')
  getTimeline(@Query('incidentId') incidentId?: string) {
    return this.disasterFrameworkService.getIncidentTimeline(incidentId);
  }

  @Post('timeline')
  addTimelineEvent(@Body() dto: CreateIncidentTimelineEventDto) {
    return this.disasterFrameworkService.addTimelineEvent(dto);
  }
}
