import { swaggerDocs } from './swagger';
import express, { Request, Response } from 'express';
const { PrismaClient } = require('@prisma/client');
import dotenv from 'dotenv';
import { authenticateToken, AuthRequest } from './middleware/auth';
import membershipService from './services/membershipService';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.SHOP_SERVICE_PORT;
const STORE_SERVICE_URL = process.env.STORE_SERVICE_URL;
const EVENTS_INTERNAL_TOKEN = process.env.EVENTS_INTERNAL_TOKEN;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Internal-Token');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

type MePayload = {
  id: number | string;
  role: 'OWNER' | 'ADMIN' | 'USER' | string;
  subscriptions?: 'FREE' | 'PRO' | 'MAX' | string;
  subscriptionPlan?: 'FREE' | 'PRO' | 'MAX' | string;
  phoneNumber?: string;
};

const PLAN_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: 5,
  MAX: Number.POSITIVE_INFINITY,
};

const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  return token || null;
};

const buildMeUrl = (): string => {
  if (!STORE_SERVICE_URL) {
    throw new Error('STORE_SERVICE_URL no esta definido en las variables de entorno');
  }
  return `${STORE_SERVICE_URL}/me`;
}

const getCurrentUserFromMe = async (token: string): Promise<MePayload> => {
  const response = await fetch(buildMeUrl(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener la informacion del usuario desde /me');
  }

  const user = (await response.json()) as MePayload;
  if (!user.id) {
    throw new Error('El payload de /me no incluye id de usuario');
  }

  return user;
};

const toShopResponse = (shop: { id: string; owner_id: string; name: string; phone_number: string }) => ({
  shopId: shop.id,
  ownerId: shop.owner_id,
  shopName: shop.name,
  phoneNumber: shop.phone_number,
});

const getPlanLimit = (plan: string): number | null => {
  const normalized = plan.toUpperCase();
  return PLAN_LIMITS[normalized] ?? null;
};

const hasValidInternalToken = (token: string | undefined): boolean => {
  if (!EVENTS_INTERNAL_TOKEN) {
    return false;
  }

  return token === EVENTS_INTERNAL_TOKEN;
};

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'shop-service' });
});

app.get('/healthcheck', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'shop-service' });
});

app.get('/shops', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [shops, total] = await Promise.all([
      prisma.shop.findMany({
        skip,
        take: limit,
      }),
      prisma.shop.count(),
    ]);

    res.json({
      data: shops.map(toShopResponse),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tiendas' });
  }
});

app.get('/shops/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: id },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    res.json(toShopResponse(shop));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la tienda' });
  }
});

app.get('/owners/:ownerId/shops', async (req: Request, res: Response) => {
  const internalToken = req.headers['x-internal-token'];
  const tokenValue = Array.isArray(internalToken) ? internalToken[0] : internalToken;

  if (!hasValidInternalToken(tokenValue)) {
    return res.status(403).json({ error: 'Token interno invalido' });
  }

  const ownerId = String(req.params.ownerId);
  if (!ownerId) {
    return res.status(400).json({ error: 'ownerId invalido' });
  }

  try {
    const shops = await prisma.shop.findMany({ where: { owner_id: ownerId } });
    return res.json({
      ownerId,
      shops: shops.map(toShopResponse),
    });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudieron obtener tiendas del owner' });
  }
});

app.post('/openshop/shop', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { shopName, phoneNumber } = req.body ?? {};

  if (!shopName || typeof shopName !== 'string' || !shopName.trim()) {
    return res.status(400).json({ error: 'shopName es obligatorio' });
  }

  if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
    return res.status(400).json({ error: 'phoneNumber es obligatorio' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const user = await getCurrentUserFromMe(token);
    const ownerId = String(user.id);

    if (!ownerId) {
      return res.status(400).json({ error: 'id de usuario invalido en /me' });
    }

    if (String(user.role).toUpperCase() !== 'OWNER') {
      return res.status(403).json({ error: 'Unete a Openshop para registrar una tienda' });
    }

    const plan = String(user.subscriptions ?? user.subscriptionPlan ?? 'FREE').toUpperCase();
    const maxAllowedShops = getPlanLimit(plan);

    if (maxAllowedShops === null) {
      return res.status(400).json({ error: 'Plan de suscripcion invalido' });
    }

    const existingByName = await prisma.shop.findFirst({
      where: { name: shopName.trim() },
    });

    if (existingByName) {
      return res.status(409).json({ error: 'Este nombre ya esta en uso' });
    }

    const ownerShopsCount = await prisma.shop.count({
      where: { owner_id: ownerId },
    });

    if (ownerShopsCount >= maxAllowedShops) {
      return res.status(403).json({
        error: `Has alcanzado el limite de tiendas para el plan ${plan}`,
      });
    }

    const newShop = await prisma.shop.create({
      data: {
        name: shopName.trim(),
        owner_id: ownerId,
        phone_number: phoneNumber.trim(),
      },
    });

    return res.status(201).json(toShopResponse(newShop));
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error al crear la tienda' });
  }
});

app.get('/shop/name/:shopName', async (req: Request, res: Response) => {
  const shopName = String(req.params.shopName ?? '');

  try {
    const shop = await prisma.shop.findFirst({
      where: { name: shopName },
    });

    if (!shop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    return res.json({
      shopName: shop.name,
      shopId: shop.id,
      phoneNumber: shop.phone_number,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener la tienda por nombre' });
  }
});

app.patch('/shop/id/:shopId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const shopId = String(req.params.shopId);
  const { shopName, phoneNumber } = req.body ?? {};

  if (!shopId) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  if (!shopName && !phoneNumber) {
    return res.status(400).json({ error: 'Debes enviar shopName, phoneNumber o ambos' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const user = await getCurrentUserFromMe(token);
    const requesterId = String(user.id);

    if (!requesterId) {
      return res.status(400).json({ error: 'id de usuario invalido en /me' });
    }

    const existingShop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!existingShop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    if (existingShop.owner_id !== requesterId) {
      return res.status(403).json({ error: 'No puedes modificar una tienda que no te pertenece' });
    }

    if (shopName && typeof shopName === 'string') {
      const duplicatedName = await prisma.shop.findFirst({
        where: {
          name: shopName.trim(),
          NOT: { id: shopId },
        },
      });

      if (duplicatedName) {
        return res.status(409).json({ error: 'Este nombre ya esta en uso' });
      }
    }

    const data: { name?: string; phone_number?: string } = {};
    if (shopName && typeof shopName === 'string') data.name = shopName.trim();
    if (phoneNumber && typeof phoneNumber === 'string') data.phone_number = phoneNumber.trim();

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data,
    });

    return res.json(toShopResponse(updatedShop));
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo actualizar la tienda' });
  }
});

app.delete('/shop/id/:shopId', authenticateToken, async (req: AuthRequest, res: Response) => {
  const shopId = String(req.params.shopId);

  if (!shopId) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const user = await getCurrentUserFromMe(token);
    const requesterId = String(user.id);

    if (!requesterId) {
      return res.status(400).json({ error: 'id de usuario invalido en /me' });
    }

    const existingShop = await prisma.shop.findUnique({
      where: { id: Number(shopId) },
    });

    if (!existingShop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    if (existingShop.owner_id !== requesterId) {
      return res.status(403).json({ error: 'No puedes eliminar una tienda que no te pertenece' });
    }

    await prisma.shop.delete({
      where: { id: shopId },
    });

    return res.json({ shopId });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar la tienda' });
  }
});

app.delete('/internal/shops/:shopId', async (req: Request, res: Response) => {
  const internalToken = req.headers['x-internal-token'];
  const tokenValue = Array.isArray(internalToken) ? internalToken[0] : internalToken;

  if (!hasValidInternalToken(tokenValue)) {
    return res.status(403).json({ error: 'Token interno invalido' });
  }

  const shopId = String(req.params.shopId);
  if (!shopId) {
    return res.status(400).json({ error: 'shopId invalido' });
  }

  try {
    const existingShop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!existingShop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    await prisma.shop.delete({ where: { id: shopId } });
    return res.json({ shopId });
  } catch (error) {
    return res.status(500).json({ error: 'No se pudo eliminar la tienda' });
  }
});

swaggerDocs(app, Number(PORT));
app.post('/shops/:id/memberships', authenticateToken, async (req: AuthRequest, res: Response) => {
  const shopId = String(req.params.id);
  const { userId, role } = req.body;

  if (!req.body || !userId || !role) {
    return res.status(400).json({ error: 'Faltan datos obligatorios: userId y role' });
  }

  try {
    const newMembership = await membershipService.addMembership(
      String(userId), 
      shopId, 
      role
    );
    res.status(201).json(newMembership);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ error: error.message || 'Error al agregar miembro a la tienda' });
  }
});

app.listen(PORT, () => {
  console.log(` Shop Service corriendo en http://localhost:${PORT}`);
});

