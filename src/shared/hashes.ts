import { hash, compareSync } from "bcryptjs";

export const hashPassword = async (password: string): Promise<string> => {
  return await hash(password, 10);
};

export const comparePasswords = (password: string, hash: string): boolean => {
  return compareSync(password, hash);
};
