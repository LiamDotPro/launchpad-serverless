import { Field, InputType } from "type-graphql";

@InputType()
export class UpdateRolesInput {
    @Field(type => [String])
    desiredRoles: [string];

    @Field()
    userToUpdateId: string
}
