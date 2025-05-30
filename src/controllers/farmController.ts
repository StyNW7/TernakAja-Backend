import { Request, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/drizzle";
import { farmsTable } from "../db/schema";

// Create a new farm
export const createFarm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, location, address, type } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ error: "Farm name is required" });
      return;
    }

    // Create new farm
    const newFarm = await db
      .insert(farmsTable)
      .values({
        userId: req.user!.id,
        name,
        location,
        address,
        type,
        createdAt: new Date(),
      })
      .returning();

    res.status(201).json({
      message: "Farm created successfully",
      data: newFarm[0],
    });
  } catch (error) {
    console.error("Create farm error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all farms for the authenticated user
export const getAllFarms = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const farms = await db
      .select()
      .from(farmsTable)
      .where(eq(farmsTable.userId, req.user!.id));

    res.json({
      message: "Farms retrieved successfully",
      data: farms,
    });
  } catch (error) {
    console.error("Get farms error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a single farm by ID
export const getFarmById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID
    const farmId = parseInt(id);
    if (isNaN(farmId)) {
      res.status(400).json({ error: "Invalid farm ID" });
      return;
    }

    const farm = await db
      .select()
      .from(farmsTable)
      .where(
        and(eq(farmsTable.id, farmId), eq(farmsTable.userId, req.user!.id))
      )
      .limit(1);

    if (!farm.length) {
      res
        .status(404)
        .json({ error: "Farm not found or you do not have access" });
      return;
    }

    res.json({
      message: "Farm retrieved successfully",
      data: farm[0],
    });
  } catch (error) {
    console.error("Get farm by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a farm
export const updateFarm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, location, address, type } = req.body;

    // Validate ID
    const farmId = parseInt(id);
    if (isNaN(farmId)) {
      res.status(400).json({ error: "Invalid farm ID" });
      return;
    }

    // Verify that the farm exists and belongs to the user
    const existingFarm = await db
      .select()
      .from(farmsTable)
      .where(
        and(eq(farmsTable.id, farmId), eq(farmsTable.userId, req.user!.id))
      )
      .limit(1);

    if (!existingFarm.length) {
      res
        .status(404)
        .json({ error: "Farm not found or you do not have access" });
      return;
    }

    // Update farm
    const updatedFarm = await db
      .update(farmsTable)
      .set({
        name: name || existingFarm[0].name,
        location: location || existingFarm[0].location,
        address: address || existingFarm[0].address,
        type: type || existingFarm[0].type,
      })
      .where(eq(farmsTable.id, farmId))
      .returning();

    res.json({
      message: "Farm updated successfully",
      data: updatedFarm[0],
    });
  } catch (error) {
    console.error("Update farm error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete a farm
export const deleteFarm = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID
    const farmId = parseInt(id);
    if (isNaN(farmId)) {
      res.status(400).json({ error: "Invalid farm ID" });
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
        .status(404)
        .json({ error: "Farm not found or you do not have access" });
      return;
    }

    // Delete farm
    await db.delete(farmsTable).where(eq(farmsTable.id, farmId));

    res.json({ message: "Farm deleted successfully" });
  } catch (error) {
    console.error("Delete farm error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
