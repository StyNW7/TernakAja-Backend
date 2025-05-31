import { Request, Response } from "express";
import { db } from "../db/drizzle";
import { sensorDataTable, livestockTable } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

// Fetch the latest sensor data by livestock ID
export const getLatestSensorData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate livestockId
    const livestockId = parseInt(id);
    if (isNaN(livestockId)) {
      res.status(400).json({ error: "Invalid livestock ID" });
      return;
    }

    // Verify livestock exists and belongs to user
    const livestock = await db
      .select()
      .from(livestockTable)
      .where(
        and(
          eq(livestockTable.id, livestockId),
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

    // Fetch the latest sensor data
    const sensorData = await db
      .select()
      .from(sensorDataTable)
      .where(eq(sensorDataTable.livestockId, livestockId))
      .orderBy(sql`${sensorDataTable.timestamp} DESC`)
      .limit(1);

    res.json({
      message: "Latest sensor data retrieved successfully",
      data: sensorData[0] || null, // Return null if no record exists
    });
  } catch (error) {
    console.error("Get latest sensor data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Fetch all sensor data (history) by livestock ID
export const getSensorDataHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate livestockId
    const livestockId = parseInt(id);
    if (isNaN(livestockId)) {
      res.status(400).json({ error: "Invalid livestock ID" });
      return;
    }

    // Verify livestock exists and belongs to user
    const livestock = await db
      .select()
      .from(livestockTable)
      .where(
        and(
          eq(livestockTable.id, livestockId),
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

    // Fetch all sensor data
    const sensorData = await db
      .select()
      .from(sensorDataTable)
      .where(eq(sensorDataTable.livestockId, livestockId))
      .orderBy(sql`${sensorDataTable.timestamp} DESC`);

    res.json({
      message: "Sensor data history retrieved successfully",
      data: sensorData, // Return array of sensor data records
    });
  } catch (error) {
    console.error("Get sensor data history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new sensor data
export const createSensorData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { temperature, heartRate, motionLevel, timestamp } = req.body;

    // Validate livestockId
    const livestockId = parseInt(id);
    if (isNaN(livestockId)) {
      res.status(400).json({ error: "Invalid livestock ID" });
      return;
    }

    // Validate required fields
    if (
      temperature === undefined ||
      heartRate === undefined ||
      motionLevel === undefined
    ) {
      res.status(400).json({
        error: "Temperature, heart rate, and motion level are required",
      });
      return;
    }

    // Verify livestock exists and belongs to user
    const livestock = await db
      .select()
      .from(livestockTable)
      .where(
        and(
          eq(livestockTable.id, livestockId),
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

    // Insert new sensor data
    const [newSensorData] = await db
      .insert(sensorDataTable)
      .values({
        livestockId,
        temperature,
        heartRate,
        motionLevel,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      })
      .returning();

    res.status(201).json({
      message: "Sensor data created successfully",
      data: newSensorData,
    });
  } catch (error) {
    console.error("Create sensor data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
