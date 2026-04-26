import { OperationalTaskPriority } from '../operational-task.entity';

export class CreateOperationalTaskDto {
  title: string;
  details?: string;
  incidentId?: string;
  assignedToSub?: string;
  assignedTeam?: string;
  priority?: OperationalTaskPriority;
  dueAt?: string;
}
