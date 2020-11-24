import { Field, ObjectType } from '@nestjs/graphql'
import { PolicyRoles } from '../../shared/enums'

@ObjectType()
export class CreateUserPayload {
    @Field()
    userId: string

    @Field(type => [String])
    roles: PolicyRoles[] | string[]
}
