import { Field, InputType } from "type-graphql";

@InputType()
export class FindOtherUsersRoles {
    @Field()
    userId: string
}
