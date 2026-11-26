import type { Request, Response } from 'express';
import { Service } from '../models/service.model';
import { asyncHandler } from '../lib/AsyncHandler';
import { getOwnerId } from './client.controllers';



export const getAllServices = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const search = req.query.search as string;
  const activeOnly = req.query.activeOnly === 'true';

  let query: any = { adminId };
  if (search && search.trim()) {
    query.name = { $regex: search.trim(), $options: 'i' };
  }
  if (activeOnly) {
    query.status = { $ne: false };
  }

  const services = await Service.find(query).sort({ order: 1, createdAt: 1 });

  const data = activeOnly
    ? services.map((s) => {
        const doc = s.toObject ? s.toObject() : { ...s };
        doc.variations = (doc.variations || []).filter((v: any) => v.status !== false);
        return doc;
      })
    : services;

  res.status(200).json({
    success: true,
    data,
  });
});

export const getServiceById = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const service = await Service.findOne({ _id: req.params.id, adminId });

  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  res.status(200).json({ success: true, data: service });
});

export const createService = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const { name, categoryType, sacCode, tax, description, promote, status, variations } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Service name is required' });
  }

  const highestOrderService = await Service.findOne({ adminId }).sort({ order: -1 });
  const nextOrder = (highestOrderService?.order || 0) + 1;

  const service = await Service.create({
    name: name.trim(),
    categoryType: categoryType || 'brand',
    sacCode: sacCode || '',
    tax: tax !== undefined ? tax : 'No tax',
    description: description || '',
    promote: promote !== undefined ? promote : true,
    status: status !== undefined ? status : true,
    order: nextOrder,
    variations: variations || [],
    adminId,
  });

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: service,
  });
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const { name, categoryType, sacCode, tax, description, promote, status, variations, order } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name.trim();
  if (categoryType !== undefined) updateData.categoryType = categoryType;
  if (sacCode !== undefined) updateData.sacCode = sacCode;
  if (tax !== undefined) updateData.tax = tax;
  if (description !== undefined) updateData.description = description;
  if (promote !== undefined) updateData.promote = promote;
  if (status !== undefined) updateData.status = status;
  if (variations !== undefined) updateData.variations = variations;
  if (order !== undefined) updateData.order = order;

  const service = await Service.findOneAndUpdate(
    { _id: req.params.id, adminId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Service updated successfully',
    data: service,
  });
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const service = await Service.findOneAndDelete({ _id: req.params.id, adminId });

  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Service deleted successfully',
  });
});

export const togglePromote = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const service = await Service.findOne({ _id: req.params.id, adminId });

  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  service.promote = !service.promote;
  await service.save();

  res.status(200).json({
    success: true,
    message: `Service promotion turned ${service.promote ? 'On' : 'Off'}`,
    data: service,
  });
});

export const toggleStatus = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const service = await Service.findOne({ _id: req.params.id, adminId });

  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  service.status = !service.status;
  await service.save();

  res.status(200).json({
    success: true,
    message: `Service status set to ${service.status ? 'Active' : 'Inactive'}`,
    data: service,
  });
});

export const addVariation = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const {
    name,
    duration,
    price,
    sessions,
    sacCode,
    description,
    status,
    serviceType,
    timeHours,
    timeMinutes,
    daysPerWeek,
    months,
    validityInDays,
    maxMembers,
    tax,
    accessType,
    category,
    otpVerification,
    upgradable,
    transferable,
    appointmentsApplicable,
    allowFreeze,
    maxFreezeDays,
    minFreezeDays,
    registrationFee,
    minFeeLimit,
    maxFeeLimit,
    eligibleForReferralBonus,
    referralBonusFromPurchase,
    termBatchDate,
    promoteOnWebsite,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Variation name is required' });
  }

  const service = await Service.findOne({ _id: req.params.id, adminId });
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  if (service.status === false) {
    return res.status(400).json({ success: false, message: 'Cannot add variation to a disabled service. Activate the service first.' });
  }

  const newVariation = {
    name: name.trim(),
    duration: duration || '',
    price: Number(price) || 0,
    sessions: sessions || 'NaN',
    sacCode: sacCode || '',
    description: description || '',
    status: status !== undefined ? status : true,
    serviceType: serviceType || '',
    timeHours: timeHours !== undefined ? Number(timeHours) : 0,
    timeMinutes: timeMinutes !== undefined ? Number(timeMinutes) : 15,
    daysPerWeek: daysPerWeek || '1 Day Per week',
    months: months !== undefined ? Number(months) : 1,
    validityInDays: validityInDays !== undefined ? Number(validityInDays) : 1,
    maxMembers: maxMembers !== undefined ? Number(maxMembers) : 1,
    tax: tax || 'No Tax',
    accessType: accessType || 'Individual',
    category: category || 'General Membership',
    otpVerification: otpVerification === true || otpVerification === 'true' || otpVerification === 'Yes',
    upgradable: upgradable !== false && upgradable !== 'false' && upgradable !== 'No',
    transferable: transferable === true || transferable === 'true' || transferable === 'Yes',
    appointmentsApplicable: appointmentsApplicable === true || appointmentsApplicable === 'true' || appointmentsApplicable === 'Yes',
    allowFreeze: allowFreeze !== false && allowFreeze !== 'false' && allowFreeze !== 'No',
    maxFreezeDays: Number(maxFreezeDays) || 0,
    minFreezeDays: Number(minFreezeDays) || 1,
    registrationFee: registrationFee === true || registrationFee === 'true' || registrationFee === 'Yes',
    minFeeLimit: Number(minFeeLimit) || 0,
    maxFeeLimit: Number(maxFeeLimit) || 0,
    eligibleForReferralBonus: eligibleForReferralBonus === true || eligibleForReferralBonus === 'true' || eligibleForReferralBonus === 'Yes',
    referralBonusFromPurchase: referralBonusFromPurchase === true || referralBonusFromPurchase === 'true' || referralBonusFromPurchase === 'Yes',
    termBatchDate: termBatchDate === true || termBatchDate === 'true' || termBatchDate === 'Yes',
    promoteOnWebsite: promoteOnWebsite === true || promoteOnWebsite === 'true' || promoteOnWebsite === 'Yes',
  };

  service.variations.push(newVariation as any);
  await service.save();

  res.status(201).json({
    success: true,
    message: 'Variation added successfully',
    data: service,
  });
});

export const toggleVariationStatus = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const { id: serviceId, variationId } = req.params;

  const service = await Service.findOne({ _id: serviceId, adminId });
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  if (service.status === false) {
    return res.status(400).json({ success: false, message: 'Cannot modify variation status while the service is disabled.' });
  }

  const variation = (service.variations as any).id(variationId);
  if (!variation) {
    return res.status(404).json({ success: false, message: 'Variation not found' });
  }

  variation.status = !variation.status;
  await service.save();

  res.status(200).json({
    success: true,
    message: `Variation status set to ${variation.status ? 'Active' : 'Inactive'}`,
    data: service,
  });
});

export const deleteVariation = asyncHandler(async (req: Request, res: Response) => {
  const adminId = await getOwnerId(req);
  const { id: serviceId, variationId } = req.params;

  const service = await Service.findOne({ _id: serviceId, adminId });
  if (!service) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }

  service.variations = service.variations.filter(
    (v: any) => v._id.toString() !== variationId
  );
  await service.save();

  res.status(200).json({
    success: true,
    message: 'Variation removed successfully',
    data: service,
  });
});

