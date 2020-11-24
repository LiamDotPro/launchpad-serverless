import { verify } from "jsonwebtoken";
import { getRolesForUser } from "./policies";
import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards
} from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { PolicyRoles } from "./enums";
import { Reflector } from "@nestjs/core";

export interface Jwt {
 userId: string
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>("roles", context.getHandler());

    if (!roles) {
      return false;
    }

    const ctx = GqlExecutionContext.create(context);
    const bearer = ctx.getContext().req.headers.authorization;

    const token = bearer.split(" ")[1];
    const payload = verify(token, `A-rtmU5Lg8.S_>pr`);

    const foundRoles = await getRolesForUser(payload.userId);

    return !!(foundRoles.filter(value => roles.includes(value)).length);
  }
}

export const CurrentUser = createParamDecorator((data, req) => {
  const gctx = GqlExecutionContext.create(req);
  const bearer = gctx.getContext().req.headers.authorization;

  const token = bearer.split(" ")[1];
  return verify(token, `A-rtmU5Lg8.S_>pr`);
});

export function Auth(...roles: PolicyRoles[]) {
  return applyDecorators(
    SetMetadata("roles", roles),
    UseGuards(RolesGuard)
  );
}
