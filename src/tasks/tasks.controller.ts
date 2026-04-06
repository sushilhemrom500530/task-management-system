import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateTaskDto, @GetUser() user: User) {
    const task = await this.tasksService.create(dto, user);
    return { message: 'Task created', data: task };
  }

  @Get()
  async findAll(@GetUser() user: User) {
    const tasks = await this.tasksService.findAll(user);
    return { message: 'Tasks retrieved', data: tasks };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const task = await this.tasksService.findOne(id);
    return { message: 'Task retrieved', data: task };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @GetUser() user: User,
  ) {
    const task = await this.tasksService.update(id, dto, user);
    return { message: 'Task updated', data: task };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    await this.tasksService.remove(id, user);
    return { message: 'Task deleted', data: null };
  }
}
