import { Field, InputType } from 'type-graphql'

@InputType()
export class DeleteUserInput {

    @Field()
    email!: string;

}
