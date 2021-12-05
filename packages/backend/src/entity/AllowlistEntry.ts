import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class AllowlistEntry {
  @PrimaryColumn()
  address: string;

  @PrimaryColumn()
  style_token_id: string;

  @Column()
  signature: string;

  @Column()
  chain_id: number;
}
