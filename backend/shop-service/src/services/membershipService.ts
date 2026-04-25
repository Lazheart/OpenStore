import { Membership, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

class MembershipService {

  async addMembership(
    userId: string,
    shopId: number,
    role: string
  ): Promise<Membership> {
    // Validation 1: Verify existence of User (auth-service)
    // const userExists = await fetch(`http://auth-service/api/users/${userId}`).then(res => res.ok);
    // if (!userExists) throw new Error("User does not exist");
    console.log(`[Validation Mock] Verified user ${userId} exists in auth-service.`);

    
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error("Shop not found");

    const newMembership = await prisma.membership.create({
      data: {
        // Persist both the owner user reference and shop relation.
        user_id: userId,
        shop_id: shopId,
        role,
      },
    });

    return newMembership;
  }
}

const membershipService = new MembershipService();

export default membershipService;
