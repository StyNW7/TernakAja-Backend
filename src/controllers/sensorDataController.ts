import { Request, Response } from "express";
import { db } from "../db/drizzle";
import { sensorDataTable, livestockTable } from "../db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

interface SensorAverages {
  avgHeartRate: number;
  avgTemperature: number;
  avgSp02: number;
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
    const { temperature, heartRate, sp02, timestamp } = req.body;

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
      sp02 === undefined
    ) {
      res.status(400).json({
        error: "Temperature, heart rate, and SpO2 are required",
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
        sp02,
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
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Verify user exists
    const user = await db
      .select()
      .from(livestockTable)
      .where(eq(livestockTable.userId, userId))
      .limit(1);

    if (!user.length) {
      res
        .status(404)
        .json({ error: "User not found or no livestock associated" });
      return;
    }

    // Define aliases for tables
    const sd = alias(sensorDataTable, "sd");
    const l = alias(livestockTable, "l");

    // Fetch sensor data averages
    const result = await db
      .select({
        avgHeartRate: sql<number>`AVG(${sd.heartRate})`.as("avg_heart_rate"),
        avgTemperature: sql<number>`AVG(${sd.temperature})`.as(
          "avg_temperature"
        ),
        avgSp02: sql<number>`AVG(${sd.sp02})`.as("avg_sp02"),
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
      res
        .status(404)
        .json({ error: "No sensor data found for the user in the last hour" });
      return;
    }

    const averages: SensorAverages = {
      avgHeartRate: result[0].avgHeartRate,
      avgTemperature: result[0].avgTemperature,
      avgSp02: result[0].avgSp02,
    };

    res.json({
      message: "Sensor data averages retrieved successfully",
      data: averages,
    });
  } catch (error) {
    console.error("Get sensor averages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLivestockSensorAveragesSevenDay = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    const result = await db
      .select({
        day: sql`DATE(${sensorDataTable.timestamp})`.as("day"),
        avg_temperature: sql`AVG(${sensorDataTable.temperature})`.as(
          "avg_temperature"
        ),
        avg_heart_rate: sql`AVG(${sensorDataTable.heartRate})`.as(
          "avg_heart_rate"
        ),
        avg_sp02: sql`AVG(${sensorDataTable.sp02})`.as("avg_sp02"),
      })
      .from(sensorDataTable)
      .innerJoin(
        livestockTable,
        eq(sensorDataTable.livestockId, livestockTable.id)
      )
      .where(
        and(
          eq(livestockTable.userId, userId),
          gte(sensorDataTable.timestamp, sql`CURRENT_DATE - INTERVAL '6 days'`)
        )
      )
      .groupBy(sql`DATE(${sensorDataTable.timestamp})`)
      .orderBy(sql`DATE(${sensorDataTable.timestamp}) DESC`);

    if (!result.length) {
      res.status(404).json({
        error: "No sensor data found for this user in the last 7 days",
      });
      return;
    }

    const formattedResult = result.map((row) => ({
      day: row.day,
      avg_temperature: Number(row.avg_temperature),
      avg_heart_rate: Number(row.avg_heart_rate),
      avg_sp02: Number(row.avg_sp02),
    }));

    res.json({
      message: "Livestock sensor averages retrieved successfully",
      data: formattedResult,
    });
  } catch (error) {
    console.error("Get livestock sensor averages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLivestockSensorAveragesSevenDayById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const livestockId = Number(req.params.id);

    const result = await db
      .select({
        day: sql`DATE(${sensorDataTable.timestamp})`.as("day"),
        avg_temperature: sql`AVG(${sensorDataTable.temperature})`.as(
          "avg_temperature"
        ),
        avg_heart_rate: sql`AVG(${sensorDataTable.heartRate})`.as(
          "avg_heart_rate"
        ),
        avg_sp02: sql`AVG(${sensorDataTable.sp02})`.as("avg_sp02"),
      })
      .from(sensorDataTable)
      .innerJoin(
        livestockTable,
        eq(sensorDataTable.livestockId, livestockTable.id)
      )
      .where(
        and(
          eq(livestockTable.id, livestockId),
          gte(sensorDataTable.timestamp, sql`CURRENT_DATE - INTERVAL '6 days'`)
        )
      )
      .groupBy(sql`DATE(${sensorDataTable.timestamp})`)
      .orderBy(sql`DATE(${sensorDataTable.timestamp}) DESC`);

    if (!result.length) {
      res.status(404).json({
        error: "No sensor data found for this livestock in the last 7 days",
      });
      return;
    }

    const formattedResult = result.map((row) => ({
      day: row.day,
      avg_temperature: Number(row.avg_temperature),
      avg_heart_rate: Number(row.avg_heart_rate),
      avg_sp02: Number(row.avg_sp02),
    }));

    res.json({
      message: "Livestock sensor averages retrieved successfully",
      data: formattedResult,
    });
  } catch (error) {
    console.error("Get livestock sensor averages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
