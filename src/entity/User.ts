import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryColumn()
  id!: number;

  @Column()
  first_name!: string;

  @Column()
  last_name?: string;

  @Column()
  username?: string;
}
