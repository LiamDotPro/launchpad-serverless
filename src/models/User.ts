import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { Field, ID, ObjectType } from '@nestjs/graphql'

@Entity()
@ObjectType()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field(() => String, { nullable: true })
  @Column({ type: "text", nullable: true })
  firstName: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: "text", nullable: true })
  lastName: string | null;

  @Field(() => String)
  @Column()
  password: string;

  @Field(() => String,  { nullable: true })
  @Column()
  email: string;

  @Field(() => String,  { nullable: true })
  @Column({ type: "text", nullable: true })
  telephone: string;
}
