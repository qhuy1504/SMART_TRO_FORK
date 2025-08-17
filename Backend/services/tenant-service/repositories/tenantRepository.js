import Tenant from '../../../schemas/Tenant.js';
import Room from '../../../schemas/Room.js';

class TenantRepository {
  async create(data) { return Tenant.create(data); }
  async findById(id) { return Tenant.findById(id).populate('room landlord'); }
  async update(id, data) { return Tenant.findByIdAndUpdate(id, data, { new:true }).populate('room landlord'); }
  async softDelete(id) { return Tenant.findByIdAndUpdate(id, { isArchived:true }, { new:true }); }
  async list({ page=1, limit=10, landlord, room, status, search }) {
    const query = { isArchived:false };
    if (landlord) query.landlord = landlord;
    if (room) query.room = room;
    if (status) query.status = status;
    if (search) {
      query.$or = [{ notes: { $regex: search, $options: 'i' } }];
    }
    const skip = (page-1)*limit;
    const [items, total] = await Promise.all([
  Tenant.find(query).populate('room landlord').sort({ createdAt:-1 }).skip(skip).limit(limit),
      Tenant.countDocuments(query)
    ]);
    return { items, pagination:{ page:Number(page), pages: Math.ceil(total/limit)||1, total } };
  }
  async addPayment(id, payment) {
    return Tenant.findByIdAndUpdate(id, { $push: { payments: payment } }, { new:true });
  }
  async endLease(id, date=new Date()) {
    return Tenant.findByIdAndUpdate(id, { status:'ended', leaseEnd: date }, { new:true });
  }
  async activeCountByLandlord(landlord) {
    return Tenant.countDocuments({ landlord, status:'active', isArchived:false });
  }
  async ensureRoomOwnership(roomId, landlordId) {
    const room = await Room.findById(roomId);
    return room && room.owner && room.owner.toString() === landlordId.toString();
  }
}

export default new TenantRepository();
