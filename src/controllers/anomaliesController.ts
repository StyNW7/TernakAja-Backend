import { Request, Response } from "express";
import { db } from "../db/drizzle";
import { livestockTable, anomaliesTable } from "../db/schema";
import { eq, and } from "drizzle-orm";

// Get anomalies data by livestock ID
export const getAnomaliesData = async (
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

    // Fetch anomalies data
    const anomaliesData = await db
      .select()
      .from(anomaliesTable)
      .where(eq(anomaliesTable.livestockId, livestockId));

    res.json({
      message: "Anomalies data retrieved successfully",
      data: anomaliesData[0] || null, // Return null if no record exists
    });
  } catch (error) {
    console.error("Get anomalies data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update or create anomalies data
export const updateAnomaliesData = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, severity, notes, detectedAt, resolved } = req.body;

    // Validate livestockId
    const livestockId = parseInt(id);
    if (isNaN(livestockId)) {
      res.status(400).json({ error: "Invalid livestock ID" });
      return;
    }

    // Validate required fields
    if (
      type === undefined ||
      severity === undefined ||
      resolved === undefined
    ) {
      res.status(400).json({
        error: "Type, severity, and resolved status are required",
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

    // Check if anomaly data exists
    const existingAnomaly = await db
      .select()
      .from(anomaliesTable)
      .where(eq(anomaliesTable.livestockId, livestockId))
      .limit(1);

    let updatedAnomaly;
    if (existingAnomaly.length) {
      // Update existing anomaly data
      [updatedAnomaly] = await db
        .update(anomaliesTable)
        .set({
          type,
          severity,
          notes,
          detectedAt: detectedAt ? new Date(detectedAt) : new Date(),
          resolved,
        })
        .where(eq(anomaliesTable.livestockId, livestockId))
        .returning();
    } else {
      // Create new anomaly data
      [updatedAnomaly] = await db
        .insert(anomaliesTable)
        .values({
          livestockId,
          type,
          severity,
          notes,
          detectedAt: detectedAt ? new Date(detectedAt) : new Date(),
          resolved,
        })
        .returning();
    }

    res.json({
      message: "Anomaly data updated successfully",
      data: updatedAnomaly,
    });
  } catch (error) {
    console.error("Update anomaly data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
