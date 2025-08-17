import contractRepository from '../repositories/contractRepository.js';
import Room from '../../../schemas/Room.js';

class ContractController {
  async create(req, res) {
    try {
      const { room, tenant, startDate, endDate, monthlyRent, deposit } = req.body;
      const landlord = req.body.landlord || req.user?.userId;
      if (!room || !tenant || !startDate || !endDate || !monthlyRent || !deposit) {
        return res.status(400).json({ success:false, message:'Missing required fields' });
      }
      if (landlord) {
        const roomDoc = await Room.findById(room).select('owner');
        if (!roomDoc) return res.status(404).json({ success:false, message:'Room not found' });
        if (roomDoc.owner && roomDoc.owner.toString() !== landlord.toString() && req.user?.role !== 'admin') {
          return res.status(403).json({ success:false, message:'Not owner of room' });
        }
      }
      const data = { ...req.body, landlord, status: 'active' };
      const created = await contractRepository.create(data);
      return res.status(201).json({ success:true, data: created });
    } catch (e) {
      return res.status(500).json({ success:false, message:e.message });
    }
  }

  async list(req, res) {
    try {
      const { page=1, limit=12, status, search } = req.query;
      const landlord = req.query.landlord || req.user?.userId;
      const data = await contractRepository.list({ page:Number(page), limit:Number(limit), status, search, landlord });
      return res.json({ success:true, data });
    } catch (e) {
      return res.status(500).json({ success:false, message:e.message });
    }
  }

  async get(req, res) {
    try {
      const { id } = req.params;
      const contract = await contractRepository.findById(id);
      if (!contract) return res.status(404).json({ success:false, message:'Not found' });
      if (req.user?.role === 'landlord' && contract.landlord && contract.landlord._id.toString() !== req.user.userId) {
        return res.status(403).json({ success:false, message:'Forbidden' });
      }
      return res.json({ success:true, data: contract });
    } catch (e) {
      return res.status(500).json({ success:false, message:e.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const existing = await contractRepository.findById(id);
      if (!existing) return res.status(404).json({ success:false, message:'Not found' });
      if (req.user?.role === 'landlord' && existing.landlord && existing.landlord._id.toString() !== req.user.userId) {
        return res.status(403).json({ success:false, message:'Forbidden' });
      }
      const { landlord, ...rest } = req.body;
      const updated = await contractRepository.update(id, rest);
      return res.json({ success:true, data: updated });
    } catch (e) {
      return res.status(500).json({ success:false, message:e.message });
    }
  }

  async terminate(req, res) {
    try {
      const { id } = req.params;
      const existing = await contractRepository.findById(id);
      if (!existing) return res.status(404).json({ success:false, message:'Not found' });
      if (existing.status === 'terminated') return res.json({ success:true, data: existing });
      if (req.user?.role === 'landlord' && existing.landlord && existing.landlord._id.toString() !== req.user.userId) {
        return res.status(403).json({ success:false, message:'Forbidden' });
      }
      const updated = await contractRepository.update(id, { status:'terminated', notes: req.body?.reason ? (existing.notes ? existing.notes + '\nTerminate: '+req.body.reason : 'Terminate: '+req.body.reason) : existing.notes });
      return res.json({ success:true, data: updated });
    } catch (e) {
      return res.status(500).json({ success:false, message:e.message });
    }
  }
}

export default new ContractController();
