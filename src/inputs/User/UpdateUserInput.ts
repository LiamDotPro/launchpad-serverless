import { Field, InputType } from 'type-graphql'

@InputType()
export class UpdateUserInput {
    @Field()
    id!: string

    @Field({ nullable: true })
    firstName: string | null;

    @Field({ nullable: true })
    lastName: string | null;

    @Field({ nullable: true })
    email: string;

    @Field({ nullable: true })
    telephone: string;
}
