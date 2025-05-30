import { Request, Response } from "express";
import { db } from "../db/drizzle";
import {
  livestockTable,
  farmsTable,
  sensorDataTable,
  anomaliesTable,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

// Create a new livestock
export const createLivestock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      farmId,
      name,
      species,
      breed,
      gender,
      birthDate,
      photoUrl,
      status,
      height,
      weight,
      bodyConditionScore,
      notes,
      recordedAt,
    } = req.body;

    // Validate required fields
    if (!farmId || !name || !species) {
      res
        .status(400)
        .json({ error: "Farm ID, name, and species are required" });
      return;
    }

    // Verify that the farm exists and belongs to the user
    const farm = await db
      .select()
      .from(farmsTable)
      .where(
        and(eq(farmsTable.id, farmId), eq(farmsTable.userId, req.user!.id))
      )
      .limit(1);

    if (!farm.length) {
      res
        .status(403)
        .json({ error: "Farm not found or you do not have access" });
      return;
    }

    // Start a transaction to insert livestock and related records
    const result = await db.transaction(async (tx) => {
      // Insert livestock with all fields
      const [livestock] = await tx
        .insert(livestockTable)
        .values({
          farmId,
          userId: req.user!.id,
          name,
          species,
          breed,
          gender,
          birthDate,
          photoUrl,
          status,
          height,
          weight,
          bodyConditionScore,
          notes,
          recordedAt: recordedAt ? new Date(recordedAt) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Insert empty sensor_data record with livestockId as primary key
      await tx.insert(sensorDataTable).values({
        livestockId: livestock.id,
        temperature: null,
        heartRate: null,
        motionLevel: null,
        timestamp: null,
      });

      // Insert empty anomalies record with livestockId as primary key
      await tx.insert(anomaliesTable).values({
        livestockId: livestock.id,
        type: null,
        severity: null,
        notes: null,
        detectedAt: null,
        resolved: null,
      });

      return livestock;
    });

    res.status(201).json({
      message: "Livestock and related records created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create livestock error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all livestock for the authenticated user
export const getAllLivestock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const livestock = await db
      .select()
      .from(livestockTable)
      .where(eq(livestockTable.userId, req.user!.id));

    res.json({
      message: "Livestock retrieved successfully",
      data: livestock,
    });
  } catch (error) {
    console.error("Get livestock error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a single livestock by ID
export const getLivestockById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const livestock = await db
      .select()
      .from(livestockTable)
      .where(
        and(
          eq(livestockTable.id, parseInt(id)),
          eq(livestockTable.userId, req.user!.id)
        )
      )
      .limit(1);

    if (!livestock.length) {
      res
        .status(404)
        .json({ error: "Livestock not found or you do not have access" });
      return;
    }

    res.json({
      message: "Livestock retrieved successfully",
      data: livestock[0],
    });
  } catch (error) {
    console.error("Get livestock by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a livestock
export const updateLivestock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      farmId,
      name,
      species,
      breed,
      gender,
      birthDate,
      photoUrl,
      status,
      height,
      weight,
      bodyConditionScore,
      notes,
      recordedAt,
    } = req.body;

    // Verify that the livestock exists and belongs to the user
    const existingLivestock = await db
      .select()
      .from(livestockTable)
      .where(
        and(
          eq(livestockTable.id, parseInt(id)),
          eq(livestockTable.userId, req.user!.id)
        )
      )
      .limit(1);

    if (!existingLivestock.length) {
      res
        .status(404)
        .json({ error: "Livestock not found or you do not have access" });
      return;
    }

    // If farmId is provided, verify it exists and belongs to the user
    if (farmId) {
      const farm = await db
        .select()
        .from(farmsTable)
        .where(
          and(eq(farmsTable.id, farmId), eq(farmsTable.userId, req.user!.id))
        )
        .limit(1);

      if (!farm.length) {
        res
          .status(403)
          .json({ error: "Farm not found or you do not have access" });
        return;
      }
    }

    // Update livestock with all fields
    const updatedLivestock = await db
      .update(livestockTable)
      .set({
        farmId: farmId || existingLivestock[0].farmId,
        name: name || existingLivestock[0].name,
        species: species || existingLivestock[0].species,
        breed: breed || existingLivestock[0].breed,
        gender: gender || existingLivestock[0].gender,
        birthDate: birthDate || existingLivestock[0].birthDate,
        photoUrl: photoUrl || existingLivestock[0].photoUrl,
        status: status || existingLivestock[0].status,
        height: height !== undefined ? height : existingLivestock[0].height,
        weight: weight !== undefined ? weight : existingLivestock[0].weight,
        bodyConditionScore:
          bodyConditionScore !== undefined
            ? bodyConditionScore
            : existingLivestock[0].bodyConditionScore,
        notes: notes !== undefined ? notes : existingLivestock[0].notes,
        recordedAt:
          recordedAt !== undefined
            ? recordedAt
              ? new Date(recordedAt)
              : null
            : existingLivestock[0].recordedAt,
        updatedAt: new Date(),
      })
      .where(eq(livestockTable.id, parseInt(id)))
      .returning();

    res.json({
      message: "Livestock updated successfully",
      data: updatedLivestock[0],
    });
  } catch (error) {
    console.error("Update livestock error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a livestock
export const deleteLivestock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verify that the livestock exists and belongs to the user
    const livestock = await db
      .select()
      .from(livestockTable)
      .where(
        and(
          eq(livestockTable.id, parseInt(id)),
          eq(livestockTable.userId, req.user!.id)
        )
      )
      .limit(1);

    if (!livestock.length) {
      res
        .status(404)
        .json({ error: "Livestock not found or you do not have access" });
      return;
    }

    // Delete livestock
    await db.delete(livestockTable).where(eq(livestockTable.id, parseInt(id)));

    res.json({ message: "Livestock deleted successfully" });
  } catch (error) {
    console.error("Delete livestock error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLivestockStatusCounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    const result = await db
      .select({
        total: sql`COUNT(*)`.as('total'),
        healthy: sql`SUM(CASE WHEN ${livestockTable.status} = 'Healthy' THEN 1 ELSE 0 END)`.as('healthy'),
        needs_attention: sql`SUM(CASE WHEN ${livestockTable.status} = 'Needs Attention' THEN 1 ELSE 0 END)`.as('needs_attention'),
        critical: sql`SUM(CASE WHEN ${livestockTable.status} = 'Critical' THEN 1 ELSE 0 END)`.as('critical'),
      })
      .from(livestockTable)
      .where(eq(livestockTable.userId, userId))
      .limit(1);

    if (!result.length) {
      res.status(404).json({ error: 'No livestock found for this user' });
      return;
    }

    res.json({
      message: 'Livestock status counts retrieved successfully',
      data: result[0],
    });
  } catch (error) {
    console.error('Get livestock status counts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLivestockSpeciesCounts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    const result = await db
      .select({
        species: livestockTable.species,
        total: sql`COUNT(*)`.as('total'),
      })
      .from(livestockTable)
      .where(eq(livestockTable.userId, userId))
      .groupBy(livestockTable.species)
      .orderBy(sql`COUNT(*) DESC`);

    if (!result.length) {
      res.status(404).json({ error: 'No livestock found for this user' });
      return;
    }

    res.json({
      message: 'Livestock species counts retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Get livestock species counts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLivestockSensorAnomalies = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    const result = await db
      .select({
        sensor_data: {
          livestockId: sensorDataTable.livestockId,
          temperature: sensorDataTable.temperature,
          heartRate: sensorDataTable.heartRate,
          motionLevel: sensorDataTable.motionLevel,
          timestamp: sensorDataTable.timestamp,
        },
        livestock: {
          id: livestockTable.id,
          farmId: livestockTable.farmId,
          userId: livestockTable.userId,
          name: livestockTable.name,
          species: livestockTable.species,
          breed: livestockTable.breed,
          gender: livestockTable.gender,
          birthDate: livestockTable.birthDate,
          photoUrl: livestockTable.photoUrl,
          status: livestockTable.status,
          height: livestockTable.height,
          weight: livestockTable.weight,
          bodyConditionScore: livestockTable.bodyConditionScore,
          notes: livestockTable.notes,
          recordedAt: livestockTable.recordedAt,
          createdAt: livestockTable.createdAt,
          updatedAt: livestockTable.updatedAt,
        },
        anomaly: {
          livestockId: anomaliesTable.livestockId,
          type: anomaliesTable.type,
          severity: anomaliesTable.severity,
          notes: anomaliesTable.notes,
          detectedAt: anomaliesTable.detectedAt,
          resolved: anomaliesTable.resolved,
        },
      })
      .from(sensorDataTable)
      .innerJoin(livestockTable, eq(sensorDataTable.livestockId, livestockTable.id))
      .innerJoin(anomaliesTable, eq(anomaliesTable.livestockId, livestockTable.id))
      .where(eq(livestockTable.userId, userId));

    if (!result.length) {
      res.status(404).json({ error: 'No sensor data or anomalies found for this user' });
      return;
    }

    res.json({
      message: 'Livestock sensor data and anomalies retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Get livestock sensor data and anomalies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLivestockSensorAnomaliesById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const livestockId = Number(req.params.livestockId);

    const result = await db
      .select({
        sensor_data: {
          livestockId: sensorDataTable.livestockId,
          temperature: sensorDataTable.temperature,
          heartRate: sensorDataTable.heartRate,
          motionLevel: sensorDataTable.motionLevel,
          timestamp: sensorDataTable.timestamp,
        },
        livestock: {
          id: livestockTable.id,
          farmId: livestockTable.farmId,
          userId: livestockTable.userId,
          name: livestockTable.name,
          species: livestockTable.species,
          breed: livestockTable.breed,
          gender: livestockTable.gender,
          birthDate: livestockTable.birthDate,
          photoUrl: livestockTable.photoUrl,
          status: livestockTable.status,
          height: livestockTable.height,
          weight: livestockTable.weight,
          bodyConditionScore: livestockTable.bodyConditionScore,
          notes: livestockTable.notes,
          recordedAt: livestockTable.recordedAt,
          createdAt: livestockTable.createdAt,
          updatedAt: livestockTable.updatedAt,
        },
        anomaly: {
          livestockId: anomaliesTable.livestockId,
          type: anomaliesTable.type,
          severity: anomaliesTable.severity,
          notes: anomaliesTable.notes,
          detectedAt: anomaliesTable.detectedAt,
          resolved: anomaliesTable.resolved,
        },
      })
      .from(sensorDataTable)
      .innerJoin(livestockTable, eq(sensorDataTable.livestockId, livestockTable.id))
      .innerJoin(anomaliesTable, eq(anomaliesTable.livestockId, livestockTable.id))
      .where(
        and(
          eq(livestockTable.id, livestockId)
        )
      );

    if (!result.length) {
      res.status(404).json({ error: 'No sensor data or anomalies found for this livestock or you do not have access' });
      return;
    }

    res.json({
      message: 'Livestock sensor data and anomalies retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Get livestock sensor data and anomalies by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};