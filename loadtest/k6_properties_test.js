import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Đọc CSV 1 lần, share cho tất cả VUs
const csv = open('./properties.csv');

const data = new SharedArray('properties', function () {
  return csv
    .trim()
    .split('\n')
    .slice(1) // bỏ header
    .map(line => {
      const cols = line.split(',');

      return {
        title: cols[0],
        category: cols[1],
        contactName: cols[2],
        contactPhone: cols[3],
        description: cols[4],

        rentPrice: Number(cols[5]) || 0,
        promotionPrice: Number(cols[6]) || 0,
        deposit: Number(cols[7]) || 0,
        area: Number(cols[8]) || 0,

        electricPrice: Number(cols[9]) || 0,
        waterPrice: Number(cols[10]) || 0,

        maxOccupants: cols[11],

        province: cols[12],
        ward: cols[13],
        detailAddress: cols[14],

        status: cols[15],
        approvalStatus: cols[16],
      };
    });
});

export const options = {
  vus: 50,
  iterations: 50,
  thresholds: {
    'http_req_duration': ['p(95)<3000'],
    'http_req_failed': ['rate<0.02'],
  },
};

export default function () {
  // Rải request trong 60s
  sleep(Math.random() * 60);

  const idx = (__VU - 1) % data.length;
  const row = data[idx];

  const baseUrl =
    __ENV.BASE_URL ||
    'https://smart-tro-backend-468987037048.asia-southeast1.run.app';

  const url = `${baseUrl}/api/properties`;

  // ====== Dùng postType & amenities giống property hợp lệ ======
  const postTypeId = __ENV.POST_TYPE_ID || '6923e7a57369a8438d83148f';
  const amenityId = __ENV.AMENITY_ID || '692309cbf6ba23b722a5bddb';

  // ====== Tải ảnh từ S3 (raw binary) ======
  const imgRes = http.get(
    'https://s3tranquochuy.s3.ap-southeast-1.amazonaws.com/images/1764523817421_1.jpg',
    { responseType: 'binary' }
  );

  // ====== multipart/form-data (KHÔNG set Content-Type) ======
  const formData = {
    // Các field text từ CSV
    title: row.title,
    category: row.category,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    description: row.description,

    rentPrice: row.rentPrice,
    promotionPrice: row.promotionPrice,
    deposit: row.deposit,
    area: row.area,

    electricPrice: row.electricPrice,
    waterPrice: row.waterPrice,

    maxOccupants: row.maxOccupants,

    province: row.province,
    ward: row.ward,
    detailAddress: row.detailAddress,

    status: row.status,
    approvalStatus: row.approvalStatus,

    // ====== Các field bắt buộc khác ======
    // giống property mẫu bạn đưa
    timeRules: 'Tự do',
    houseRules: JSON.stringify(['no_smoking']),
    amenities: JSON.stringify([amenityId]),
    coordinates: JSON.stringify({
      lat: 10.8357017,
      lng: 106.6864542,
    }),

    // Loại tin đăng
    postType: postTypeId,

    // Ảnh
    images: http.file(imgRes.body, '1764523817421_1.jpg', 'image/jpeg'),
  };

  const headers = {};
  if (__ENV.TOKEN) {
    headers['Authorization'] = __ENV.TOKEN;
  }

  const params = {
    headers,
    tags: { test: 'properties-bulk' },
  };

  const res = http.post(url, formData, params);

  const ok = check(res, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
  });

  if (!ok) {
    console.log('STATUS:', res.status);
    console.log('BODY:', res.body);
    console.log('POST_TYPE_ID from env:', __ENV.POST_TYPE_ID);
  }
}
