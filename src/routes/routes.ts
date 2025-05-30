import { Router } from "express";
import { register, login, getProfile } from "../controllers/authController";
import { verifyJwt } from "../middleware/authMiddleware";
import {
  createLivestock,
  deleteLivestock,
  getAllLivestock,
  getLivestockById,
  getLivestockSensorAnomalies,
  getLivestockSensorAnomaliesById,
  getLivestockSpeciesCounts,
  getLivestockStatusCounts,
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
  getLivestockSensorAverages,
  getSensorData,
  updateSensorData,
} from "../controllers/sensorDataController";
import {
  getAnomaliesData,
  updateAnomaliesData,
} from "../controllers/anomaliesController";
import { getNotificationsWithLivestockAndSensorData, getRecentNotifications } from "../controllers/notificationsController";

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

router.get("/livestock/:userId/status-counts", verifyJwt, getLivestockStatusCounts);
router.get("/livestock/:userId/species-counts", verifyJwt, getLivestockSpeciesCounts);
router.get("/livestock/:userId/sensor-anomalies", verifyJwt, getLivestockSensorAnomalies);
router.get("/livestock/:livestockId/detail", verifyJwt, getLivestockSensorAnomaliesById);

// Sensor Data routes
router.get("/livestock/:id/sensor-data", verifyJwt, getSensorData);
router.put("/livestock/:id/sensor-data", verifyJwt, updateSensorData);

router.get("/livestock/:userId/avg-metrics-seven-day", verifyJwt, getLivestockSensorAverages);

// Anomalies routes
router.get("/livestock/:id/anomalies", verifyJwt, getAnomaliesData);
router.put("/livestock/:id/anomalies", verifyJwt, updateAnomaliesData);

// Notifications routes
router.get("/livestock/:userId/recent-notifs", verifyJwt, getRecentNotifications);
router.get("/livestock/:userId/notif-detail", verifyJwt, getNotificationsWithLivestockAndSensorData);

export default router;
