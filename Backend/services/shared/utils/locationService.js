import axios from "axios";

export const fetchProvinces = async () => {
  const res = await axios.get("https://provinces.open-api.vn/api/p/");
  return res.data;
};

export const fetchDistricts = async (provinceCode) => {
  const res = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
  return res.data.districts;
};

export const fetchWards = async (districtCode) => {
  const res = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
  return res.data.wards;
};

export const fetchAddressDetail = async (provinceCode, districtCode, wardCode) => {
  const [provinceRes, districtRes, wardRes] = await Promise.all([
    axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}`),
    axios.get(`https://provinces.open-api.vn/api/d/${districtCode}`),
    axios.get(`https://provinces.open-api.vn/api/w/${wardCode}`)
  ]);
  
  return {
    province: provinceRes.data,
    district: districtRes.data,
    ward: wardRes.data
  };
};
