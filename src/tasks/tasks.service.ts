import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit-log.entity';
import { User } from '../users/user.entity';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateTaskDto, actor: User): Promise<Task> {
    const task = this.taskRepo.create({
      ...dto,
      createdById: actor.id,
    });
    const saved = await this.taskRepo.save(task);

    await this.auditService.log({
      actorId: actor.id,
      action: AuditAction.TASK_CREATED,
      targetTaskId: saved.id,
      meta: { title: saved.title, assignedUserId: saved.assignedUserId },
    });

    return this.findOne(saved.id);
  }

  async findAll(actor: User): Promise<Task[]> {
    if (actor.role === Role.ADMIN) {
      return this.taskRepo.find({
        relations: ['assignedUser', 'createdBy'],
        order: { createdAt: 'DESC' },
      });
    }
    // Regular users only see their assigned tasks
    return this.taskRepo.find({
      where: { assignedUserId: actor.id },
      relations: ['assignedUser', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['assignedUser', 'createdBy'],
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, actor: User): Promise<Task> {
    const task = await this.findOne(id);

    // Regular users can only update status of their own tasks
    if (actor.role === Role.USER) {
      if (task.assignedUserId !== actor.id) {
        throw new ForbiddenException('You can only update your own tasks');
      }
      // Only allow status changes for regular users
      const { status } = dto;
      if (!status)
        throw new ForbiddenException('Users can only change task status');

      const before = { status: task.status };
      task.status = status;
      const updated = await this.taskRepo.save(task);

      await this.auditService.log({
        actorId: actor.id,
        action: AuditAction.TASK_STATUS_CHANGED,
        targetTaskId: id,
        meta: { before, after: { status } },
      });

      return updated;
    }

    // Admin full update
    const before: any = {};
    const after: any = {};

    if (dto.title && dto.title !== task.title) {
      before.title = task.title;
      after.title = dto.title;
    }
    if (dto.description !== undefined && dto.description !== task.description) {
      before.description = task.description;
      after.description = dto.description;
    }
    if (dto.status && dto.status !== task.status) {
      before.status = task.status;
      after.status = dto.status;
    }
    if (dto.assignedUserId && dto.assignedUserId !== task.assignedUserId) {
      before.assignedUserId = task.assignedUserId;
      after.assignedUserId = dto.assignedUserId;
    }

    Object.assign(task, dto);
    const updated = await this.taskRepo.save(task);

    // Determine most specific audit action
    let action = AuditAction.TASK_UPDATED;
    if (after.status) action = AuditAction.TASK_STATUS_CHANGED;
    if (after.assignedUserId) action = AuditAction.TASK_ASSIGNED;

    await this.auditService.log({
      actorId: actor.id,
      action,
      targetTaskId: id,
      meta: { before, after },
    });

    return this.findOne(updated.id);
  }

  async remove(id: string, actor: User): Promise<void> {
    const task = await this.findOne(id);

    await this.auditService.log({
      actorId: actor.id,
      action: AuditAction.TASK_DELETED,
      targetTaskId: id,
      meta: { title: task.title, status: task.status },
    });

    await this.taskRepo.remove(task);
  }
}
