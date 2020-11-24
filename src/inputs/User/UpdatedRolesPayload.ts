import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class UpdatedRolesPayload {
    @Field(type => [String])
    added: string[]

    @Field(type => [String])
    removed: string[]

    @Field(type => [String])
    current: string[]
}
