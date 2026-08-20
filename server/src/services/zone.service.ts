import { prisma } from '../db/prisma';
import { AppError } from '../middlewares/errorHandler.middleware';

export interface CreateZoneInput {
  code: string;
  name: string;
  description?: string;
  city: string;
  state: string;
  centerLat: number;
  centerLng: number;
  radiusKm?: number;
}

export interface AddAreaInput {
  zoneId: string;
  areaName: string;
  pincode: string;
  city: string;
  lat?: number;
  lng?: number;
}

export class ZoneService {
  public static async getAllZones() {
    return prisma.zone.findMany({
      include: {
        areas: true,
        _count: {
          select: {
            pickupOrders: true,
            dropOrders: true,
            agents: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  public static async getZoneById(id: string) {
    const zone = await prisma.zone.findUnique({
      where: { id },
      include: {
        areas: true,
        agents: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
      },
    });

    if (!zone) {
      throw new AppError('Zone not found', 404);
    }

    return zone;
  }

  public static async createZone(data: CreateZoneInput) {
    const existing = await prisma.zone.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      throw new AppError(`Zone code ${data.code} already exists`, 400);
    }

    return prisma.zone.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        city: data.city,
        state: data.state,
        centerLat: data.centerLat,
        centerLng: data.centerLng,
        radiusKm: data.radiusKm || 15.0,
      },
    });
  }

  public static async updateZone(id: string, data: Partial<CreateZoneInput & { isActive: boolean }>) {
    return prisma.zone.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.centerLat !== undefined && { centerLat: data.centerLat }),
        ...(data.centerLng !== undefined && { centerLng: data.centerLng }),
        ...(data.radiusKm !== undefined && { radiusKm: data.radiusKm }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  public static async addAreaToZone(data: AddAreaInput) {
    return prisma.zoneArea.create({
      data: {
        zoneId: data.zoneId,
        areaName: data.areaName,
        pincode: data.pincode.trim(),
        city: data.city,
        lat: data.lat,
        lng: data.lng,
      },
    });
  }

  public static async removeArea(areaId: string) {
    return prisma.zoneArea.delete({
      where: { id: areaId },
    });
  }

  public static async lookupPincode(pincode: string) {
    const area = await prisma.zoneArea.findFirst({
      where: { pincode: pincode.trim() },
      include: { zone: true },
    });

    return area;
  }
}
