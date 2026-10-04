const Property = require('../models/Property');
const PropertyImage = require('../models/PropertyImage');
const Slider = require('../models/Slider');
const Contact = require('../models/Contact');
const RegisterUser = require('../models/RegisterUser');
const Message = require('../models/Message');
const { sendMail } = require('../config/mailer');

const CONTACT_EMAIL = process.env.MAIL_TO || 'info@katryan.co.uk';

function paginate(query, page, limit) {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
}

exports.index = async (req, res) => {
  try {
    const sliders = await Slider.find({ status: 1 }).sort({ pos: 1 });
    res.render('pages/index', { layout: 'layout/app', sliders });
  } catch (e) {
    console.error(e);
    res.render('pages/index', { layout: 'layout/app', sliders: [] });
  }
};

exports.registerPage = (req, res) => {
  res.render('pages/register', { layout: 'layout/app' });
};

exports.servicePage = (req, res) => {
  res.render('pages/services', { layout: 'layout/app' });
};

exports.commercialPage = (req, res) => {
  res.render('pages/commercial', { layout: 'layout/app' });
};

exports.showSaleSearch = (req, res) => {
  res.render('pages/sales-search', { layout: 'layout/app' });
};

exports.showLetSearch = (req, res) => {
  res.render('pages/letting-search', { layout: 'layout/app' });
};

exports.showPrivacy = (req, res) => {
  res.render('pages/privacy', { layout: 'layout/app' });
};

exports.complianceProcedure = (req, res) => {
  res.render('pages/compliance', { layout: 'layout/app' });
};

exports.clientMoneyHandling = (req, res) => {
  res.render('pages/client-money', { layout: 'layout/app' });
};

exports.bourneTerrace = (req, res) => {
  res.render('pages/bourne-terrace', { layout: 'layout/app' });
};

exports.showProList = async (req, res) => {
  try {
    const type = req.params.type.charAt(0).toUpperCase() + req.params.type.slice(1).toLowerCase();
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    let filter = { department: type };
    if (type === 'Lettings') {
      filter.availability = { $ne: 5 };
    }

    const total = await Property.countDocuments(filter);
    const properties = await Property.find(filter).sort({ _id: -1 }).skip(skip).limit(limit);

    const propIds = properties.map(p => p.propertyID);
    const images = await PropertyImage.find({ propertyid: { $in: propIds }, image_type: 'display_img' }).sort({ _id: 1 });
    const imgMap = {};
    images.forEach(img => {
      if (!imgMap[img.propertyid]) imgMap[img.propertyid] = img.img_url;
    });
    properties.forEach(p => { p._imgUrl = imgMap[p.propertyID] || null; });

    const totalPages = Math.ceil(total / limit);
    res.render('pages/property-list', {
      layout: 'layout/app',
      properties,
      page,
      totalPages,
      type,
    });
  } catch (e) {
    console.error(e);
    res.redirect('/?error=' + encodeURIComponent('Error loading properties'));
  }
};

exports.showProSingle = async (req, res) => {
  try {
    const property = await Property.findOne({ propertyID: req.params.id });
    if (!property) return res.redirect('/?error=' + encodeURIComponent('Property not found'));
    const displayImages = await PropertyImage.find({ propertyid: req.params.id, image_type: 'display_img' }).sort({ _id: 1 });
    const floorplans = await PropertyImage.find({ propertyid: req.params.id, image_type: 'floorplan' }).sort({ _id: 1 });
    const contactDetail = await Contact.findOne() || {};
    res.render('pages/property-single', {
      layout: 'layout/app',
      property,
      displayImages,
      floorplans,
      contactDetail,
    });
  } catch (e) {
    console.error(e);
    res.redirect('/?error=' + encodeURIComponent('Error loading property'));
  }
};

exports.contactPage = async (req, res) => {
  const contactDetail = await Contact.findOne() || {};
  res.render('pages/contact', { layout: 'layout/app', contactDetail });
};

exports.storeContact = async (req, res) => {
  const { email, fst_name, lst_name, phone, title, contact_type, message } = req.body;
  if (!email || !fst_name || !lst_name || !phone) {
    return res.redirect('/contact?error=' + encodeURIComponent('Please fill all required fields'));
  }
  if (!req.body.privacy) {
    return res.redirect('/contact?error=' + encodeURIComponent('Please accept our privacy policy in order to continue!!'));
  }
  try {
    const privacy_acc = 'Yes';
    const mar = req.body.marketing ? 'Yes' : 'No';
    await Message.create({ title, fst_name, lst_name, email, phone, contact_type, message });

    const html = `<html><body>
      <h3>Katryan Contact form Message</h3>
      <strong>Message from ${title} ${fst_name} ${lst_name} (${email})<br>Preferred contact method: ${contact_type}</strong>
      <hr><strong>First Name:</strong> ${fst_name}
      <hr><strong>Surname:</strong> ${lst_name}
      <hr><strong>Email:</strong> ${email}
      <hr><strong>Phone:</strong> ${phone}
      <hr><strong>Message:</strong> ${message}
      <hr><strong>Privacy: ${privacy_acc}</strong><br><strong>Marketing: ${mar}</strong>
      </body></html>`;

    await sendMail({ to: CONTACT_EMAIL, subject: 'From Contact Us Page', html });
    res.redirect('/contact?success=' + encodeURIComponent('We will be contacting you shortly!'));
  } catch (e) {
    console.error(e);
    res.redirect('/contact?error=' + encodeURIComponent('Something went wrong! Try again later!'));
  }
};

exports.searchProperties = async (req, res) => {
  try {
    const type = req.params.type.charAt(0).toUpperCase() + req.params.type.slice(1).toLowerCase();
    const { priceLow, priceHigh, beds, area, postcode, orderBy, perPage } = req.query;
    const limit = parseInt(perPage) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = { department: type };

    if (priceLow) {
      if (type === 'Sales') filter.price = { ...filter.price, $gte: Number(priceLow) };
      else if (type === 'Lettings') filter.rent = { ...filter.rent, $gte: Number(priceLow) };
    }
    if (priceHigh) {
      if (type === 'Sales') filter.price = { ...filter.price, $lte: Number(priceHigh) };
      else if (type === 'Lettings') filter.rent = { ...filter.rent, $lte: Number(priceHigh) };
    }
    if (beds) {
      if (beds === '5+') filter.propertyBedrooms = { $gt: 5 };
      else if (beds === '0') filter.propertyStyle = 20;
      else filter.propertyBedrooms = Number(beds);
    }
    if (area) filter.address4 = area;
    if (postcode) filter.addressPostcode = postcode;

    let sortObj = { _id: -1 };
    if (orderBy) {
      switch (orderBy) {
        case 'PriceAsk': sortObj = type === 'Sales' ? { price: 1 } : { rent: 1 }; break;
        case 'PriceAskd': sortObj = type === 'Sales' ? { price: -1 } : { rent: -1 }; break;
        case 'Postcode': sortObj = { addressPostcode: 1 }; break;
        case 'Address4': sortObj = { address4: 1 }; break;
        case 'PropBedr': sortObj = { propertyBedrooms: 1 }; break;
        case 'PropBedrd': sortObj = { propertyBedrooms: -1 }; break;
      }
    }

    const total = await Property.countDocuments(filter);
    const properties = await Property.find(filter).sort(sortObj).skip(skip).limit(limit);

    const propIds = properties.map(p => p.propertyID);
    const images = await PropertyImage.find({ propertyid: { $in: propIds }, image_type: 'display_img' }).sort({ _id: 1 });
    const imgMap = {};
    images.forEach(img => { if (!imgMap[img.propertyid]) imgMap[img.propertyid] = img.img_url; });
    properties.forEach(p => { p._imgUrl = imgMap[p.propertyID] || null; });

    const totalPages = Math.ceil(total / limit);
    res.render('pages/property-list', {
      layout: 'layout/app',
      properties,
      page,
      totalPages,
      type,
    });
  } catch (e) {
    console.error(e);
    res.redirect('/?error=' + encodeURIComponent('Error searching properties'));
  }
};

exports.registerUser = async (req, res) => {
  const { email, fst_name, lst_name, phone_day } = req.body;
  if (!email || !fst_name || !lst_name || !phone_day) {
    return res.redirect('/register-with-us?error=' + encodeURIComponent('Please fill all required fields'));
  }
  if (!req.body.privacy) {
    return res.redirect('/register-with-us?error=' + encodeURIComponent('Please accept our privacy policy in order to continue!!'));
  }
  try {
    const privacy_acc = 'Yes';
    const mar = req.body.marketing ? 'Yes' : 'No';

    const spec_req = Array.isArray(req.body.spec_req) ? req.body.spec_req.join(', ') : (req.body.spec_req || 'N/A');
    const data = { ...req.body };
    delete data.privacy;
    delete data.marketing;
    if (Array.isArray(req.body.spec_req)) data.spec_req = JSON.stringify(req.body.spec_req);

    await RegisterUser.create(data);

    const f = (v) => v || 'N/A';
    const html = `<html><head><title>${fst_name}</title></head><body style="background-color:#f2f2f2;">
      <h2 style="color:#1e2e67;">New Customer Registered!</h2>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Name</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.title)} ${fst_name} ${lst_name}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Email</td><td style="border-bottom:1px solid #ddd;height:50px;">${email}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Phone No. (Day)</td><td style="border-bottom:1px solid #ddd;height:50px;">${phone_day}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Phone No. (Evening)</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.phone_eve)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Phone No. (Mobile)</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.phone_mob)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Area(s)</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.areas)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Property For</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.property_for)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Budget</td><td style="border-bottom:1px solid #ddd;height:50px;">From £${f(req.body.min_amount)} to £${f(req.body.max_amount)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Bedrooms</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.bedrooms)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Type of property</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.property_type)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Required from date</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.req_frm_date)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Specific Requirements</td><td style="border-bottom:1px solid #ddd;height:50px;">${spec_req}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Heard By</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.known_by)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Occupation/Business</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.occupation)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Living status/Let Type</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.living_status)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Current position</td><td style="border-bottom:1px solid #ddd;height:50px;">${f(req.body.current_position)}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Buying to let</td><td style="border-bottom:1px solid #ddd;height:50px;">${req.body.is_buy_for_sell == 1 ? 'Yes' : 'No'}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Subscribe</td><td style="border-bottom:1px solid #ddd;height:50px;">${req.body.is_subscribed == 1 ? 'Yes' : 'No'}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Valuation</td><td style="border-bottom:1px solid #ddd;height:50px;">${req.body.like_valuation == 1 ? 'Yes' : 'No'}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Privacy</td><td style="border-bottom:1px solid #ddd;height:50px;">${privacy_acc}</td></tr>
        <tr><td style="border-bottom:1px solid #ddd;height:50px;font-weight:bold;color:#1e2e67;">Marketing</td><td style="border-bottom:1px solid #ddd;height:50px;">${mar}</td></tr>
      </table></body></html>`;

    await sendMail({ to: CONTACT_EMAIL, subject: 'New Customer Registered!!', html });
    res.redirect('/register-with-us?success=' + encodeURIComponent('Registered successfully'));
  } catch (e) {
    console.error(e);
    res.redirect('/register-with-us?error=' + encodeURIComponent('Something went wrong!'));
  }
};
