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
    // console.log("Districts data:", response.data.districts);
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

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;

// Geocoding với LocationIQ
export const geocodeAddress = async (req, res) => {
  try {
    const { address } = req.body; // Object address
    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Thiếu object address trong request body",
      });
    }

    const { street, ward, district, province, country } = address;
    // console.log("Geocoding request:", { street, ward, district, province, country });

    if (!street && !ward && !district && !province) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đủ thông tin địa chỉ",
      });
    }

    // Gọi structured search API
    const response = await axios.get(
      `https://us1.locationiq.com/v1/search/structured`,
      {
        params: {
          key: LOCATIONIQ_API_KEY,
          street: street || "",
          city: district || "",    // Quận/Huyện
          suburb: ward || "",      // Phường/Xã
          state: province || "",   // Tỉnh/TP
          country: country || "Vietnam",
          format: "json",
          limit: 10,
        },
        timeout: 10000,
      }
    );

    const results = response.data;
    // console.log("Geocoding results:", results);

    if (results && results.length > 0) {
      const best = results.sort((a, b) => b.importance - a.importance)[0];
      const coordinates = {
        lat: parseFloat(best.lat),
        lng: parseFloat(best.lon),
      };

      return res.status(200).json({
        success: true,
        data: {
          coordinates,
          display_name: best.display_name,
          boundingbox: best.boundingbox,
        },
      });
    } else {
      return res.status(200).json({
        success: false,
        message: "Không tìm thấy địa chỉ chính xác",
        data: null,
      });
    }
  } catch (error) {
    console.error("Geocoding error (LocationIQ):", error);

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        message: "Quá nhiều yêu cầu (rate limit), vui lòng thử lại sau",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm địa chỉ",
      data: null,
    });
  }
};


