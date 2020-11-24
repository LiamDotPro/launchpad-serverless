import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { User } from "../models/User";
import { comparePasswords, hashPassword } from "../shared/hashes";
import { Auth, CurrentUser, Jwt } from "../shared/middleware";
import { sign } from "jsonwebtoken";
import { CreateUserInput } from "../inputs/User/CreateUserInput";
import { applyNewPoliciesForUser, getRolesForUser, validateRoleArray } from "../shared/policies";
import { string } from "yup";
import { CreateUserPayload } from "../inputs/User/CreateUserPayload";
import { PolicyRoles } from "../shared/enums";
import { LoginPayload } from "../inputs/User/LoginPayload";


@Resolver()
export class UserResolver {

  @Mutation(() => LoginPayload)
  async login(@Args("data") data: CreateUserInput): Promise<LoginPayload | Error> {
    const foundUserByEmail = await User.findOne({ where: { email: data.email } });

    const defaultErrorMessage = "A user with that email or password was not found..";

    if (!foundUserByEmail) {
      return new Error(defaultErrorMessage);
    }

    if (!comparePasswords(data.password, foundUserByEmail.password)) {
      return new Error(defaultErrorMessage);
    }

    return {
      accessToken: sign({ userId: foundUserByEmail.id }, `A-rtmU5Lg8.S_>pr`, {
        expiresIn: "15m"
      })
    };

  }

  // @Query(() => [User])
  // @UseMiddleware(isLoggedIn)
  // users(): Promise<User[]> | Error {
  //   try {
  //     return User.find();
  //   } catch (e) {
  //     return Error("Something went wrong while trying to get a list of users")
  //   }
  // }
  //
  // @Query(() => User)
  // @Authorized([PolicyRoles.SUPERADMIN])
  // @UseMiddleware(isLoggedIn)
  // user(@Arg("id") id: string): Promise<User> | Error {
  //   try {
  //     return User.findOne({ where: { id } });
  //   } catch (e) {
  //     return Error("Something went wrong while trying to get the user")
  //   }
  // }
  //

  @Mutation(() => CreateUserPayload)
  @Auth(PolicyRoles.ADMIN)
  async createUser(@Args("data") data: CreateUserInput, @CurrentUser() currentUser: Jwt): Promise<CreateUserPayload | Error> {

    if (!await string().email().isValid(data.email)) {
      return Error("A valid email was not supplied");
    }

    if (data.password.length < 8) {
      return Error("A password of less than 8 was supplied");
    }

    const userCheck = await User.find({ where: { email: data.email } });

    if (userCheck.length > 0) {
      return Error("A user with this email address already exists");
    }

    try {
      if (data.roles) await validateRoleArray(data.roles);
    } catch (e) {
      return e;
    }

    const hash = await hashPassword(data.password);
    const user = User.create({ email: data.email, password: hash });
    await user.save();

    // if no role is added in request just add user.
    const rolesToBeApplied = data.roles ? data.roles.map(el => el.toUpperCase()) : [PolicyRoles.USER];

    // apply policies in addition mode.
    const appliedRoles = await applyNewPoliciesForUser(user.id, currentUser.userId, rolesToBeApplied, false);

    return { roles: appliedRoles, userId: user.id };
  }

  //
  // @Mutation(() => User || Error)
  // @Authorized([PolicyRoles.SUPERADMIN])
  // @UseMiddleware(isLoggedIn)
  // async updateUser(@Arg("data") data: UpdateUserInput): Promise<User | Error> {
  //
  //   const foundUserById = await User.findOne({
  //     where: {
  //       id: data.id
  //     }
  //   })
  //
  //   if (!foundUserById) {
  //     return Error("A user with that id was not found..")
  //   }
  //
  //   if (data.firstName) {
  //     foundUserById.firstName = data.firstName
  //   }
  //
  //   if (data.lastName) {
  //     foundUserById.lastName = data.lastName
  //   }
  //
  //   if (data.email) {
  //     foundUserById.email = data.email
  //
  //   }
  //
  //   if (data.telephone) {
  //     foundUserById.telephone = data.telephone
  //   }
  //
  //   if (data.firstName) {
  //     foundUserById.firstName = data.firstName
  //   }
  //
  //   try {
  //     await foundUserById.save()
  //   } catch (e) {
  //     return Error("Something went wrong while trying to update the users information")
  //   }
  //
  //   return foundUserById
  //
  // }
  //
  // @Mutation(() => String)
  // @Authorized([PolicyRoles.SUPERADMIN])
  // @UseMiddleware(isLoggedIn)
  // async deleteUser(@Arg("data") data: DeleteUserInput): Promise<string | Error> {
  //   const foundUserByEmail = await User.findOne({ where: { email: data.email } })
  //
  //   if (!foundUserByEmail) {
  //     return Error("Something went wrong while trying to delete that user..")
  //   }
  //
  //   await foundUserByEmail.remove()
  //
  //   return `${ foundUserByEmail.email } has been successfully deleted!`
  // }
  //
  // @Mutation(() => String || Error)
  // async login(@Arg("data") data: LoginUserInput, @Ctx() ctx: MyContext): Promise<string | Error> {
  //
  //   // Check to see that the user session already exists
  //   if (ctx.req.session.isLoggedIn) {
  //     return "You are already logged in"
  //   }
  //
  //   const foundUserByEmail = await User.findOne({ where: { email: data.email } })
  //
  //   const defaultErrorMessage = "A user with that email or password was not found"
  //
  //   if (!foundUserByEmail) {
  //     return new Error(defaultErrorMessage)
  //   }
  //
  //   if (!comparePasswords(data.password, foundUserByEmail.password)) {
  //     return new Error(defaultErrorMessage)
  //   }
  //
  //   // Set loggedIn for credentials
  //   ctx.req.session.isLoggedIn = true
  //
  //   // Set users ID into the session
  //   ctx.req.session.userId = foundUserByEmail.id
  //
  //   return "Successful login"
  // }
  //
  // @Mutation(() => String || Error)
  // @UseMiddleware(isLoggedIn)
  // async logout(@Ctx() ctx: MyContext): Promise<string | Error> {
  //
  //   // Set session to logged out without whipping the session
  //   ctx.req.session.isLoggedIn = false
  //
  //   return "You have successfully logged out"
  // }
  //
  @Query(() => [String])
  @Auth(PolicyRoles.USER)
  async roles(@CurrentUser() user: Jwt): Promise<string[] | Error> {
    try {
      return await getRolesForUser(user.userId);
    } catch (e) {
      return new Error("Something went wrong");
    }
  }

  //
  // @Query(() => [String])
  // @UseMiddleware(isLoggedIn)
  // @Authorized([PolicyRoles.SUPERADMIN])
  // async UsersRoles(@Arg("data") data: FindOtherUsersRoles): Promise<string[] | Error> {
  //   try {
  //     return await getRolesForUser(data.userId)
  //   } catch (e) {
  //     return new Error("Something went wrong")
  //   }
  // }
  //
  // @Query(() => AssignedAndAvailablePayload)
  // @UseMiddleware(isLoggedIn)
  // async getAssignedAndAvailableRoles(@Arg("data") data: FindAssignableUserRoles, @Ctx() ctx: MyContext): Promise<AssignedAndAvailablePayload | Error> {
  //   try {
  //     const values = await findAvailableAndAssignableRoles(ctx.req.session.userId, data.userToUpdateId)
  //     return { assigned: values.assigned, available: values.available } as AssignedAndAvailablePayload
  //   } catch (e) {
  //     return Error("Something went wrong while trying to get a list or roles..")
  //   }
  // }
  //
  // @Mutation(() => UpdatedRolesPayload)
  // @UseMiddleware(isLoggedIn)
  // @Authorized([PolicyRoles.ADMIN])
  // async updateRoles(@Ctx() ctx: MyContext, @Arg("data") data: UpdateRolesInput): Promise<UpdatedRolesPayload | Error> {
  //   try {
  //     if (data.desiredRoles) await validateRoleArray(data.desiredRoles)
  //   } catch (e) {
  //     return e
  //   }
  //
  //   try {
  //     const values = await AddAndRemovePoliciesForUser(data.userToUpdateId, ctx.req.session.userId, data.desiredRoles)
  //     return { added: values.added, removed: values.removed, current: values.current } as UpdatedRolesPayload
  //   } catch (e) {
  //     return new Error("Something went while trying to update the users roles..")
  //   }
  // }

}