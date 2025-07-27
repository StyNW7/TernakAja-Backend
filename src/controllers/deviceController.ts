import { Request, Response } from "express";
import { generateSasToken } from "../utils/sas";

export const getSasToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log(req.body);
  try {
    const { hostname, deviceId, primaryKey } = req.body;

    if (!hostname || !deviceId || !primaryKey) {
      res.status(400).json({
        error: "Missing required fields: hostname, deviceId, primaryKey",
      });
      return;
    }

    const resourceUri = `${hostname}/devices/${deviceId}`;
    const expiry = 600; // 10 minutes TTL
    const sasToken = generateSasToken(resourceUri, primaryKey, expiry);

    res.status(200).json({
      message: "SAS token generated successfully",
      data: { sasToken },
    });
  } catch (error) {
    console.error("Generate SAS token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
