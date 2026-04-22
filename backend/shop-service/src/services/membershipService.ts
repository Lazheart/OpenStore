import { PrismaClient, Membership } from "@prisma/client";

const prisma = new PrismaClient();

class MembershipService {

  async addMembership(
    userId: string,
    shopId: number,
    role: string 
  ): Promise<Membership> {
    
    console.log(`[Validation Mock] Verified user ${userId} exists in auth-service.`);

    
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error("Shop not found");

    
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
