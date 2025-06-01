import { Request, Response } from "express";
import { db } from "../db/drizzle";
import {
  livestockTable,
  farmsTable,
  sensorDataTable,
  devicesTable,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

// Create a new livestock
export const createLivestock = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      userId,
      farmId,
      deviceId,
      deviceType,
      firmware,
      wifiSsid,
      wifiPassword,
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
    if (
      !userId ||
      !farmId ||
      !deviceId ||
      !deviceType ||
      !firmware ||
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
          "Missing required fields: userId, farmId, deviceId, deviceType, firmware, name, species, breed, gender, birthDate, status, height, weight, bodyConditionScore",
      });
      return;
    }

    // Placeholder for Azure IoT Hub device registration
    // TODO: Implement logic to register new device with Azure IoT Hub
    // const azureDevice = await registerDeviceToAzureIoTHub(deviceId, deviceType, firmware, wifiSsid, wifiPassword);
    // const connectionString = azureDevice.connectionString; // Example field to store

    // Start a transaction to insert livestock and device
    const result = await db.transaction(async (tx) => {
      // Insert livestock
      const [livestock] = await tx
        .insert(livestockTable)
        .values({
          farmId,
          userId,
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

      // Insert device
      const [device] = await tx
        .insert(devicesTable)
        .values({
          livestockId: livestock.id,
          deviceId,
          deviceType,
          firmware,
          wifiSsid: wifiSsid || null,
          wifiPassword: wifiPassword || null,
          connectionString: null, // Placeholder: Set to null until Azure IoT Hub is implemented
          lastOnline: null, // Placeholder: Set to null until device connects
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

// Get livestock status counts
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
          sql`SUM(CASE WHEN ${livestockTable.status} = 'Healthy' THEN 1 ELSE 0 END)`.as(
            "healthy"
          ),
        needs_attention:
          sql`SUM(CASE WHEN ${livestockTable.status} = 'Needs Attention' THEN 1 ELSE 0 END)`.as(
            "needs_attention"
          ),
        critical:
          sql`SUM(CASE WHEN ${livestockTable.status} = 'Critical' THEN 1 ELSE 0 END)`.as(
            "critical"
          ),
      })
      .from(livestockTable)
      .where(eq(livestockTable.userId, userId))
      .limit(1);

    if (!result.length) {
      res.status(404).json({ error: "No livestock found for this user" });
      return;
    }

    res.json({
      message: "Livestock status counts retrieved successfully",
      data: result[0],
    });
  } catch (error) {
    console.error("Get livestock status counts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get livestock species counts
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

// Get livestock and latest sensor data
export const getLivestockSensorData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);
    // console.log(userId);
    // Validate userId
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Ensure the userId matches the authenticated user
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
        motionLevel: sensorDataTable.motionLevel,
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
          motionLevel: latestSensorData.motionLevel,
          timestamp: latestSensorData.timestamp,
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

// Get livestock and latest sensor data by livestock ID
export const getLivestockSensorDataById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const livestockId = Number(req.params.livestockId);

    // Validate livestockId
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
        motionLevel: sensorDataTable.motionLevel,
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
          motionLevel: latestSensorData.motionLevel,
          timestamp: latestSensorData.timestamp,
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
      data: result[0], // Return the first (and only) result
    });
  } catch (error) {
    console.error("Get livestock and latest sensor data by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
