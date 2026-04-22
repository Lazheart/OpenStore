import { swaggerDocs } from './swagger';
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { authenticateToken, AuthRequest } from './middleware/auth';
import membershipService from './services/membershipService';
//import membershipService from './membershipService';
// Variables de entorno
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.SHOP_SERVICE_PORT || 3001;

app.use(express.json());

// --- ENDPOINTS ---

// 1. Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'shop-service' });
});

// 2. LISTAR TIENDAS (Paginado)
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
      data: shops,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tiendas' });
  }
});

// 3. OBTENER UNA TIENDA POR ID
app.get('/shops/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: Number(id) },
      include: { memberships: true }, 
    });

    if (!shop) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la tienda' });
  }
});

// 4. CREAR UNA TIENDA
app.post('/shops', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.body) {
    return res.status(400).json({ error: 'El cuerpo de la petición está vacío' });
  }
  const { name } = req.body;
  const owner_id = req.user?.id || req.user?.sub; 

  if (!name) return res.status(400).json({ error: 'Falta el campo obligatorio (name)' });
  if (!owner_id) return res.status(400).json({ error: 'Token sin ID válido' });

  try {
    const newShop = await prisma.shop.create({
      data: { name, owner_id: Number(owner_id) }, 
    });
    res.status(201).json(newShop);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la tienda' });
  }
});

// 5. ACTUALIZAR UNA TIENDA
app.put('/shops/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, owner_id } = req.body;

  try {
    const updatedShop = await prisma.shop.update({
      where: { id: Number(id) },
      data: { name, owner_id },
    });
    res.json(updatedShop);
  } catch (error) {
    res.status(404).json({ error: 'Tienda no encontrada o error en datos' });
  }
});

// 6. BORRAR UNA TIENDA
app.delete('/shops/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.shop.delete({
      where: { id: Number(id) },
    });
    res.status(204).send(); 
  } catch (error) {
    res.status(404).json({ error: 'No se pudo eliminar la tienda' });
  }
});



swaggerDocs(app, Number(PORT));
app.post('/shops/:id/memberships', authenticateToken, async (req: AuthRequest, res: Response) => {
  const shopId = req.params.id;
  const { userId, role } = req.body;

  // Verificamos envio de datos 
  if (!req.body || !userId || !role) {
    return res.status(400).json({ error: 'Faltan datos obligatorios: userId y role' });
  }

  try {
    // Usamos archivos de mebresia ya creados 
    const newMembership = await membershipService.addMembership(
      String(userId), 
      Number(shopId), 
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

