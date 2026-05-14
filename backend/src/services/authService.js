import { v7 as uuidv7 } from "uuid";

const success = (data = {}) => ({ ok: true, data });

const failure = (code, message) => ({
  ok: false,
  error: { code, message },
});

const toPublicUser = (user) => ({
  id: user.id,
  publicId: user.publicId || null,
  name: user.name,
  email: user.email,
  phone: user.phone || null,
  nationality: user.nationality,
  role: user.role,
});

export const createAuthService = ({ prisma, authUtils }) => ({
  async register({ name, email, password, nationality, phone }) {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return failure("USER_EXISTS", "User already exists");
    }

    const passwordHash = await authUtils.hashPassword(password);
    
    let user;
    try {
      user = await prisma.user.create({
        data: {
          publicId: uuidv7(),
          name,
          email: normalizedEmail,
          password: passwordHash,
          nationality,
          phone,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return failure("USER_EXISTS", "User already exists");
      }
      throw error;
    }

    const token = authUtils.signToken({ sub: user.id, email: user.email });
    return success({ token, user: toPublicUser(user) });
  },

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return failure("INVALID_CREDENTIALS", "Invalid credentials");
    }

    const isPasswordValid = await authUtils.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return failure("INVALID_CREDENTIALS", "Invalid credentials");
    }

    const token = authUtils.signToken({ sub: user.id, email: user.email });
    return success({ token, user: toPublicUser(user) });
  },

  async getProfile({ token }) {
    let payload;
    try {
      payload = authUtils.verifyToken(token);
    } catch {
      return failure("INVALID_TOKEN", "Invalid or expired token");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return failure("USER_NOT_FOUND", "User not found");
    }

    return success({ user: toPublicUser(user) });
  },

  async logout({ token }) {
    try {
      authUtils.verifyToken(token);
      authUtils.invalidateToken(token);
    } catch {
      return failure("INVALID_TOKEN", "Invalid or expired token");
    }

    return success();
  },
});