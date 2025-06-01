import { Request, Response } from "express";
import { db } from "../db/drizzle";
import { sensorDataTable, livestockTable } from "../db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

interface SensorAverages {
  avgHeartRate: number;
  avgTemperature: number;
  avgRespiratoryRate: number;
}

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
    const { temperature, heartRate, respiratoryRate, timestamp } = req.body;

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
      respiratoryRate === undefined
    ) {
      res.status(400).json({
        error: "Temperature, heart rate, and respiratory rate are required",
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
        respiratoryRate,
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

export const getSensorAverages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Verify user exists
    const user = await db
      .select()
      .from(livestockTable)
      .where(eq(livestockTable.userId, userId))
      .limit(1);

    if (!user.length) {
      res.status(404).json({ error: 'User not found or no livestock associated' });
      return;
    }

    // Define aliases for tables
    const sd = alias(sensorDataTable, 'sd');
    const l = alias(livestockTable, 'l');

    // Fetch sensor data averages
    const result = await db
      .select({
        avgHeartRate: sql<number>`AVG(${sd.heartRate})`.as('avg_heart_rate'),
        avgTemperature: sql<number>`AVG(${sd.temperature})`.as('avg_temperature'),
        avgRespiratoryRate: sql<number>`AVG(${sd.respiratoryRate})`.as('avg_respiratory_rate'),
      })
      .from(sd)
      .innerJoin(l, eq(sd.livestockId, l.id))
      .where(
        and(
          eq(l.userId, userId),
          gte(sd.timestamp, sql`NOW() - INTERVAL '1 hour'`)
        )
      );

    if (!result.length || result[0].avgHeartRate === null) {
      res.status(404).json({ error: 'No sensor data found for the user in the last hour' });
      return;
    }

    const averages: SensorAverages = {
      avgHeartRate: result[0].avgHeartRate,
      avgTemperature: result[0].avgTemperature,
      avgRespiratoryRate: result[0].avgRespiratoryRate,
    };

    res.json({
      message: 'Sensor data averages retrieved successfully',
      data: averages,
    });
  } catch (error) {
    console.error('Get sensor averages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};