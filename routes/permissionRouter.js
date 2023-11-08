const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const permissionServices = require('../services/permissionServices');
const permissionRouter = express.Router();

// Get all permissions
permissionRouter.get(
  '/?',
  expressAsyncHandler(async (req, res) => {
    const result = await permissionServices.getByRole();
    if (result.length !== 0) {
      return res.status(200).send({ msg: 'Permissions', data: result });
    } else {
      return res.status(400).send({ msg: 'Data Not Found' });
    }
  })
);

// Get permissions by role
permissionRouter.get(
  '/byRole?',
  expressAsyncHandler(async (req, res) => {
    const { roleId, subModuleId } = req.query;
    const result = await permissionServices.getSubModulePermission(
      roleId,
      subModuleId
    );
    if (result) {
      return res.status(200).send({ msg: 'Permissions by Role', data: result });
    } else {
      return res.status(200).send({
        msg: 'Data Not Found for the Role',
        data: {
          permissions: {
            add: false,
            edit: false,
            view: false,
            delete: false,
          },
        },
      });
    }
  })
);

// Add a new permission
permissionRouter.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { roleId, subModuleId, permissions } = req.body;
    if (!roleId || !subModuleId || !permissions) {
      return res.status(400).send({ msg: 'Fields Missing' });
    }
    const io = req.app.get('socket');
    let result = await permissionServices.update(
      roleId,
      subModuleId,
      permissions
    );
    if (result) {
      res.status(200).send({ msg: 'Permission added.', data: result });
      try {
        const permissions = await permissionServices.getByRole(roleId);
        io.to('admin').emit('permissionUpdated', { roleId, permissions });
      } catch (err) {
        console.log(err);
      }
      return;
    }
    result = await permissionServices.addNew(roleId, subModuleId, permissions);
    if (result) {
      res.status(200).send({ msg: 'Permission added.', data: result });
      try {
        const permissions = await permissionServices.getByRole(roleId);
        io.to('admin').emit('permissionUpdated', { roleId, permissions });
      } catch (err) {
        console.log(err);
      }
      return;
    } else {
      return res.status(400).send({ msg: 'Permission not added' });
    }
  })
);

// Update permissions
permissionRouter.patch(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!id || !permissions) {
      return res.status(400).send({ msg: 'Fields Missing' });
    }
    const result = await permissionServices.update(id, permissions);
    if (result) {
      return res.status(200).send({ msg: 'Permission updated.', data: result });
    } else {
      return res.status(400).send({ msg: 'Permission not updated' });
    }
  })
);

// Delete permission
permissionRouter.delete(
  '/:id',
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send({ msg: 'Fields Missing' });
    }
    const result = await permissionServices.delete(id);
    if (result) {
      return res.status(200).send({ msg: 'Permission deleted.', data: result });
    } else {
      return res.status(400).send({ msg: 'Permission not deleted' });
    }
  })
);

module.exports = permissionRouter;
