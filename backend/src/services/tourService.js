const success = (data = {}) => ({ ok: true, data });

const failure = (code, message) => ({
  ok: false,
  error: { code, message },
});

const toPublicTour = (tour) => ({
  id: tour.id,
  title: tour.title,
  description: tour.description,
  destination: tour.destination,
  price: Number(tour.price),
  durationDays: tour.durationDays,
  itinerary: tour.itinerary,
  included: tour.included,
  images: (tour.images || []).map((image) => image.url),
  createdAt: tour.createdAt,
  updatedAt: tour.updatedAt,
});

const buildTourUpdateData = (changes = {}) => {
  const { images, ...scalarFields } = changes;
  const updateData = { ...scalarFields };

  if (images !== undefined) {
    updateData.images = {
      deleteMany: {},
      ...(images.length > 0
        ? {
            create: images.map((url) => ({ url })),
          }
        : {}),
    };
  }

  return updateData;
};

export const createTourService = ({ prisma }) => ({
  async listTours() {
    const tours = await prisma.tour.findMany({
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return success({ tours: tours.map(toPublicTour) });
  },

  async getTourById({ id }) {
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!tour) {
      return failure("TOUR_NOT_FOUND", "Tour not found");
    }

    return success({ tour: toPublicTour(tour) });
  },

  async createTour(input) {
    const { images, ...tourData } = input;

    const tour = await prisma.tour.create({
      data: {
        ...tourData,
        ...(images && images.length > 0
          ? {
              images: {
                create: images.map((url) => ({ url })),
              },
            }
          : {}),
      },
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return success({ tour: toPublicTour(tour) });
  },

  async updateTour({ id, changes }) {
    const existingTour = await prisma.tour.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTour) {
      return failure("TOUR_NOT_FOUND", "Tour not found");
    }

    const updatedTour = await prisma.tour.update({
      where: { id },
      data: buildTourUpdateData(changes),
      include: {
        images: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return success({ tour: toPublicTour(updatedTour) });
  },

  async deleteTour({ id }) {
    const existingTour = await prisma.tour.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingTour) {
      return failure("TOUR_NOT_FOUND", "Tour not found");
    }

    try {
      await prisma.tour.delete({ where: { id } });
      return success();
    } catch (error) {
      if (error?.code === "P2003") {
        return failure(
          "TOUR_HAS_DEPENDENCIES",
          "Tour cannot be deleted because it has related bookings or reviews"
        );
      }

      throw error;
    }
  },
});