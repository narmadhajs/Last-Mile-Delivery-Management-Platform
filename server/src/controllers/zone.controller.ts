import { Request, Response, NextFunction } from 'express';
import { ZoneService } from '../services/zone.service';

export class ZoneController {
  public static async getAllZones(req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await ZoneService.getAllZones();
      res.json({ success: true, data: zones });
    } catch (err) {
      next(err);
    }
  }

  public static async getZoneById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const zone = await ZoneService.getZoneById(id);
      res.json({ success: true, data: zone });
    } catch (err) {
      next(err);
    }
  }

  public static async createZone(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, name, description, city, state, centerLat, centerLng, radiusKm } = req.body;
      const zone = await ZoneService.createZone({
        code,
        name,
        description,
        city,
        state,
        centerLat: parseFloat(centerLat as string),
        centerLng: parseFloat(centerLng as string),
        radiusKm: radiusKm ? parseFloat(radiusKm as string) : 15.0,
      });

      res.status(201).json({ success: true, data: zone });
    } catch (err) {
      next(err);
    }
  }

  public static async updateZone(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const zone = await ZoneService.updateZone(id, {
        ...data,
        centerLat: data.centerLat !== undefined ? parseFloat(data.centerLat as string) : undefined,
        centerLng: data.centerLng !== undefined ? parseFloat(data.centerLng as string) : undefined,
        radiusKm: data.radiusKm !== undefined ? parseFloat(data.radiusKm as string) : undefined,
      });

      res.json({ success: true, data: zone });
    } catch (err) {
      next(err);
    }
  }

  public static async addArea(req: Request, res: Response, next: NextFunction) {
    try {
      const zoneId = req.params.zoneId as string;
      const { areaName, pincode, city, lat, lng } = req.body;
      const area = await ZoneService.addAreaToZone({
        zoneId,
        areaName,
        pincode,
        city,
        lat: lat ? parseFloat(lat as string) : undefined,
        lng: lng ? parseFloat(lng as string) : undefined,
      });

      res.status(201).json({ success: true, data: area });
    } catch (err) {
      next(err);
    }
  }

  public static async removeArea(req: Request, res: Response, next: NextFunction) {
    try {
      const areaId = req.params.areaId as string;
      await ZoneService.removeArea(areaId);
      res.json({ success: true, message: 'Area removed from zone' });
    } catch (err) {
      next(err);
    }
  }

  public static async lookupPincode(req: Request, res: Response, next: NextFunction) {
    try {
      const pincode = req.params.pincode as string;
      const area = await ZoneService.lookupPincode(pincode);
      res.json({ success: true, data: area });
    } catch (err) {
      next(err);
    }
  }
}
