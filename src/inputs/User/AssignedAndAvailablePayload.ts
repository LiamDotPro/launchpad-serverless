import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class AssignedAndAvailablePayload {
    @Field(type => [String])
    available: string[]

    @Field(type => [String])
    assigned: string[]
}
