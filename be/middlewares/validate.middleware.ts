import type { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";

export const validateProduct = [
  // Product Details
  body("title").notEmpty().withMessage("Product title is required"),
  body("sku").notEmpty().withMessage("SKU is required"),
  body("productType")
    .isIn(["physical", "digital", "service", "bundle"])
    .withMessage("Invalid product type"),

  // Physical Dimensions
  body("weight.value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Weight must be a positive number"),
  body("length.value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Length must be a positive number"),
  body("width.value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Width must be a positive number"),
  body("height.value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Height must be a positive number"),

  // Inventory Planning
  body("emergencyStockLevel")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Emergency stock level must be 0 or greater"),
  body("moq")
    .optional()
    .isInt({ min: 0 })
    .withMessage("MOQ must be 0 or greater"),
  body("productionLeadTime")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Production lead time must be 0 or greater"),
  body("cogs")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("COGS must be 0 or greater"),
  body("retailPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Retail price must be 0 or greater"),
  body("quantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Quantity must be 0 or greater"),

  // Status
  body("status")
    .isIn(["active", "draft", "archived"])
    .withMessage("Invalid status"),

  // Custom validator
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
