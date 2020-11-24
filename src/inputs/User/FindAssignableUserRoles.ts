import { Field, InputType } from "type-graphql";

@InputType()
export class FindAssignableUserRoles {
    @Field()
    userToUpdateId: string
}
