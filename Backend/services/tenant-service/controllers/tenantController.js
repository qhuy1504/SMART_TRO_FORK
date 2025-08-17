import tenantRepository from '../repositories/tenantRepository.js';
import Room from '../../../schemas/Room.js';

class TenantController {
  async create(req,res){
    try {
      const { user, room, leaseStart, leaseEnd, rentPrice, deposit, notes } = req.body;
      const landlord = req.body.landlord || req.user?.userId || req.body.owner;
      if (!user || !room || !leaseStart || !rentPrice) return res.status(400).json({ success:false, message:'Missing required fields' });
      if (landlord) {
        const ok = await tenantRepository.ensureRoomOwnership(room, landlord);
        if (!ok) return res.status(403).json({ success:false, message:'Room not owned by landlord' });
      }
      const tenant = await tenantRepository.create({ user, room, landlord, leaseStart, leaseEnd, rentPrice, deposit, notes });
      await Room.findByIdAndUpdate(room, { status:'rented', tenant: user, leaseStart, leaseEnd });
      res.status(201).json({ success:true, data: tenant });
    } catch(e){
      if (e.code===11000) return res.status(409).json({ success:false, message:'Duplicate tenant contract' });
      res.status(500).json({ success:false, message:e.message });
    }
  }
  async list(req,res){
    try {
      const { page=1, limit=10, status, room, search } = req.query;
      const landlord = req.query.landlord || req.user?.userId;
      const data = await tenantRepository.list({ page:Number(page), limit:Number(limit), landlord, room, status, search });
      res.json({ success:true, data });
    } catch(e){ res.status(500).json({ success:false, message:e.message }); }
  }
  async get(req,res){
    try { const t = await tenantRepository.findById(req.params.id); if(!t) return res.status(404).json({success:false,message:'Not found'}); res.json({success:true,data:t}); }
    catch(e){ res.status(500).json({ success:false, message:e.message }); }
  }
  async update(req,res){
    try { const t = await tenantRepository.update(req.params.id, req.body); if(!t) return res.status(404).json({success:false,message:'Not found'}); res.json({success:true,data:t}); }
    catch(e){ res.status(500).json({ success:false, message:e.message }); }
  }
  async addPayment(req,res){
    try { const { amount, method, note } = req.body; if(!amount) return res.status(400).json({success:false,message:'Amount required'}); const t = await tenantRepository.addPayment(req.params.id, { amount, method, note }); res.json({success:true,data:t}); }
    catch(e){ res.status(500).json({ success:false, message:e.message }); }
  }
  async endLease(req,res){
    try { const t = await tenantRepository.endLease(req.params.id); if(!t) return res.status(404).json({success:false,message:'Not found'}); await Room.findByIdAndUpdate(t.room, { status:'available', tenant:null }); res.json({success:true,data:t}); }
    catch(e){ res.status(500).json({ success:false, message:e.message }); }
  }
  async archive(req,res){
    try { const t = await tenantRepository.softDelete(req.params.id); if(!t) return res.status(404).json({success:false,message:'Not found'}); res.json({success:true,data:t}); }
    catch(e){ res.status(500).json({ success:false, message:e.message }); }
  }
}

export default new TenantController();
