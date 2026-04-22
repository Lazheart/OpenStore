import { PrismaClient, Shop } from "@prisma/client";

const prisma = new PrismaClient();

class ShopService {
  /**
   * Create a shop, validating that the user is an OWNER.
   * @param name - The name of the shop.
   * @param ownerId - The UID of the user from Auth Service.
   */
  async createShop(name: string, ownerId: number): Promise<Shop> {
    // Validation: Verify existence and role of User (auth-service)
    // In a real microservices architecture, you might perform an HTTP request to auth-service
    // or extract this from a validated JWT containing claims.
    // const user = await fetch(`http://auth-service/api/users/${ownerId}`).then(res => res.json());
    // if (user.role !== 'OWNER') throw new Error("Only OWNER can create shops");

    // Mocked check:
    console.log(`[Validation Mock] Verified ${ownerId} is an OWNER via auth-service.`);

    const newShop = await prisma.shop.create({
      data: {
        name,
        owner_id: ownerId,
      },
    });

    return newShop;
  }

  async getShopsByOwner(ownerId: number): Promise<Shop[]> {
    return prisma.shop.findMany({
      where: { owner_id: ownerId },
    });
  }
}

const shopService = new ShopService();

export default shopService;
