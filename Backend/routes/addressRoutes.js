import express from "express";
import { 
  getLocationFromCoords, 
  getNearbyHostels,
  getProvinces,
  getDistricts,
  getWards,
  getAddressDetail
} from "../services/location-service/controllers/locationController.js";

const router = express.Router();

// Existing routes
router.post("/", getLocationFromCoords);
router.post("/nearby-hostels", getNearbyHostels);

// New address routes
router.get("/provinces", getProvinces);
router.get("/districts/:provinceCode", getDistricts);
router.get("/wards/:districtCode", getWards);
router.get("/address/:provinceCode/:districtCode/:wardCode", getAddressDetail);

export default router;
