const success = (data = {}) => ({ ok: true, data });

const failure = (code, message) => ({
  ok: false,
  error: { code, message },
});

const toPublicBooking = (booking) => ({
  id: booking.id,
  tourId: booking.tourId,
  contactEmail: booking.contactEmail,
  passportNumber: booking.passportNumber,
  status: booking.status,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt,
  tour: booking.tour ? {
    id: booking.tour.id,
    title: booking.tour.title,
    price: Number(booking.tour.price),
  } : undefined,
  user: booking.user ? {
    id: booking.user.id,
    name: booking.user.name,
    email: booking.user.email,
  } : undefined,
});

export const createBookingService = ({ prisma }) => ({
  async listMyBookings({ userId }) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        tour: { select: { id: true, title: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return success({ bookings: bookings.map(toPublicBooking) });
  },

  async listAllBookings() {
    const bookings = await prisma.booking.findMany({
      include: {
        tour: { select: { id: true, title: true, price: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return success({ bookings: bookings.map(toPublicBooking) });
  },

  async getBookingById({ id, userId, role }) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        tour: { select: { id: true, title: true, price: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) {
      return failure("BOOKING_NOT_FOUND", "Booking not found");
    }

    if (role !== "ADMIN" && booking.userId !== userId) {
      return failure("FORBIDDEN", "You do not have permission to view this booking");
    }

    return success({ booking: toPublicBooking(booking) });
  },

  async createBooking({ userId, input }) {
    const { tourId, contactEmail, passportNumber } = input;

    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) {
      return failure("TOUR_NOT_FOUND", "Tour not found");
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        tourId,
        contactEmail,
        passportNumber,
        status: "PENDING",
      },
      include: {
        tour: { select: { id: true, title: true, price: true } },
      },
    });

    return success({ booking: toPublicBooking(booking) });
  },

  async updateBookingStatus({ id, status }) {
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingBooking) {
      return failure("BOOKING_NOT_FOUND", "Booking not found");
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        tour: { select: { id: true, title: true, price: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return success({ booking: toPublicBooking(updatedBooking) });
  },
});
