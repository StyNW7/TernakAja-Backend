import { Router } from "express";
import { register, login, getProfile } from "../controllers/authController";
import { verifyJwt } from "../middleware/authMiddleware";
import {
  createLivestock,
  deleteLivestock,
  getAllLivestock,
  getLivestockById,
  updateLivestock,
} from "../controllers/livestockController";
import {
  createFarm,
  deleteFarm,
  getAllFarms,
  getFarmById,
  updateFarm,
} from "../controllers/farmController";
import {
  getSensorData,
  updateSensorData,
} from "../controllers/sensorDataController";
import {
  getAnomaliesData,
  updateAnomaliesData,
} from "../controllers/anomaliesController";

const router = Router();

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.get("/profile/:id", verifyJwt, getProfile);

// Farm routes
router.post("/farms", verifyJwt, createFarm);
router.get("/farms", verifyJwt, getAllFarms);
router.get("/farms/:id", verifyJwt, getFarmById);
router.put("/farms/:id", verifyJwt, updateFarm);
router.delete("/farms/:id", verifyJwt, deleteFarm);

// Livestock routes
router.post("/livestock", verifyJwt, createLivestock);
router.get("/livestock", verifyJwt, getAllLivestock);
router.get("/livestock/:id", verifyJwt, getLivestockById);
router.put("/livestock/:id", verifyJwt, updateLivestock);
router.delete("/livestock/:id", verifyJwt, deleteLivestock);

// Sensor Data routes
router.get("/livestock/:id/sensor-data", verifyJwt, getSensorData);
router.put("/livestock/:id/sensor-data", verifyJwt, updateSensorData);

// Anomalies routes
router.get("/livestock/:id/anomalies", verifyJwt, getAnomaliesData);
router.put("/livestock/:id/anomalies", verifyJwt, updateAnomaliesData);

export default router;
