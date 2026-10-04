const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const { ensureAuth, ensureGuest } = require('../middleware/auth');

const authController = require('../controllers/authController');
const homeController = require('../controllers/homeController');
const propertyController = require('../controllers/propertyController');
const adminController = require('../controllers/adminController');
const sliderController = require('../controllers/sliderController');

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// Public routes
router.get('/', homeController.index);
router.get('/home', homeController.index);
router.get('/register-with-us', homeController.registerPage);
router.get('/services-fees', homeController.servicePage);
router.get('/commercial', homeController.commercialPage);
router.get('/Bourne-Terrace-London-W2-5TH', homeController.bourneTerrace);
router.get('/contact', homeController.contactPage);
router.post('/contact/store', homeController.storeContact);
router.get('/privacy', homeController.showPrivacy);
router.get('/compliance-procedure', homeController.complianceProcedure);
router.get('/client-money-handling', homeController.clientMoneyHandling);
router.post('/register/user', homeController.registerUser);
router.get('/search/sales', homeController.showSaleSearch);
router.get('/search/lettings', homeController.showLetSearch);
router.get('/search/:type/results', homeController.searchProperties);
router.get('/propery/:type/list', homeController.showProList);
router.get('/propery/:id', homeController.showProSingle);

// XML property feed (public endpoint)
router.get('/obtain_input', propertyController.store);

// Admin auth
router.get('/admin/login', ensureGuest, authController.getLogin);
router.post('/admin/login', ensureGuest, loginLimiter, authController.postLogin);
router.post('/admin/logout', ensureAuth, authController.logout);

// Admin protected routes
router.get('/admin', ensureAuth, adminController.index);
router.post('/admin/contact/update/:id', ensureAuth, adminController.updateContact);
router.get('/admin/users', ensureAuth, adminController.userList);
router.get('/admin/users/messages', ensureAuth, adminController.messageList);
router.get('/admin/users/:id', ensureAuth, adminController.userView);

router.get('/admin/slider', ensureAuth, sliderController.index);
router.post('/admin/slider/add', ensureAuth, sliderController.store);
router.post('/admin/slider/update/:id', ensureAuth, sliderController.update);

router.get('/admin/properties', ensureAuth, propertyController.index);
router.get('/admin/properties/search', ensureAuth, propertyController.search);
router.post('/admin/properties/store', ensureAuth, propertyController.store);
router.get('/admin/properties/view/:id', ensureAuth, propertyController.show);

module.exports = router;
