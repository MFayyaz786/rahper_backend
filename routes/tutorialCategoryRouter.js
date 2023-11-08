const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const tutorialCategoryServices = require("../services/tutorialCategoryServices");
const FAQServices = require("../services/FAQServices");
const tutoialCategoryRouter = express.Router();

tutoialCategoryRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
      res.status(400).send({ msg: "Name is required!" });
      return;
    }
    const result = await tutorialCategoryServices.new(name);
    if (result) {
      res.status(201).send({ msg: "Category added!", data: result });
    } else {
      res.status(400).send({ msg: "Category not added!" });
    }
  })
);

tutoialCategoryRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const result = await tutorialCategoryServices.all();
    res.status(200).send({ msg: "Category list!", data: result });
  })
);

tutoialCategoryRouter.put(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { categoryId, name } = req.body;
    if (!categoryId || !name) {
      res.status(400).send({ msg: "Name and category Id is required!" });
      return;
    }
    const result = await tutorialCategoryServices.update(categoryId, name);
    if (result) {
      res.status(200).send({ msg: "Category updated!", data: result });
    } else {
      res.status(400).send({ msg: "Category not updated!" });
    }
  })
);

tutoialCategoryRouter.get(
  "/byId?",
  expressAsyncHandler(async (req, res) => {
    const { categoryId } = req.query;
    if (!categoryId) {
      res.status(400).send({ msg: "Category Id is required!" });
      return;
    }
    const result = await tutorialCategoryServices.getById(categoryId);
    if (result) {
      res.status(200).send({ msg: "Category details!", data: result });
    } else {
      res.status(400).send({ msg: "Category not found!" });
    }
  })
);

tutoialCategoryRouter.delete(
  "/?",
  expressAsyncHandler(async (req, res) => {
    const { categoryId } = req.query;
    const result = await tutorialCategoryServices.delete(categoryId);
    if (result.deletedCount === 0) {
      res.status(400).send({ msg: "ID Not Found!" });
      return;
    }
    if (result) {
      res.status(200).send({ msg: "Category deleted!" });
    } else {
      res.status(400).send({ msg: "Category not deleted!" });
    }
  })
);

module.exports = tutoialCategoryRouter;
