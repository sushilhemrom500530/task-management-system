import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Role } from '../common/enums/role.enum';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [User],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo.find();
  if (existing.length > 0) {
    console.log('Already seeded. Skipping.');
    process.exit(0);
  }

  const hashedAdmin = await bcrypt.hash('admin123', 10);
  const hashedUser = await bcrypt.hash('user123', 10);

  await userRepo.save([
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedAdmin,
      role: Role.ADMIN,
    },
    {
      name: 'John Doe',
      email: 'user@example.com',
      password: hashedUser,
      role: Role.USER,
    },
  ]);

  console.log(
    '✅ Seeded: admin@example.com / admin123 and user@example.com / user123',
  );
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
