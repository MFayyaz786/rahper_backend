const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const FAQCategoryServices = require("../services/FAQCategoryServices");
const FAQServices = require("../services/FAQServices");
const FAQCategoryRouter = express.Router();

FAQCategoryRouter.post(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
      res.status(400).send({ msg: "Name is required!" });
      return;
    }
    const result = await FAQCategoryServices.new(name);
    if (result) {
      res.status(201).send({ msg: "Category added!", data: result });
    } else {
      res.status(400).send({ msg: "Category not added!" });
    }
  })
);

FAQCategoryRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const result = await FAQCategoryServices.all();
    res.status(200).send({ msg: "Category list!", data: result });
  })
);

FAQCategoryRouter.put(
  "/",
  expressAsyncHandler(async (req, res) => {
    const { categoryId, name } = req.body;
    if (!categoryId || !name) {
      res.status(400).send({ msg: "Name and category Id is required!" });
      return;
    }
    const result = await FAQCategoryServices.update(categoryId, name);
    if (result) {
      res.status(200).send({ msg: "Category updated!", data: result });
    } else {
      res.status(400).send({ msg: "Category not updated!" });
    }
  })
);

FAQCategoryRouter.get(
  "/byId?",
  expressAsyncHandler(async (req, res) => {
    const { categoryId } = req.query;
    if (!categoryId) {
      res.status(400).send({ msg: "Category Id is required!" });
      return;
    }
    const result = await FAQCategoryServices.getById(categoryId);
    if (result) {
      res.status(200).send({ msg: "Category details!", data: result });
    } else {
      res.status(400).send({ msg: "Category not found!" });
    }
  })
);

FAQCategoryRouter.delete(
  "/?",
  expressAsyncHandler(async (req, res) => {
    const { categoryId } = req.query;
    if (!categoryId) {
      res.status(400).send({ msg: "Category Id is required!" });
      return;
    }
    const categoryFAQsCount = await FAQServices.categoryFAQsCount(categoryId);
    if (categoryFAQsCount > 0) {
      res
        .status(400)
        .send({ msg: "Category contains FAQs and can't be deleted!" });
      return;
    }
    const result = await FAQCategoryServices.delete(categoryId);
    if (result) {
      res.status(200).send({ msg: "Category deleted!" });
    } else {
      res.status(400).send({ msg: "Category not deleted!" });
    }
  })
);

module.exports = FAQCategoryRouter;
