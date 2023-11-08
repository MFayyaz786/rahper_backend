const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const roleServices = require('../services/roleServices');
const roleRouter = express.Router();

roleRouter.get(
  '/all',
  expressAsyncHandler(async (req, res) => {
    const result = await roleServices.get();
    if (result.length !== 0) {
      return res.status(200).send({ msg: 'roles', data: result });
    } else {
      return res.status(400).send({ msg: 'Roles Not Found' });
    }
  })
);

roleRouter.post(
  '/roleDetails',
  expressAsyncHandler(async (req, res) => {
    const { roleId } = req.body;
    if (!roleId) {
      return res.status(400).send({ msg: 'Fields Missing' });
    }
    const result = await roleServices.getRoleByID(roleId);
    if (result) {
      return res.status(200).send({ msg: 'Roles', data: result });
    } else {
      return res.status(400).send({ msg: 'Role not found' });
    }
  })
);
roleRouter.post(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { permissionsId, perm_value, role, description } = req.body;
    if (!role || !description || !permissionsId) {
      return res.status(400).send({ msg: 'Fields Missing' });
    }
    const result = await roleServices.addNew(
      permissionsId,
      perm_value,
      role,
      description
    );
    if (result) {
      return res.status(200).send({ msg: 'Role added.', data: result });
    } else {
      return res.status(400).send({ msg: 'Role not added' });
    }
  })
);
roleRouter.put(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { roleId, permissions, perm_value, role, description } = req.body;
    if (!roleId || !role || !description) {
      return res.status(400).send({ msg: 'Fields Missing' });
    }
    const result = await roleServices.update(
      roleId,
      permissions,
      perm_value,
      role,
      description
    );
    if (result) {
      const menu = await roleServices.menu(roleId);
      const io = req.app.get('socket');
      io.to('admin').emit('moduleUpdate', { menu, role: result });
      return res.status(200).send({ msg: 'Role updated.', data: result });
    } else {
      return res.status(400).send({ msg: 'Role not updated' });
    }
  })
);

//not in use
roleRouter.patch(
  '/permissions',
  expressAsyncHandler(async (req, res) => {
    console.log(req.body);
    const { roleId, permissions, perm_value } = req.body;
    if (!roleId || !permissions) {
      return res.status(400).send({ msg: 'Fields Missing' });
    }
    const result = await roleServices.updatePermissions(
      roleId,
      permissions,
      perm_value
    );
    if (result) {
      return res
        .status(200)
        .send({ msg: "Role's permissions updated.", data: result });
    } else {
      return res.status(400).send({ msg: "Role's permission not updated" });
    }
  })
);

roleRouter.delete(
  '/',
  expressAsyncHandler(async (req, res) => {
    const { roleId } = req.body;
    if (!roleId) {
      return res.status(400).send({ msg: 'Fields Missing' });
    }
    const result = await roleServices.delete(roleId);
    if (result.deletedCount == 0) {
      return res.status(400).send({ msg: 'ID Not found' });
    }
    if (result) {
      return res.status(200).send({ msg: 'Role deleted.', data: result });
    } else {
      return res.status(400).send({ msg: 'Role not deleted' });
    }
  })
);

roleRouter.get(
  '/modules?',
  expressAsyncHandler(async (req, res) => {
    const { roleId } = req.query;
    if (!roleId) {
      return res.status(400).send({ msg: 'Please provide role id!' });
    }
    const result = await roleServices.menu(roleId);
    res.status(200).send({ msg: 'Module list', data: result });
  })
);

module.exports = roleRouter;
