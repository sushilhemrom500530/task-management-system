import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { TaskStatus } from '../../common/enums/task-status.enum';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsUUID()
  @IsOptional()
  assignedUserId?: string;
}
