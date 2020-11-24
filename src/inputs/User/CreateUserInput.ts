import { Field, InputType } from "@nestjs/graphql";
import { PolicyRoles } from '../../shared/enums'

@InputType()
export class CreateUserInput {
    @Field()
    email: string;

    @Field()
    password: string;

    @Field(type => [String], { nullable: true })
    roles: [PolicyRoles]
}
