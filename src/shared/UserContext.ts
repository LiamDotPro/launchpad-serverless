import { Request, Response } from "@nestjs/common";

export interface MyContext {
  req: Request;
  res: Response;
  userId: string
  payload?: { userId: string };
}
