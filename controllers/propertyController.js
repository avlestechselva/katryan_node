const axios = require('axios');
const xml2js = require('xml2js');
const Property = require('../models/Property');
const PropertyImage = require('../models/PropertyImage');

const JUPIX_URL = process.env.JUPIX_URL ||
  'http://services.jupix.co.uk/api/get_properties.php?clientID=adab4a728ed156515add33fbf42faf1e&passphrase=acba227fa9004c506c010ab5ccb464b3';

function flattenXmlValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (Array.isArray(v)) return v.length === 1 ? flattenXmlValue(v[0]) : v.map(flattenXmlValue);
  if (typeof v === 'object' && '_' in v) return v._;
  if (typeof v === 'object' && Object.keys(v).length === 0) return null;
  return v;
}

function extractImages(node) {
  if (!node) return [];
  const arr = Array.isArray(node) ? node : [node];
  return arr.map(item => {
    if (typeof item === 'string') return item;
    if (item && item._) return item._;
    return null;
  }).filter(Boolean);
}

exports.index = async (req, res) => {
  const currentPage = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (currentPage - 1) * limit;
  const total = await Property.countDocuments();
  const properties = await Property.find().sort({ propertyID: -1 }).skip(skip).limit(limit);
  const totalPages = Math.ceil(total / limit);
  res.render('admin/property/index', {
    layout: 'layout/admin',
    page: 'property',
    properties,
    currentPage,
    totalPages,
  });
};

exports.search = async (req, res) => {
  const q = req.query.keyword || '';
  const currentPage = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (currentPage - 1) * limit;
  const filter = {
    $or: [
      { propertyID: new RegExp(q, 'i') },
      { addressPostcode: new RegExp(q, 'i') },
    ],
  };
  const total = await Property.countDocuments(filter);
  const properties = await Property.find(filter).skip(skip).limit(limit);
  const totalPages = Math.ceil(total / limit);
  res.render('admin/property/search', {
    layout: 'layout/admin',
    page: 'property',
    properties,
    currentPage,
    totalPages,
    keyword: q,
  });
};

exports.store = async (req, res) => {
  try {
    const response = await axios.get(JUPIX_URL, { timeout: 60000 });
    const parser = new xml2js.Parser({ explicitArray: true, trim: true });
    const result = await parser.parseStringPromise(response.data);

    const propertiesRaw = result.properties.property || [];
    const propertyIDArr = propertiesRaw.map(p => flattenXmlValue(p.propertyID));

    await Property.deleteMany({ propertyID: { $nin: propertyIDArr } });
    await PropertyImage.deleteMany({ propertyid: { $nin: propertyIDArr } });

    for (const raw of propertiesRaw) {
      const pID = flattenXmlValue(raw.propertyID);
      if (!pID) continue;

      const doc = {};
      for (const key of Object.keys(raw)) {
        if (key === 'images' || key === 'floorplans' || key === 'epcGraphs' || key === 'brochures') continue;
        doc[key] = flattenXmlValue(raw[key]);
      }

      const isNew = (await Property.countDocuments({ propertyID: pID })) === 0;

      await Property.findOneAndUpdate(
        { propertyID: pID },
        { $set: doc },
        { upsert: true, new: true }
      );

      if (isNew) {
        const imgNodes = raw.images && raw.images[0] && raw.images[0].image
          ? extractImages(raw.images[0].image) : [];
        for (const url of imgNodes) {
          await PropertyImage.create({ propertyid: pID, img_url: url, image_type: 'display_img' });
        }

        const fpNodes = raw.floorplans && raw.floorplans[0] && raw.floorplans[0].floorplan
          ? extractImages(raw.floorplans[0].floorplan) : [];
        for (const url of fpNodes) {
          await PropertyImage.create({ propertyid: pID, img_url: url, image_type: 'floorplan' });
        }

        const epcNodes = raw.epcGraphs && raw.epcGraphs[0] && raw.epcGraphs[0].epcGraph
          ? extractImages(raw.epcGraphs[0].epcGraph) : [];
        for (const url of epcNodes) {
          await PropertyImage.create({ propertyid: pID, img_url: url, image_type: 'epcGraph' });
        }
      }
    }

    if (req.method === 'POST') {
      return res.redirect('/admin/properties?success=' + encodeURIComponent('Property data updated'));
    }
    res.redirect('/admin/properties');
  } catch (e) {
    console.error('Property sync error:', e.message);
    res.redirect('/admin/properties?error=' + encodeURIComponent('Failed to sync: ' + e.message));
  }
};

exports.show = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) return res.redirect('/admin/properties?error=' + encodeURIComponent('Property not found'));
  const displayImages = await PropertyImage.find({ propertyid: property.propertyID, image_type: 'display_img' });
  const floorImages = await PropertyImage.find({ propertyid: property.propertyID, image_type: 'floorplan' });
  res.render('admin/property/view', {
    layout: 'layout/admin',
    page: 'property',
    property,
    displayImages,
    floorImages,
  });
};
