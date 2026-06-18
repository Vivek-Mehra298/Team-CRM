"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateJWT);
router.use(tenant_1.orgIsolation);
router.post('/', customerController_1.createCustomer);
router.get('/', customerController_1.getCustomers);
router.get('/:id', customerController_1.getCustomerById);
router.patch('/:id', customerController_1.updateCustomer);
router.delete('/:id', customerController_1.deleteCustomer);
// File attachments
router.post('/:id/files', upload_1.upload.single('file'), customerController_1.attachFile);
router.delete('/:customerId/files/:fileId', customerController_1.deleteFile);
exports.default = router;
