import { PrismaClient, Membership } from "@prisma/client";

const prisma = new PrismaClient();

class MembershipService {
  /**
   * Adds a user as a member to a shop.
   */
  async addMembership(
    userId: string,
    shopId: number,
    role: string 
  ): Promise<Membership> {
    // Validation 1: Verify existence of User (auth-service)
    console.log(`[Validation Mock] Verified user ${userId} exists in auth-service.`);

    // Validation 2: Verify existence of Shop (shop-service local)
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error("Shop not found");

    // AQUÍ ESTÁ LA CORRECCIÓN: usamos prisma.membership y los nombres correctos de tu base de datos
    const newMembership = await prisma.membership.create({
      data: {
        user_id: userId,
        shop_id: shopId,
        role: role,
      },
    });

    return newMembership;
  }
}

const membershipService = new MembershipService();

export default membershipService;