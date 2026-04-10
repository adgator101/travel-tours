const success = (data = {}) => ({ ok: true, data });

const failure = (code, message) => ({
  ok: false,
  error: { code, message },
});

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  nationality: user.nationality,
  role: user.role,
});

export const createAuthService = ({ prisma, authUtils }) => ({
  async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return failure("USER_EXISTS", "User already exists");
    }

    const passwordHash = authUtils.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: passwordHash,
      },
    });

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

    const isPasswordValid = authUtils.verifyPassword(password, user.password);

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
    } catch {
      return failure("INVALID_TOKEN", "Invalid or expired token");
    }

    return success();
  },
});