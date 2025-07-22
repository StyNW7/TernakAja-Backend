import { Request, Response } from "express";
import { db } from "../db/drizzle";
import { livestockTable, sensorDataTable, devicesTable } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

const toTitleCase = (
  str: string | null | undefined
): string | null | undefined => {
  if (!str) return str;
  return str
    .toLowerCase()
    .replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());
};

export const createLivestock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      userId,
      deviceId,
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

    if (
      !userId ||
      !deviceId ||
      !name ||
      !species ||
      !breed ||
      !gender ||
      !birthDate ||
      !status ||
      !height ||
      !weight ||
      !bodyConditionScore
    ) {
      res.status(400).json({
        error:
          "Missing required fields: userId name, species, breed, gender, birthDate, status, height, weight, bodyConditionScore",
      });
      return;
    }

    const result = await db.transaction(async (tx) => {
      const [livestock] = await tx
        .insert(livestockTable)
        .values({
          userId,
          name,
          species: toTitleCase(species),
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

      const [device] = await tx
        .insert(devicesTable)
        .values({
          livestockId: livestock.id,
          deviceId,
          lastUpdate: null,
        })
        .returning();

      return { livestock, device };
    });

    res.status(201).json({
      message: "Livestock and device created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create livestock error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

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

export const updateLivestock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
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

    const updatedLivestock = await db
      .update(livestockTable)
      .set({
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

export const deleteLivestock = async (
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
        total: sql`COUNT(*)`.as("total"),
        healthy:
          sql`COUNT(CASE WHEN ${livestockTable.status} = 'healthy' THEN 1 ELSE NULL END)`.as(
            "healthy"
          ),
        unhealthy:
          sql`COUNT(CASE WHEN ${livestockTable.status} = 'unhealthy' THEN 1 ELSE NULL END)`.as(
            "unhealthy"
          ),
      })
      .from(livestockTable)
      .where(eq(livestockTable.userId, userId));

    // console.log(result);

    res.json({
      message: "Livestock status counts retrieved successfully",
      data: result[0],
    });
  } catch (error) {
    console.error("Get livestock status counts error:", error);
    res.status(500).json({ error: "Internal server error" });
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
        total: sql`COUNT(*)`.as("total"),
      })
      .from(livestockTable)
      .where(eq(livestockTable.userId, userId))
      .groupBy(livestockTable.species)
      .orderBy(sql`COUNT(*) DESC`);

    if (!result.length) {
      res.status(404).json({ error: "No livestock found for this user" });
      return;
    }

    res.json({
      message: "Livestock species counts retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get livestock species counts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLivestockSensorData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    if (userId !== req.user!.id) {
      res.status(403).json({ error: "Unauthorized access" });
      return;
    }

    const latestSensorData = db
      .select({
        id: sensorDataTable.id,
        livestockId: sensorDataTable.livestockId,
        temperature: sensorDataTable.temperature,
        heartRate: sensorDataTable.heartRate,
        sp02: sensorDataTable.sp02,
        timestamp: sensorDataTable.timestamp,
        row_number:
          sql`ROW_NUMBER() OVER (PARTITION BY ${sensorDataTable.livestockId} ORDER BY ${sensorDataTable.timestamp} DESC)`.as(
            "rn"
          ),
      })
      .from(sensorDataTable)
      .as("latest_sensor_data");

    const result = await db
      .select({
        sensor_data: {
          id: latestSensorData.id,
          livestockId: latestSensorData.livestockId,
          temperature: latestSensorData.temperature,
          heartRate: latestSensorData.heartRate,
          sp02: latestSensorData.sp02,
          timestamp: latestSensorData.timestamp,
        },
        livestock: {
          id: livestockTable.id,
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
      })
      .from(livestockTable)
      .leftJoin(
        latestSensorData,
        and(
          eq(latestSensorData.livestockId, livestockTable.id),
          eq(latestSensorData.row_number, 1)
        )
      )
      .where(eq(livestockTable.userId, userId));

    if (!result.length) {
      res.status(404).json({
        error: "No livestock found for this user",
      });
      return;
    }

    res.json({
      message: "Livestock and latest sensor data retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get livestock and latest sensor data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLivestockSensorDataById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const livestockId = Number(req.params.livestockId);

    if (isNaN(livestockId)) {
      res.status(400).json({ error: "Invalid livestock ID" });
      return;
    }

    const latestSensorData = db
      .select({
        id: sensorDataTable.id,
        livestockId: sensorDataTable.livestockId,
        temperature: sensorDataTable.temperature,
        heartRate: sensorDataTable.heartRate,
        sp02: sensorDataTable.sp02,
        timestamp: sensorDataTable.timestamp,
        row_number:
          sql`ROW_NUMBER() OVER (PARTITION BY ${sensorDataTable.livestockId} ORDER BY ${sensorDataTable.timestamp} DESC)`.as(
            "rn"
          ),
      })
      .from(sensorDataTable)
      .where(eq(sensorDataTable.livestockId, livestockId))
      .as("latest_sensor_data");

    const result = await db
      .select({
        sensor_data: {
          id: latestSensorData.id,
          livestockId: latestSensorData.livestockId,
          temperature: latestSensorData.temperature,
          heartRate: latestSensorData.heartRate,
          sp02: latestSensorData.sp02,
          timestamp: latestSensorData.timestamp,
        },
        livestock: {
          id: livestockTable.id,
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
      })
      .from(livestockTable)
      .leftJoin(
        latestSensorData,
        and(
          eq(latestSensorData.livestockId, livestockTable.id),
          eq(latestSensorData.row_number, 1)
        )
      )
      .where(
        and(
          eq(livestockTable.id, livestockId),
          eq(livestockTable.userId, req.user!.id)
        )
      );

    if (!result.length) {
      res.status(404).json({
        error: "No livestock found for this ID or you do not have access",
      });
      return;
    }

    res.json({
      message: "Livestock and latest sensor data retrieved successfully",
      data: result[0],
    });
  } catch (error) {
    console.error("Get livestock and latest sensor data by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
