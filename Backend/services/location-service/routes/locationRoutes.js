import express from "express";
import { 
  getProvinces,
  getDistricts,
  getWards,
  getAddressDetail,
  geocodeAddress
} from "../controllers/locationController.js";

const router = express.Router();


// Address data routes
router.get("/provinces", getProvinces);
router.get("/provinces/:provinceCode/districts", getDistricts);
router.get("/districts/:districtCode/wards", getWards);
router.get("/address-detail/:provinceCode/:districtCode/:wardCode", getAddressDetail);
router.post("/geocode", geocodeAddress);


export default router;
