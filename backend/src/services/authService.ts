import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import type { Role } from "../generated/prisma/client.js";

type SignupInput = { name: string; email: string; password: string; role: "DONOR" | "RECIPIENT"; orgName?: string; phone?: string };

export class AuthService {
  async signup(input: SignupInput) {
    if (input.password.length < 6) throw new HttpError(400, "Password must be at least 6 characters");
    const passwordHash = await bcrypt.hash(input.password, 12);
    const { password: _password, ...profile } = input;
    const user = await prisma.user.create({ data: { ...profile, passwordHash } });
    return this.publicUser(user);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new HttpError(401, "Invalid email or password");
    const token = jwt.sign({ role: user.role, email: user.email }, env.jwtSecret, { subject: String(user.id), expiresIn: "1d" });
    return { token, user: this.publicUser(user) };
  }

  async me(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpError(404, "User not found");
    return this.publicUser(user);
  }

  private publicUser(user: { id: number; name: string; email: string; role: Role; orgName: string | null; phone: string | null; createdAt: Date }) {
    return { id: user.id, name: user.name, email: user.email, role: user.role, orgName: user.orgName, phone: user.phone, createdAt: user.createdAt };
  }
}
