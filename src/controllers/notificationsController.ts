import { Request, Response } from "express";
import { db } from "../db/drizzle";
import {
  livestockTable,
  notificationsTable,
  sensorDataTable,
} from "../db/schema";
import { eq, sql } from "drizzle-orm";

export const getRecentNotifications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    const result = await db
      .select({
        id: notificationsTable.id,
        livestock_id: notificationsTable.livestockId,
        message: notificationsTable.message,
        type: notificationsTable.type,
        read: notificationsTable.read,
        sent_at: notificationsTable.sentAt,
        l_id: livestockTable.id,
        l_name: livestockTable.name,
        l_species: livestockTable.species,
      })
      .from(notificationsTable)
      .innerJoin(
        livestockTable,
        eq(notificationsTable.livestockId, livestockTable.id)
      )
      .where(eq(notificationsTable.userId, userId))
      .orderBy(sql`${notificationsTable.sentAt} DESC`)
      .limit(4);

    if (!result.length) {
      res.status(404).json({ error: "No notifications found for this user" });
      return;
    }

    res.json({
      message: "Recent notifications retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Get recent notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getNotificationsWithLivestockAndSensorData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = Number(req.params.userId);

    const result = await db
      .select({
        notification: {
          id: notificationsTable.id,
          userId: notificationsTable.userId,
          livestockId: notificationsTable.livestockId,
          message: notificationsTable.message,
          type: notificationsTable.type,
          read: notificationsTable.read,
          sentAt: notificationsTable.sentAt,
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
        sensor_data: {
          livestockId: sensorDataTable.livestockId,
          temperature: sensorDataTable.temperature,
          heartRate: sensorDataTable.heartRate,
          sp02: sensorDataTable.sp02, // CHANGED
          timestamp: sensorDataTable.timestamp,
        },
      })
      .from(notificationsTable)
      .innerJoin(
        livestockTable,
        eq(notificationsTable.livestockId, livestockTable.id)
      )
      .innerJoin(
        sensorDataTable,
        eq(sensorDataTable.livestockId, livestockTable.id)
      )
      .where(eq(notificationsTable.userId, userId));

    if (!result.length) {
      res.status(404).json({
        error:
          "No notifications with associated livestock or sensor data found for this user",
      });
      return;
    }

    res.json({
      message:
        "Notifications with livestock and sensor data retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "Get notifications with livestock and sensor data error:",
      error
    );
    res.status(500).json({ error: "Internal server error" });
  }
};
