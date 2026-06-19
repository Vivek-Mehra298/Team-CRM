"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orgController_1 = require("../controllers/orgController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public diagnostic endpoint
router.get('/smtp-test', orgController_1.testSmtp);
router.use(auth_1.authenticateJWT);
router.get('/', orgController_1.getOrganizationDetails);
router.put('/', (0, auth_1.requireRoles)(['leader']), orgController_1.updateOrganizationDetails);
router.get('/members', orgController_1.getMembers);
router.post('/invite', (0, auth_1.requireRoles)(['leader', 'manager']), orgController_1.inviteMember);
router.patch('/members/:memberId/role', (0, auth_1.requireRoles)(['leader']), orgController_1.changeRole);
router.delete('/members/:memberId', (0, auth_1.requireRoles)(['leader']), orgController_1.removeMember);
exports.default = router;
