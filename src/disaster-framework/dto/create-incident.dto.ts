import { IncidentSeverity } from '../disaster-incident.entity';

export class CreateIncidentDto {
  title: string;
  description?: string;
  sector?: string;
  severity?: IncidentSeverity;
  latitude?: number;
  longitude?: number;
}
