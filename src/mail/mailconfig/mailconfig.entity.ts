import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { dbSchema } from 'src/utils';

@Table({ schema: dbSchema })
export class MailConfigs extends Model {
  @ApiProperty()
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  id: string;

  @ApiProperty()
  @Column({ unique: true, allowNull: false })
  email: string;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'smtp.gmail.com',
  })
  smtpHost: string;

  @ApiProperty()
  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 465 })
  smtpPort: number;

  @ApiProperty()
  @Column({ type: DataType.STRING, allowNull: false })
  smtpUser: string;

  @ApiProperty()
  @Column({ type: DataType.STRING, allowNull: false })
  smtpPass: string;

  @ApiProperty()
  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  createdAt: Date;

  @ApiProperty()
  @UpdatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  updatedAt: Date;
}
