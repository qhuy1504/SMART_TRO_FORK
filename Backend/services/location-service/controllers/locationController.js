import axios from "axios";

export const getProvinces = async (req, res) => {
  try {
    const response = await axios.get("https://provinces.open-api.vn/api/p/");
    // console.log("Provinces data:", response.data);
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách tỉnh thành" });
  }
};

export const getDistricts = async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const response = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
    res.status(200).json({ success: true, data: response.data.districts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách quận huyện" });
  }
};

export const getWards = async (req, res) => {
  try {
    const { districtCode } = req.params;
    const response = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    res.status(200).json({ success: true, data: response.data.wards });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách phường xã" });
  }
};
export const getAddressDetail = async (req, res) => {
  try {
    const { provinceCode, districtCode, wardCode } = req.params;
    const provinceResponse = await axios.get(`https://provinces.open-api.vn/api/p/${provinceCode}`);
    const districtResponse = await axios.get(`https://provinces.open-api.vn/api/d/${districtCode}`);
    const wardResponse = await axios.get(`https://provinces.open-api.vn/api/w/${wardCode}`);

    if (!provinceResponse.data || !districtResponse.data || !wardResponse.data) {
      return res.status(404).json({ success: false, message: "Không tìm thấy địa chỉ" });
    }

    const addressDetail = {
      province: provinceResponse.data,
      district: districtResponse.data,
      ward: wardResponse.data
    };

    res.status(200).json({ success: true, data: addressDetail });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi lấy thông tin chi tiết địa chỉ" });
  }
};
