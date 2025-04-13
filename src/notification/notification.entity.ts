
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
export class Subscriptions extends Model {
  @ApiProperty()
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  id: string;

  @ApiProperty()
  @Column({ allowNull: true, type: DataType.UUID })
  userId: string;

  @ApiProperty()
  @Column({ type: DataType.STRING, allowNull: true })
  deviceId: string;

  @ApiProperty()
  @Column({ type: DataType.TEXT, allowNull: false })
  endpoint: string;

  @ApiProperty()
  @Column({ type: DataType.JSONB, allowNull: false })
  keys: string;

  @ApiProperty()
  @Column({ type: DataType.STRING, allowNull: true })
  userAgent: string;

  @ApiProperty()
  @CreatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  createdAt: Date;

  @ApiProperty()
  @UpdatedAt
  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  updatedAt: Date;
}