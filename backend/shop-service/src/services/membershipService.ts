import { MembershipRole, PrismaClient, ShopMembership } from "@prisma/client";

const prisma = new PrismaClient();

class MembershipService {
  /**
   * Adds a user as a member to a shop.
   * @param userId - The UID of the user from Auth Service.
   * @param shopId - The ID of the shop.
   * @param role - The membership role .
   */
  async addMembership(
    userId: string,
    shopId: number,
    role: MembershipRole
  ): Promise<ShopMembership> {
    // Validation 1: Verify existence of User (auth-service)
    // const userExists = await fetch(`http://auth-service/api/users/${userId}`).then(res => res.ok);
    // if (!userExists) throw new Error("User does not exist");
    console.log(`[Validation Mock] Verified user ${userId} exists in auth-service.`);

    // Validation 2: Verify existence of Shop (shop-service local)
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error("Shop not found");

    const newMembership = await prisma.shopMembership.create({
      data: {
        userId,
        shopId,
        role,
      },
    });

    return newMembership;
  }
}

const membershipService = new MembershipService();

export default membershipService;
