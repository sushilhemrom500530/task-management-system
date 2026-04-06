import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

interface LogParams {
  actorId: string;
  action: AuditAction;
  targetTaskId?: string;
  meta?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(params: LogParams): Promise<void> {
    const entry = this.auditRepo.create(params);
    await this.auditRepo.save(entry);
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditRepo.find({
      relations: ['actor'],
      order: { createdAt: 'DESC' },
    });
  }
}
