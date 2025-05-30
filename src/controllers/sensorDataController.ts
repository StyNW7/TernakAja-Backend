import { Request, Response } from "express";
import { db } from "../db/drizzle";
import { sensorDataTable, livestockTable } from "../db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

// Get sensor data by livestock ID
export const getSensorData = async (
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

    // Fetch sensor data
    const sensorData = await db
      .select()
      .from(sensorDataTable)
      .where(eq(sensorDataTable.livestockId, livestockId));

    res.json({
      message: "Sensor data retrieved successfully",
      sensorData: sensorData[0] || null, // Return null if no record exists
    });
  } catch (error) {
    console.error("Get sensor data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update or create sensor data
export const updateSensorData = async (
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

    // Check if sensor data exists
    const existingSensorData = await db
      .select()
      .from(sensorDataTable)
      .where(eq(sensorDataTable.livestockId, livestockId))
      .limit(1);

    let updatedSensorData;
    if (existingSensorData.length) {
      // Update existing sensor data
      [updatedSensorData] = await db
        .update(sensorDataTable)
        .set({
          temperature,
          heartRate,
          motionLevel,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        })
        .where(eq(sensorDataTable.livestockId, livestockId))
        .returning();
    } else {
      // Create new sensor data
      [updatedSensorData] = await db
        .insert(sensorDataTable)
        .values({
          livestockId,
          temperature,
          heartRate,
          motionLevel,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        })
        .returning();
    }

    res.json({
      message: "Sensor data updated successfully",
      sensorData: updatedSensorData,
    });
  } catch (error) {
    console.error("Update sensor data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLivestockSensorAverages = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    const result = await db
      .select({
        day: sql`DATE(${sensorDataTable.timestamp})`.as('day'),
        avg_temperature: sql`AVG(${sensorDataTable.temperature})`.as('avg_temperature'),
        avg_heart_rate: sql`AVG(${sensorDataTable.heartRate})`.as('avg_heart_rate'),
      })
      .from(sensorDataTable)
      .innerJoin(livestockTable, eq(sensorDataTable.livestockId, livestockTable.id))
      .where(
        and(
          eq(livestockTable.userId, userId),
          gte(sensorDataTable.timestamp, sql`CURRENT_DATE - INTERVAL '6 days'`)
        )
      )
      .groupBy(sql`DATE(${sensorDataTable.timestamp})`)
      .orderBy(sql`DATE(${sensorDataTable.timestamp}) DESC`);

    if (!result.length) {
      res.status(404).json({ error: 'No sensor data found for this user in the last 7 days' });
      return;
    }

    res.json({
      message: 'Livestock sensor averages retrieved successfully',
      sensorAverages: result,
    });
  } catch (error) {
    console.error('Get livestock sensor averages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};