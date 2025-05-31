import { Router } from "express";
import { register, login, getProfile } from "../controllers/authController";
import { verifyJwt } from "../middleware/authMiddleware";
import {
  createLivestock,
  deleteLivestock,
  getAllLivestock,
  getLivestockById,
  getLivestockSensorData,
  getLivestockSensorDataById,
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
  createSensorData,
  getLatestSensorData,
  getSensorAverages,
  getSensorDataHistory,
} from "../controllers/sensorDataController";
import {
  getAnomaliesData,
  updateAnomaliesData,
} from "../controllers/anomaliesController";
import {
  getNotificationsWithLivestockAndSensorData,
  getRecentNotifications,
} from "../controllers/notificationsController";

const router = Router();

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyJwt, getProfile);

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

router.get(
  "/livestock/:userId/status-counts",
  verifyJwt,
  getLivestockStatusCounts
);
router.get(
  "/livestock/:userId/species-counts",
  verifyJwt,
  getLivestockSpeciesCounts
);
router.get("/livestock/:userId/sensor-data", verifyJwt, getLivestockSensorData);
router.get(
  "/livestock/:livestockId/detail",
  verifyJwt,
  getLivestockSensorDataById
);

// Sensor Data routes
router.get("/livestock/:id/sensor-data/latest", verifyJwt, getLatestSensorData);
router.get(
  "/livestock/:id/sensor-data/history",
  verifyJwt,
  getSensorDataHistory
);
router.post("/livestock/:id/sensor-data", verifyJwt, createSensorData);
router.get("/livestock/:userId/sensor-data/average-recent", verifyJwt, getSensorAverages);

// Anomalies routes
router.get("/livestock/:id/anomalies", verifyJwt, getAnomaliesData);
router.put("/livestock/:id/anomalies", verifyJwt, updateAnomaliesData);

// Notifications routes
router.get(
  "/livestock/:userId/recent-notifs",
  verifyJwt,
  getRecentNotifications
);
router.get(
  "/livestock/:userId/notif-detail",
  verifyJwt,
  getNotificationsWithLivestockAndSensorData
);

export default router;
